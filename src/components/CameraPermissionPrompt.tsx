import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CameraPermissionStatus = 'granted' | 'denied' | 'unavailable' | 'blocked' | 'loading';

interface CameraPermissionPromptProps {
  status: CameraPermissionStatus;
  onRequestPermission: () => Promise<boolean>;
}

export default function CameraPermissionPrompt({
  status,
  onRequestPermission,
}: CameraPermissionPromptProps) {
  const isBlocked = status === 'blocked';
  const isUnavailable = status === 'unavailable';

  const message = isUnavailable
    ? 'Camera access is unavailable on this device.'
    : isBlocked
    ? 'Camera access is blocked. Enable it in system settings to use face authentication.'
    : 'Camera access is required to scan and authenticate personnel.';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Permission Required</Text>
      <Text style={styles.message}>{message}</Text>
      {!isUnavailable && (
        <TouchableOpacity
          style={styles.button}
          onPress={isBlocked ? Linking.openSettings : onRequestPermission}
        >
          <Text style={styles.buttonText}>
            {isBlocked ? 'Open Settings' : 'Allow Camera Access'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
