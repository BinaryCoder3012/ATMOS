import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ENV } from '../config/env';

export default function SettingsScreen() {
  const [syncEndpoint, setSyncEndpoint] = useState(ENV.AWS_SYNC_ENDPOINT);
  const [apiKey, setApiKey] = useState(ENV.AWS_API_KEY);
  const [similarityThreshold, setSimilarityThreshold] = useState(ENV.SIMILARITY_THRESHOLD.toString());
  const [earThreshold, setEarThreshold] = useState(ENV.EAR_BLINK_THRESHOLD.toString());
  const [marThreshold, setMarThreshold] = useState(ENV.MAR_SMILE_THRESHOLD.toString());

  const handleSave = () => {
    const sim = parseFloat(similarityThreshold);
    const ear = parseFloat(earThreshold);
    const mar = parseFloat(marThreshold);

    if (isNaN(sim) || sim < 0 || sim > 1) {
      Alert.alert('Invalid Value', 'Similarity Threshold must be a number between 0 and 1.');
      return;
    }
    if (isNaN(ear) || ear < 0 || ear > 1) {
      Alert.alert('Invalid Value', 'EAR Threshold must be a number between 0 and 1.');
      return;
    }
    if (isNaN(mar) || mar < 0 || mar > 1) {
      Alert.alert('Invalid Value', 'MAR Threshold must be a number between 0 and 1.');
      return;
    }

    ENV.setAWS_SYNC_ENDPOINT(syncEndpoint);
    ENV.setAWS_API_KEY(apiKey);
    ENV.setSIMILARITY_THRESHOLD(sim);
    ENV.setEAR_BLINK_THRESHOLD(ear);
    ENV.setMAR_SMILE_THRESHOLD(mar);

    Alert.alert('Settings Saved', 'Biometric parameters and API configurations updated successfully.');
  };

  const handleReset = () => {
    ENV.resetToDefaults();
    setSyncEndpoint(ENV.AWS_SYNC_ENDPOINT);
    setApiKey(ENV.AWS_API_KEY);
    setSimilarityThreshold(ENV.SIMILARITY_THRESHOLD.toString());
    setEarThreshold(ENV.EAR_BLINK_THRESHOLD.toString());
    setMarThreshold(ENV.MAR_SMILE_THRESHOLD.toString());
    Alert.alert('Settings Reset', 'Configuration values reset to default .env values.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>System Configurations</Text>
      <Text style={styles.desc}>
        Fine-tune on-device AI algorithms and sync servers. No hardcoded credentials.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Biometric AI Tuning</Text>

        <Text style={styles.label}>Face Match Similarity Threshold</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={similarityThreshold}
          onChangeText={setSimilarityThreshold}
          placeholder="e.g. 0.85"
          placeholderTextColor="#475569"
        />

        <Text style={styles.label}>Eye Aspect Ratio (EAR) Blink Limit</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={earThreshold}
          onChangeText={setEarThreshold}
          placeholder="e.g. 0.20"
          placeholderTextColor="#475569"
        />

        <Text style={styles.label}>Mouth Aspect Ratio (MAR) Smile Limit</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={marThreshold}
          onChangeText={setMarThreshold}
          placeholder="e.g. 0.60"
          placeholderTextColor="#475569"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>AWS Cloud Sync Config</Text>

        <Text style={styles.label}>AWS API Gateway Endpoint</Text>
        <TextInput
          style={styles.input}
          value={syncEndpoint}
          onChangeText={setSyncEndpoint}
          placeholder="https://..."
          placeholderTextColor="#475569"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>AWS API Key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter API key"
          placeholderTextColor="#475569"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetBtnText}>Restore .env Defaults</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 16,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
