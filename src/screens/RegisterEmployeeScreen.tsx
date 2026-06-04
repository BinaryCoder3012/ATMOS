import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { NitroModules } from 'react-native-nitro-modules';
import { runOnJS } from 'react-native-reanimated';
import { registerEmployee } from '../storage/employeeStore';
import { usePermissions } from '../hooks/usePermissions';
import { useModels } from '../hooks/useModels';
import { preprocessFrame, normalizeFrame } from '../utils/imagePreprocessor';
import { MODEL_INPUT } from '../constants';
import CameraOverlay from '../components/CameraOverlay';
import CameraPermissionPrompt from '../components/CameraPermissionPrompt';

export default function RegisterEmployeeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [name, setName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = frontDevice ?? backDevice;
  const { cameraPermission, requestCameraPermission } = usePermissions();
  const { isLoaded, error: modelError, faceRecognitionModel, faceLandmarkModel } = useModels();
  const faceRecognition = faceRecognitionModel?.state === 'loaded' ? faceRecognitionModel.model : undefined;
  const faceLandmark = faceLandmarkModel?.state === 'loaded' ? faceLandmarkModel.model : undefined;
  const boxedFaceRecognition = useMemo(
    () => (faceRecognition ? NitroModules.box(faceRecognition) : undefined),
    [faceRecognition]
  );
  const boxedFaceLandmark = useMemo(
    () => (faceLandmark ? NitroModules.box(faceLandmark) : undefined),
    [faceLandmark]
  );

  useEffect(() => {
    if (isScanning) {
      requestCameraPermission();
    }
  }, [isScanning, requestCameraPermission]);

  const completeEnrollment = useCallback((embedding: number[]) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsScanning(false);

    registerEmployee({
      name,
      employeeCode,
      department,
      embedding,
    });

    setIsProcessing(false);

    Alert.alert(
      'Registration Success',
      `Registered employee ${name} with biometric face baseline.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }, [name, employeeCode, department, isProcessing, navigation]);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      if (!boxedFaceRecognition || !boxedFaceLandmark) {
        return;
      }

      try {
        const recognitionModel = boxedFaceRecognition.unbox();
        const landmarkModel = boxedFaceLandmark.unbox();
        const buffer = frame.toArrayBuffer();
        const rawBytes = new Uint8Array(buffer);

        // Detect landmarks first to verify a face is present
        const landmarkBytes = preprocessFrame(rawBytes, frame.width, frame.height, 256, 256);
        const landmarkInput = normalizeFrame(landmarkBytes, 0, 1, true);
        const landmarkOutputs = landmarkModel.runSync([landmarkInput.buffer as ArrayBuffer]);

        if (landmarkOutputs && landmarkOutputs.length > 0) {
          // Face detected, generate baseline embedding
          const recBytes = preprocessFrame(rawBytes, frame.width, frame.height, 112, 112);
          const recInput = normalizeFrame(recBytes, MODEL_INPUT.MEAN, MODEL_INPUT.STD, false);
          const recOutputs = recognitionModel.runSync([recInput.buffer as ArrayBuffer]);

          if (recOutputs && recOutputs.length > 0) {
            const embedding = Array.from(new Float32Array(recOutputs[0]));
            runOnJS(completeEnrollment)(embedding);
          }
        }
      } catch {
        // Fail silently in worklet loop
      }
    },
    [boxedFaceRecognition, boxedFaceLandmark, completeEnrollment]
  );

  const handleRegisterPress = () => {
    if (!name.trim() || !employeeCode.trim() || !department.trim()) {
      Alert.alert('Fields Required', 'Please enter Name, Employee Code, and Department.');
      return;
    }
    // Launch camera scan mode
    setIsScanning(true);
  };

  const handleSimulateCapture = () => {
    const mockEmbedding = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    completeEnrollment(mockEmbedding);
  };

  if (isScanning) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          {cameraPermission !== 'granted' && cameraPermission !== 'loading' ? (
            <CameraPermissionPrompt
              status={cameraPermission}
              onRequestPermission={requestCameraPermission}
            />
          ) : cameraPermission === 'granted' && device && isLoaded ? (
            <View style={StyleSheet.absoluteFill}>
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isFocused && isScanning && !isProcessing}
                frameProcessor={frameProcessor}
                pixelFormat="rgb"
              />
              <CameraOverlay
                livenessMethod={null}
                livenessState={{ isComplete: true, isTimedOut: false, blinkCount: 0 }}
                instructionText="Align face within guide to scan baseline"
                promptPlacement="top"
              />
              <View style={styles.simulateOverlayContainer}>
                <TouchableOpacity
                  style={styles.simulateOverlayButton}
                  onPress={handleSimulateCapture}
                >
                  <Text style={styles.simulateOverlayButtonText}>
                    Simulate Capture (Mock Embedding)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelOverlayButton}
                  onPress={() => setIsScanning(false)}
                >
                  <Text style={styles.cancelOverlayButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>
                {modelError ? modelError : 'Opening camera stream & models...'}
              </Text>
              <TouchableOpacity
                style={[styles.simulateOverlayButton, styles.loadingActionButton]}
                onPress={handleSimulateCapture}
              >
                <Text style={styles.simulateOverlayButtonText}>
                  Simulate Capture (Mock Embedding)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelOverlayButton, styles.loadingCancelButton]}
                onPress={() => setIsScanning(false)}
              >
                <Text style={styles.cancelOverlayButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Personnel Enrollment</Text>
      <Text style={styles.desc}>
        Enroll field workers by registering their baseline identification details.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Doe"
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Employee Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. EMP-104"
          placeholderTextColor="#475569"
          value={employeeCode}
          onChangeText={setEmployeeCode}
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Operations"
          placeholderTextColor="#475569"
          value={department}
          onChangeText={setDepartment}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegisterPress}>
          <Text style={styles.buttonText}>Register Baseline Embedding</Text>
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
  form: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  simulateOverlayContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  simulateOverlayButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  simulateOverlayButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelOverlayButton: {
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  loadingActionButton: {
    marginTop: 24,
  },
  loadingCancelButton: {
    marginTop: 12,
  },
  cancelOverlayButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
