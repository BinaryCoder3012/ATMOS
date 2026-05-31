/**
 * Hook to load both TFLite models into memory on app startup.
 * Models are loaded from the app bundle (no network required).
 * Loading is async but happens once — cached for the session.
 *
 * react-native-fast-tflite loads model files from:
 *   - Android: android/app/src/main/assets/
 *   - iOS: added to Xcode bundle (Copy Bundle Resources)
 */
import { useEffect, useState } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { MODEL_FILES } from '../constants';

export interface ModelsState {
  faceRecognitionModel: ReturnType<typeof useTensorflowModel> | null;
  faceLandmarkModel: ReturnType<typeof useTensorflowModel> | null;
  isLoaded: boolean;
  error: string | null;
}

export function useModels(): ModelsState {
  const faceRecognitionModel = useTensorflowModel(
    require(`../../android/app/src/main/assets/${MODEL_FILES.FACE_RECOGNITION}`),
    []
  );
  const faceLandmarkModel = useTensorflowModel(
    require(`../../android/app/src/main/assets/${MODEL_FILES.FACE_LANDMARK}`),
    []
  );

  const isLoaded =
    faceRecognitionModel.state === 'loaded' &&
    faceLandmarkModel.state === 'loaded';

  const error =
    faceRecognitionModel.state === 'error'
      ? `Face recognition model failed to load: ${faceRecognitionModel.error}`
      : faceLandmarkModel.state === 'error'
      ? `Face landmark model failed to load: ${faceLandmarkModel.error}`
      : null;

  return { faceRecognitionModel, faceLandmarkModel, isLoaded, error };
}
