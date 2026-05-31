import { useEffect, useState, useCallback } from 'react';
import { SyncManager } from '../services/SyncManager';
import type { AttendanceRecord } from '../types';

export function useSyncManager() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const refreshStatus = useCallback(() => {
    setPendingCount(SyncManager.getPendingRecords().length);
    setRecords(SyncManager.getAllRecords());
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await SyncManager.triggerSync();
    } finally {
      setIsSyncing(false);
      refreshStatus();
    }
  }, [refreshStatus]);

  useEffect(() => {
    // Start listening on mount
    SyncManager.startListening();
    refreshStatus();

    // Set up a polling interval to refresh local counts (every 5 seconds)
    const interval = setInterval(refreshStatus, 5000);

    return () => {
      SyncManager.stopListening();
      clearInterval(interval);
    };
  }, [refreshStatus]);

  return {
    pendingCount,
    isSyncing,
    records,
    triggerSync,
    refreshStatus,
  };
}
