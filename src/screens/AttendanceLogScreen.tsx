import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSyncManager } from '../hooks/useSyncManager';
import type { AttendanceRecord } from '../types';

export default function AttendanceLogScreen() {
  const { records, pendingCount, isSyncing, triggerSync } = useSyncManager();

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const isSynced = item.syncStatus === 'synced';
    const isFailed = item.syncStatus === 'failed';

    return (
      <View style={styles.logCard}>
        <View style={styles.logCardContent}>
          <View style={styles.avatarContainer}>
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.logAvatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.placeholderText}>
                  {item.employeeName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logHeader}>
              <Text style={styles.logName} numberOfLines={1}>{item.employeeName}</Text>
              <View
                style={[
                  styles.syncIndicator,
                  isSynced ? styles.syncedBg : isFailed ? styles.failedBg : styles.pendingBg,
                ]}
              >
                <Text
                  style={[
                    styles.syncText,
                    isSynced ? styles.syncedText : isFailed ? styles.failedText : styles.pendingText,
                  ]}
                >
                  {item.syncStatus.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.logDetail}>Code: {item.employeeCode}</Text>
            <Text style={styles.logDetail}>
              Time: {new Date(item.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.logDetail}>
              Liveness: {item.livenessMethod === 'blink' ? 'Blink Challenge' : 'Smile Challenge'}
            </Text>
            <Text style={styles.logDetail}>
              Score: {(item.similarityScore * 100).toFixed(1)}% match similarity
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.syncHeader}>
        <View>
          <Text style={styles.logsCount}>{records.length} Total Logs</Text>
          <Text style={styles.pendingCount}>{pendingCount} Pending Sync</Text>
        </View>
        {pendingCount > 0 && (
          <TouchableOpacity
            style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
            onPress={triggerSync}
            disabled={isSyncing}
          >
            <Text style={styles.syncBtnText}>
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No attendance records logged yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  syncHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#111827',
  },
  logsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pendingCount: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  syncBtnDisabled: {
    backgroundColor: '#312E81',
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  logCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  syncIndicator: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  syncedBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  failedBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  pendingBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  syncText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  syncedText: {
    color: '#10B981',
  },
  failedText: {
    color: '#EF4444',
  },
  pendingText: {
    color: '#F59E0B',
  },
  logDetail: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  logCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  logAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  placeholderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#818CF8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logInfo: {
    flex: 1,
  },
});
