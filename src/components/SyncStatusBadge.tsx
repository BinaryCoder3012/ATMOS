import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SyncStatusBadgeProps {
  pendingCount: number;
}

export default function SyncStatusBadge({ pendingCount }: SyncStatusBadgeProps) {
  if (pendingCount === 0) {
    return (
      <View style={[styles.badge, styles.synced]}>
        <Text style={[styles.dot, { color: '#10B981' }]}>●</Text>
        <Text style={styles.text}>All Synced</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.pending]}>
      <Text style={[styles.dot, { color: '#F59E0B' }]}>●</Text>
      <Text style={styles.text}>{pendingCount} Pending Sync</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  synced: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  dot: {
    fontSize: 10,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
});
