/**
 * SyncManager: Offline-to-online attendance synchronization with AWS.
 *
 * Architecture:
 *  1. Attendance records are saved to MMKV with status: 'pending'.
 *  2. NetInfo listener detects network restoration.
 *  3. All 'pending' records are batch-POSTed to AWS endpoint (from .env).
 *  4. ONLY on HTTP 200 OK response, records are purged from MMKV.
 *  5. On failure, records remain in MMKV and retry occurs on next connection.
 *
 * CRITICAL: The purge is CONDITIONAL. Records are NEVER deleted unless
 * the server confirms receipt with a 200 status.
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { generateSimpleUUID } from '../storage/employeeStore';
import { ENV } from '../config/env';
import { store, storeJSON, loadJSON } from '../storage/mmkvStore';
import { STORAGE_KEYS } from '../constants';
import type { AttendanceRecord, SyncPayload } from '../types';

class SyncManagerService {
  private unsubscribeNetInfo: (() => void) | null = null;
  private isSyncing = false;
  private deviceId: string;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let id = store.getString(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = generateSimpleUUID();
      store.set(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  }

  /** Start listening for network restoration */
  public startListening(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener(
      (state: NetInfoState) => {
        if (state.isConnected && state.isInternetReachable) {
          this.triggerSync();
        }
      }
    );
    console.log('[SyncManager] Started network listener.');
  }

  /** Stop listening (call on app background or unmount) */
  public stopListening(): void {
    this.unsubscribeNetInfo?.();
    this.unsubscribeNetInfo = null;
    console.log('[SyncManager] Stopped network listener.');
  }

  /** Save a new attendance record to the offline queue */
  public logAttendance(record: Omit<AttendanceRecord, 'id' | 'syncStatus'>): AttendanceRecord {
    const fullRecord: AttendanceRecord = {
      ...record,
      id: generateSimpleUUID(),
      syncStatus: 'pending',
    };

    storeJSON(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${fullRecord.id}`, fullRecord);

    const list = loadJSON<string[]>(STORAGE_KEYS.ATTENDANCE_LIST) ?? [];
    list.push(fullRecord.id);
    storeJSON(STORAGE_KEYS.ATTENDANCE_LIST, list);

    console.log(`[SyncManager] Logged attendance: ${fullRecord.id}`);
    return fullRecord;
  }

  /** Retrieve all pending attendance records */
  public getPendingRecords(): AttendanceRecord[] {
    const list = loadJSON<string[]>(STORAGE_KEYS.ATTENDANCE_LIST) ?? [];
    return list
      .map(id => loadJSON<AttendanceRecord>(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`))
      .filter((r): r is AttendanceRecord => r !== null && (r.syncStatus === 'pending' || r.syncStatus === 'failed'));
  }

  /** Get all attendance records (for display in logs screen) */
  public getAllRecords(): AttendanceRecord[] {
    const list = loadJSON<string[]>(STORAGE_KEYS.ATTENDANCE_LIST) ?? [];
    return list
      .map(id => loadJSON<AttendanceRecord>(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`))
      .filter((r): r is AttendanceRecord => r !== null);
  }

  /** Manually trigger a sync attempt */
  public async triggerSync(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress — skipping.');
      return { synced: 0, failed: 0 };
    }

    const pending = this.getPendingRecords();
    if (pending.length === 0) {
      console.log('[SyncManager] No pending records to sync.');
      return { synced: 0, failed: 0 };
    }

    if (!ENV.AWS_SYNC_ENDPOINT) {
      console.warn('[SyncManager] AWS_SYNC_ENDPOINT not configured in .env — cannot sync.');
      return { synced: 0, failed: pending.length };
    }

    this.isSyncing = true;
    console.log(`[SyncManager] Syncing ${pending.length} records to AWS...`);

    const payload: SyncPayload = {
      deviceId: this.deviceId,
      records: pending,
      syncedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(ENV.AWS_SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ENV.AWS_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200) {
        // Mark records as successfully synced locally
        const syncedIds = pending.map(r => r.id);
        this.markRecordsAsSynced(syncedIds);

        // Prune synced records older than 30 days to save space
        this.pruneSyncedRecords(30);

        store.set(STORAGE_KEYS.LAST_SYNC_AT, new Date().toISOString());
        console.log(`[SyncManager] ✅ Synced ${syncedIds.length} records.`);
        return { synced: syncedIds.length, failed: 0 };
      } else {
        console.error(`[SyncManager] ❌ Server returned ${response.status}. Records NOT updated.`);
        this.markRecordsAsFailed(pending.map(r => r.id));
        return { synced: 0, failed: pending.length };
      }
    } catch (error) {
      console.error('[SyncManager] Network error during sync:', error);
      return { synced: 0, failed: pending.length };
    } finally {
      this.isSyncing = false;
    }
  }

  /** Mark specific records by ID as synced */
  private markRecordsAsSynced(ids: string[]): void {
    for (const id of ids) {
      const record = loadJSON<AttendanceRecord>(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`);
      if (record) {
        storeJSON(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`, {
          ...record,
          syncStatus: 'synced',
          syncAttemptedAt: new Date().toISOString(),
        });
      }
    }
  }

  /** Prune synced records older than the specified retention window (default 30 days) */
  public pruneSyncedRecords(daysToKeep: number = 30): void {
    const list = loadJSON<string[]>(STORAGE_KEYS.ATTENDANCE_LIST) ?? [];
    const now = Date.now();
    const thresholdMs = daysToKeep * 24 * 60 * 60 * 1000;
    const idsToKeep: string[] = [];

    for (const id of list) {
      const record = loadJSON<AttendanceRecord>(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`);
      if (record) {
        const recordAgeMs = now - new Date(record.timestamp).getTime();
        // If it is synced and older than the threshold, delete it from storage
        if (record.syncStatus === 'synced' && recordAgeMs > thresholdMs) {
          store.remove(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`);
          console.log(`[SyncManager] Pruned old synced record: ${id}`);
        } else {
          idsToKeep.push(id);
        }
      }
    }

    storeJSON(STORAGE_KEYS.ATTENDANCE_LIST, idsToKeep);
  }

  /** Mark records as failed (keeps them in queue for retry) */
  private markRecordsAsFailed(ids: string[]): void {
    for (const id of ids) {
      const record = loadJSON<AttendanceRecord>(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`);
      if (record) {
        storeJSON(`${STORAGE_KEYS.ATTENDANCE_PREFIX}${id}`, {
          ...record,
          syncStatus: 'failed',
          syncAttemptedAt: new Date().toISOString(),
        });
      }
    }
  }
}

export const SyncManager = new SyncManagerService();
