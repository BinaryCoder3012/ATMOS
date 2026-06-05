/**
 * Hook to load both TFLite models into memory.
 *
 * KEY FIX: Models are only loaded when `enabled` is true (i.e. when the user
 * switches to Live Camera mode). This prevents OOM crashes on emulators where
 * loading 7.5 MB of TFLite models + running a VisionCamera frame processor
 * simultaneously exhausts the available heap.
 *
 * Model files live at android/app/src/main/assets/ and are accessed via the
 * file:///android_asset/ URI scheme, bypassing Metro's HTTP asset server which
 * cannot deliver binary data in dev mode.
 */
import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';

// Static require references for iOS (Metro resolves these as bundle resources)
const REC_MODEL_IOS = require('../../models/mobilefacenet_int8.tflite');
const LM_MODEL_IOS = require('../../models/face_landmark.tflite');

// A stable "disabled" source so the hook signature never changes shape
const DISABLED_SOURCE = { url: '' };

export interface ModelsState {
  faceRecognitionModel: ReturnType<typeof useTensorflowModel> | null;
  faceLandmarkModel: ReturnType<typeof useTensorflowModel> | null;
  isLoaded: boolean;
  error: string | null;
}

export function useModels(enabled: boolean = true): ModelsState {
  const recSource = useMemo(
    () =>
      enabled
        ? Platform.OS === 'android'
          ? { url: 'file:///android_asset/mobilefacenet_int8.tflite' }
          : REC_MODEL_IOS
        : DISABLED_SOURCE,
    [enabled],
  );
  const lmSource = useMemo(
    () =>
      enabled
        ? Platform.OS === 'android'
          ? { url: 'file:///android_asset/face_landmark.tflite' }
          : LM_MODEL_IOS
        : DISABLED_SOURCE,
    [enabled],
  );

  // react-native-fast-tflite v3 requires the delegates array as 2nd argument
  const faceRecognitionModel = useTensorflowModel(recSource, []);
  const faceLandmarkModel = useTensorflowModel(lmSource, []);

  if (!enabled) {
    return { faceRecognitionModel: null, faceLandmarkModel: null, isLoaded: false, error: null };
  }

  const isLoaded =
    faceRecognitionModel.state === 'loaded' &&
    faceLandmarkModel.state === 'loaded';

  const error =
    faceRecognitionModel.state === 'error'
      ? `Face recognition model failed: ${faceRecognitionModel.error}`
      : faceLandmarkModel.state === 'error'
      ? `Face landmark model failed: ${faceLandmarkModel.error}`
      : null;

  return { faceRecognitionModel, faceLandmarkModel, isLoaded, error };
}
