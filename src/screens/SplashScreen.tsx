import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useModels } from '../hooks/useModels';
import { usePermissions } from '../hooks/usePermissions';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export default function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isLoaded, error: modelError } = useModels();
  const { cameraPermission, requestCameraPermission } = usePermissions();

  useEffect(() => {
    async function init() {
      if (modelError) {
        Alert.alert('Model Load Error', modelError);
        return;
      }

      if (isLoaded) {
        // Models loaded! Now check permissions
        if (cameraPermission === 'denied') {
          const granted = await requestCameraPermission();
          if (!granted) {
            Alert.alert('Camera Required', 'Camera permission is required to authenticate personnel.');
          }
        }

        // Navigate to MainTabs and reset navigation stack
        const timer = setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            })
          );
        }, 1500);

        return () => clearTimeout(timer);
      }
    }

    init();
  }, [isLoaded, modelError, cameraPermission, requestCameraPermission, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>A.T.M.O.S</Text>
      <Text style={styles.subtitle}>AUTONOMOUS TELEMETRY & MOBILE OFFLINE SYNC</Text>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>
          {!isLoaded ? 'Initializing Edge AI models...' : 'Loading application...'}
        </Text>
      </View>
      <Text style={styles.footer}>HACKATHON 7.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818CF8',
    letterSpacing: 3,
    marginBottom: 60,
  },
  loadingBox: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#374151',
    letterSpacing: 2,
  },
});
