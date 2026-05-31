import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useSyncManager } from '../hooks/useSyncManager';
import SyncStatusBadge from '../components/SyncStatusBadge';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { pendingCount, isSyncing, triggerSync } = useSyncManager();

  const handleSync = async () => {
    if (pendingCount === 0) {
      Alert.alert('Synced', 'All attendance logs are already synced.');
      return;
    }
    await triggerSync();
    Alert.alert('Sync Processed', 'Offline logs sync check complete.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>A.T.M.O.S</Text>
          <Text style={styles.subtitle}>Autonomous Telemetry &amp; Mobile Offline Sync</Text>
        </View>
        <SyncStatusBadge pendingCount={pendingCount} />
      </View>

      {/* Main Action Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[styles.card, styles.authCard]}
          onPress={() => navigation.navigate('Authenticate')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🔑</Text>
            <View style={styles.badgeLabel}>
              <Text style={styles.badgeText}>OFFLINE</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Authenticate Face</Text>
          <Text style={styles.cardDesc}>
            Verify identity using local facial recognition and anti-spoofing challenge.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('RegisterEmployee')}
        >
          <Text style={styles.cardEmoji}>👤</Text>
          <Text style={styles.cardTitle}>Register Employee</Text>
          <Text style={styles.cardDesc}>
            Capture face embeddings and create a baseline local profile.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.cardEmoji}>📋</Text>
          <Text style={styles.cardTitle}>Personnel & Logs</Text>
          <Text style={styles.cardDesc}>
            Manage registered employees, view attendance logs, and monitor sync status.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.cardEmoji}>⚙️</Text>
          <Text style={styles.cardTitle}>System Settings</Text>
          <Text style={styles.cardDesc}>
            Adjust thresholds, customize environment parameters, and view diagnostic data.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sync Operations */}
      <View style={styles.syncCard}>
        <Text style={styles.syncTitle}>Cloud Synchronization</Text>
        <Text style={styles.syncDesc}>
          Pending records are automatically uploaded when a connection is established. You can also trigger sync manually.
        </Text>
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync Attendance Logs Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#818CF8',
    marginTop: 2,
  },
  menuContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  authCard: {
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeLabel: {
    backgroundColor: '#6366F1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.0,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  syncCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  syncDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#312E81',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
