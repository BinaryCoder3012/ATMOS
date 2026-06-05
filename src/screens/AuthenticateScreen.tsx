/**
 * AuthenticateScreen: The primary offline authentication screen.
 *
 * FIXES APPLIED (2026-06-05):
 *  1. Defaults to Simulation Mode — Live Camera is opt-in to avoid OOM on emulators.
 *  2. Models are loaded lazily (only when camera mode is active).
 *  3. Frame processor is throttled — inference runs at most once every 200ms.
 *  4. The Camera isActive flag is tightened to also require !isSimulationMode.
 *  5. Entire camera section wrapped in an ErrorBoundary to prevent full app crashes.
 *  6. runOnJS guards added so worklet errors don't propagate to the JS thread.
 *
 * User flow:
 *  1. Screen opens in Interactive Simulator by default.
 *  2. User can switch to Live Camera (real device only) via the tab header.
 *  3. Liveness challenge displayed ("Please blink" or "Please smile").
 *  4. EAR/MAR monitored in Frame Processor.
 *  5. Face recognition runs — cosine similarity computed.
 *  6. Result shown: SUCCESS (name + score) or FAILURE.
 *  7. Attendance record queued in MMKV.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import {
  Camera, useCameraDevice, useFrameProcessor,
} from 'react-native-vision-camera';
import { NitroModules } from 'react-native-nitro-modules';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useModels } from '../hooks/useModels';
import { usePermissions } from '../hooks/usePermissions';
import { useLiveness } from '../hooks/useLiveness';
import { SyncManager } from '../services/SyncManager';
import { useIsFocused } from '@react-navigation/native';
import { getEmployeeById, getAllEmployees } from '../storage/employeeStore';
import { runAuthPipeline } from '../services/AuthService';
import { preprocessFrame, normalizeFrame } from '../utils/imagePreprocessor';
import { ENV } from '../config/env';
import { MODEL_INPUT } from '../constants';
import { logAuthBenchmark, createTimingMarks } from '../utils/logger';
import CameraOverlay from '../components/CameraOverlay';
import CameraPermissionPrompt from '../components/CameraPermissionPrompt';
import LivenessIndicator from '../components/LivenessIndicator';
import ConfidenceBar from '../components/ConfidenceBar';
import EmployeeCard from '../components/EmployeeCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { AuthResult, Employee } from '../types';

// ─── Frame-processor throttle ────────────────────────────────────────────────
// Running TFLite inference every frame (~30fps) is catastrophic on emulators.
// We only process a frame once every FRAME_SKIP_MS milliseconds.
const FRAME_SKIP_MS = 200;

export default function AuthenticateScreen() {
  const isFocused = useIsFocused();

  // Default to simulation mode — Live Camera is opt-in.
  // This prevents OOM crashes when the screen mounts on an emulator.
  const [isSimulationMode, setIsSimulationMode] = useState(true);

  // Only load the heavy TFLite models when the user actively selects camera mode.
  const { isLoaded, error: modelError, faceRecognitionModel, faceLandmarkModel } =
    useModels(!isSimulationMode);

  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = frontDevice ?? backDevice;

  const { cameraPermission, requestCameraPermission } = usePermissions();
  const {
    livenessState,
    confirmBlink,
    confirmSmile,
    resetLiveness,
  } = useLiveness();

  const faceRecognition =
    faceRecognitionModel?.state === 'loaded' ? faceRecognitionModel.model : undefined;
  const faceLandmark =
    faceLandmarkModel?.state === 'loaded' ? faceLandmarkModel.model : undefined;

  const boxedFaceRecognition = useMemo(
    () => (faceRecognition ? NitroModules.box(faceRecognition) : undefined),
    [faceRecognition],
  );
  const boxedFaceLandmark = useMemo(
    () => (faceLandmark ? NitroModules.box(faceLandmark) : undefined),
    [faceLandmark],
  );

  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Live Metrics
  const [liveEAR, setLiveEAR] = useState(0.3);
  const [liveMAR, setLiveMAR] = useState(0.15);

  // Simulation Controls
  const [registeredEmployees, setRegisteredEmployees] = useState<Employee[]>([]);
  const [selectedSimEmployee, setSelectedSimEmployee] = useState<Employee | null>(null);

  const timingRef = useRef(createTimingMarks());

  // Throttle shared value — must be a Reanimated shared value to be
  // accessible inside the 'worklet' frame processor (runs on UI thread).
  const lastFrameTime = useSharedValue<number>(0);

  const loadData = useCallback(() => {
    const list = getAllEmployees();
    setRegisteredEmployees(list);
    if (list.length > 0) {
      setSelectedSimEmployee(list[0]);
    }
  }, []);

  useEffect(() => {
    requestCameraPermission();
    resetLiveness(isSimulationMode);
    loadData();
    timingRef.current = createTimingMarks();
  }, [requestCameraPermission, resetLiveness, loadData, isSimulationMode]);

  // JS callbacks to update state from the Frame Processor
  const updateMetrics = useCallback((ear: number, mar: number) => {
    setLiveEAR(ear);
    setLiveMAR(mar);
  }, []);

  const completeAuth = useCallback(
    (embedding: number[], matchResult: { id: string; score: number } | null) => {
      if (isProcessing) return;
      setIsProcessing(true);

      const marks = { ...timingRef.current, end: Date.now() };

      if (matchResult) {
        const employee = getEmployeeById(matchResult.id);
        if (employee) {
          const result: AuthResult = {
            success: true,
            employee,
            similarityScore: matchResult.score,
            livenessMethod: livenessState.method ?? 'blink',
            processingTimeMs: marks.end - marks.start,
          };
          setAuthResult(result);
          SyncManager.logAttendance({
            employeeId: employee.id,
            employeeCode: employee.employeeCode,
            employeeName: employee.name,
            timestamp: new Date().toISOString(),
            livenessMethod: result.livenessMethod ?? 'blink',
            similarityScore: result.similarityScore ?? 0,
          });
          logAuthBenchmark(marks);
          return;
        }
      }

      setAuthResult({
        success: false,
        errorCode: 'NO_MATCH',
        errorMessage: 'Face match similarity score below threshold.',
        processingTimeMs: marks.end - marks.start,
      });
    },
    [isProcessing, livenessState.method],
  );

  // JSI Worklet Frame Processor — throttled to FRAME_SKIP_MS
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      if (!boxedFaceRecognition || !boxedFaceLandmark) return;

      // Throttle: skip this frame if we processed one recently
      const now = Date.now();
      if (now - lastFrameTime.value < FRAME_SKIP_MS) return;
      lastFrameTime.value = now;

      try {
        const recognitionModel = boxedFaceRecognition.unbox();
        const landmarkModel = boxedFaceLandmark.unbox();
        const buffer = frame.toArrayBuffer();
        const rawBytes = new Uint8Array(buffer);

        // Landmark inference
        const landmarkBytes = preprocessFrame(rawBytes, frame.width, frame.height, 256, 256);
        const landmarkInput = normalizeFrame(landmarkBytes, 0, 1, true);
        const landmarkOutputs = landmarkModel.runSync([landmarkInput.buffer as ArrayBuffer]);

        if (landmarkOutputs && landmarkOutputs.length > 0) {
          const landmarksFloat = new Float32Array(landmarkOutputs[0]);

          let recOutput = new Float32Array(0);
          if (livenessState.isComplete) {
            const recBytes = preprocessFrame(rawBytes, frame.width, frame.height, 112, 112);
            const recInput = normalizeFrame(recBytes, MODEL_INPUT.MEAN, MODEL_INPUT.STD, false);
            const recOutputs = recognitionModel.runSync([recInput.buffer as ArrayBuffer]);
            if (recOutputs && recOutputs.length > 0) {
              recOutput = new Float32Array(recOutputs[0]);
            }
          }

          // Consolidated worklet-safe ML pipeline execution
          const pipelineResult = runAuthPipeline(
            landmarksFloat,
            recOutput,
            livenessState.isComplete
          );

          runOnJS(updateMetrics)(pipelineResult.ear, pipelineResult.mar);

          if (pipelineResult.blinkDetected) runOnJS(confirmBlink)();
          if (pipelineResult.smileDetected) runOnJS(confirmSmile)();

          if (livenessState.isComplete && pipelineResult.embedding && pipelineResult.matchResult) {
            runOnJS(completeAuth)(pipelineResult.embedding, pipelineResult.matchResult);
          }
        }
      } catch {
        // Fail silently in worklet loop — never crash the frame processor thread
      }
    },
    [boxedFaceRecognition, boxedFaceLandmark, livenessState, confirmBlink, confirmSmile, updateMetrics, completeAuth, lastFrameTime],
  );

  // Simulated triggers for demo/emulator
  const handleSimulatedAction = (action: 'blink' | 'smile' | 'face') => {
    if (action === 'blink') {
      setLiveEAR(0.12);
      confirmBlink();
      setTimeout(() => setLiveEAR(0.3), 500);
    } else if (action === 'smile') {
      setLiveMAR(0.72);
      confirmSmile();
      setTimeout(() => setLiveMAR(0.15), 500);
    } else if (action === 'face') {
      if (!livenessState.isComplete) {
        Alert.alert('Liveness Required', 'Complete the liveness check first.');
        return;
      }
      if (!selectedSimEmployee) {
        Alert.alert('No Employees', 'Please register an employee first.');
        return;
      }
      setIsProcessing(true);
      const simScore = 0.88;
      const marks = { ...timingRef.current, end: Date.now() };
      setTimeout(() => {
        setIsProcessing(false);
        const result: AuthResult = {
          success: true,
          employee: selectedSimEmployee,
          similarityScore: simScore,
          livenessMethod: livenessState.method ?? 'blink',
          processingTimeMs: marks.end - marks.start,
        };
        setAuthResult(result);
        SyncManager.logAttendance({
          employeeId: selectedSimEmployee.id,
          employeeCode: selectedSimEmployee.employeeCode,
          employeeName: selectedSimEmployee.name,
          timestamp: new Date().toISOString(),
          livenessMethod: result.livenessMethod ?? 'blink',
          similarityScore: simScore,
        });
      }, 300);
    }
  };

  const handleReset = () => {
    setAuthResult(null);
    setIsProcessing(false);
    resetLiveness(isSimulationMode);
    timingRef.current = createTimingMarks();
  };

  const switchToCamera = () => {
    setIsSimulationMode(false);
    resetLiveness(false);
  };

  const switchToSimulator = () => {
    setIsSimulationMode(true);
    resetLiveness(true);
  };

  return (
    <View style={styles.container}>
      {/* Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, !isSimulationMode && styles.activeTab]}
          onPress={switchToCamera}
        >
          <Text style={styles.tabText}>Live Camera Stream</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, isSimulationMode && styles.activeTab]}
          onPress={switchToSimulator}
        >
          <Text style={styles.tabText}>Interactive Simulator</Text>
        </TouchableOpacity>
      </View>

      {!isSimulationMode ? (
        <ErrorBoundary
          fallbackMessage="Camera or ML pipeline crashed. Switch to Interactive Simulator to test without a camera."
          onReset={switchToSimulator}
        >
          <View style={styles.cameraContainer}>
            {cameraPermission !== 'granted' && cameraPermission !== 'loading' ? (
              <CameraPermissionPrompt
                status={cameraPermission}
                onRequestPermission={requestCameraPermission}
              />
            ) : cameraPermission === 'granted' && device ? (
              isLoaded ? (
                <View style={StyleSheet.absoluteFill}>
                  <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isFocused && !isSimulationMode && !authResult && !isProcessing}
                    frameProcessor={frameProcessor}
                    pixelFormat="rgb"
                  />
                  <CameraOverlay
                    livenessMethod={livenessState.method}
                    livenessState={livenessState}
                    instructionText={
                      livenessState.isComplete
                        ? 'Liveness verified. Scanning face...'
                        : livenessState.method === 'blink'
                        ? 'Please BLINK to authenticate'
                        : 'Please SMILE to authenticate'
                    }
                  />
                </View>
              ) : modelError ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.errorEmoji}>⚠️</Text>
                  <Text style={styles.errorLoadText}>{modelError}</Text>
                  <TouchableOpacity style={styles.fallbackBtn} onPress={switchToSimulator}>
                    <Text style={styles.fallbackBtnText}>Switch to Simulator</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.loadingText}>Loading ML models...</Text>
                </View>
              )
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Opening camera...</Text>
              </View>
            )}
          </View>
        </ErrorBoundary>
      ) : (
        /* ── Simulation Mode ── */
        <ScrollView style={styles.simulatorScroll} contentContainerStyle={styles.simulatorContent}>
          <Text style={styles.sectionTitle}>Facial Biometric Simulation</Text>
          <Text style={styles.sectionDesc}>
            Simulate facial tracking and edge inference values to test liveness triggers and
            SQLite/MMKV persistence logic.
          </Text>

          <LivenessIndicator
            method={livenessState.method}
            earValue={liveEAR}
            marValue={liveMAR}
            earThreshold={ENV.EAR_BLINK_THRESHOLD}
            marThreshold={ENV.MAR_SMILE_THRESHOLD}
          />

          <View style={styles.controlsCard}>
            <Text style={styles.controlTitle}>Simulation Control Board</Text>
            <View style={styles.simButtonsRow}>
              <TouchableOpacity
                style={[styles.simButton, livenessState.method !== 'blink' && styles.disabledSimBtn]}
                onPress={() => handleSimulatedAction('blink')}
                disabled={livenessState.method !== 'blink' || livenessState.isComplete}
              >
                <Text style={styles.simBtnText}>Simulate Blink 👁️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.simButton, livenessState.method !== 'smile' && styles.disabledSimBtn]}
                onPress={() => handleSimulatedAction('smile')}
                disabled={livenessState.method !== 'smile' || livenessState.isComplete}
              >
                <Text style={styles.simBtnText}>Simulate Smile 😊</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <Text style={styles.controlTitle}>Target Identity to Match</Text>
            {registeredEmployees.length > 0 ? (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeSelector}>
                  {registeredEmployees.map(emp => (
                    <TouchableOpacity
                      key={emp.id}
                      style={[
                        styles.empBadge,
                        selectedSimEmployee?.id === emp.id && styles.selectedEmpBadge,
                      ]}
                      onPress={() => setSelectedSimEmployee(emp)}
                    >
                      <Text style={styles.empBadgeText}>{emp.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.actionButton, !livenessState.isComplete && styles.disabledSimBtn]}
                  onPress={() => handleSimulatedAction('face')}
                  disabled={!livenessState.isComplete || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>Verify Simulated Identity</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  No employees registered. Go to Register Employee first.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Result Bottom Sheet */}
      {authResult && (
        <View style={styles.resultContainer}>
          <ScrollView
            style={styles.resultScroll}
            contentContainerStyle={styles.resultCard}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.resultHeader, { color: authResult.success ? '#10B981' : '#EF4444' }]}>
              {authResult.success ? 'Authentication Success ✓' : 'Authentication Failed ✗'}
            </Text>
            {authResult.success && authResult.employee ? (
              <View style={styles.fullWidth}>
                <EmployeeCard employee={authResult.employee} />
                <ConfidenceBar
                  score={authResult.similarityScore ?? 0}
                  threshold={ENV.SIMILARITY_THRESHOLD}
                />
              </View>
            ) : (
              <Text style={styles.errorText}>
                {authResult.errorMessage || 'Unknown facial authentication error.'}
              </Text>
            )}
            <Text style={styles.benchmarkText}>
              Inference Speed: {authResult.processingTimeMs || 120}ms (Target: &lt;1000ms)
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset Pipeline</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  tabHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1E293B',
    padding: 6,
    borderRadius: 12,
    margin: 16,
    gap: 6,
    zIndex: 1000,
    elevation: 1000,
  },
  tabButton: {
    flex: 1,
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: { backgroundColor: '#334155' },
  tabText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  cameraContainer: { flex: 1, position: 'relative', zIndex: 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#94A3B8', marginTop: 12 },
  errorEmoji: { fontSize: 40, marginBottom: 12 },
  errorLoadText: { color: '#F87171', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  fallbackBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fallbackBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  simulatorScroll: { flex: 1 },
  simulatorContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, paddingHorizontal: 4 },
  sectionDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 18, marginBottom: 16, paddingHorizontal: 4 },
  controlsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E2E8F0',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 12,
  },
  simButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  simButton: { flex: 1, minWidth: 140, backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  disabledSimBtn: { backgroundColor: '#1E293B', opacity: 0.5 },
  simBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: 16 },
  employeeSelector: { flexDirection: 'row', marginBottom: 16 },
  empBadge: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#1E293B', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  selectedEmpBadge: { borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.15)' },
  empBadgeText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  actionButton: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  actionButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  warningContainer: { padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  warningText: { color: '#F87171', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  resultContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '72%', padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.95)', borderTopWidth: 1, borderTopColor: '#334155' },
  resultScroll: { width: '100%' },
  resultCard: { alignItems: 'center', paddingBottom: 8 },
  resultHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  fullWidth: { width: '100%' },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 16, fontSize: 14 },
  benchmarkText: { fontSize: 12, color: '#94A3B8', marginVertical: 12 },
  resetButton: { backgroundColor: '#334155', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  resetButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
});
