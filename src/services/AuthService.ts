/**
 * AuthService: Orchestrates the complete offline authentication pipeline.
 *
 * Pipeline flow:
 *   Camera Frame -> [Landmark Model] -> EAR/MAR Calculation -> Liveness Gate
 *       -> [Face Recognition Model] -> 128-dim Embedding
 *       -> Cosine Similarity Search -> Match / No Match
 *
 * PERFORMANCE TARGET: Total pipeline < 1000ms on 3GB RAM device.
 *
 * This service is designed to be called from a Vision Camera Frame Processor
 * worklet (JSI context — runs on C++ thread, not JS thread).
 */
import { calculateAverageEAR } from '../utils/earCalculator';
import { calculateMAR } from '../utils/marCalculator';
import { calculateCosineSimilarity, findBestMatch } from '../utils/cosineSimilarity';
import { getEmbeddingsForMatching } from '../storage/employeeStore';
import { MODEL_INPUT } from '../constants';
import { ENV } from '../config/env';
import type { AuthResult, Landmark } from '../types';
import { createTimingMarks, logAuthBenchmark } from '../utils/logger';

/**
 * Normalize a flat pixel array for MobileFaceNet input.
 * MobileFaceNet expects: pixel = (pixel - 127.5) / 128.0
 * Input: Uint8Array of raw RGB pixel values (112 * 112 * 3 = 37,632 values)
 * Output: Float32Array of normalized values in [-1, +1]
 */
export function normalizeFrameForFaceNet(rawPixels: Uint8Array): Float32Array {
  const normalized = new Float32Array(rawPixels.length);
  for (let i = 0; i < rawPixels.length; i++) {
    normalized[i] = (rawPixels[i] - MODEL_INPUT.MEAN) / MODEL_INPUT.STD;
  }
  return normalized;
}

/**
 * Parse the flat Float32Array output from MediaPipe Face Landmarker
 * into an array of {x, y, z} Landmark objects.
 * MediaPipe outputs 478 landmarks * 3 coordinates = 1,434 float values.
 */
export function parseLandmarks(output: Float32Array): Landmark[] {
  const landmarks: Landmark[] = [];
  for (let i = 0; i < output.length; i += 3) {
    landmarks.push({ x: output[i], y: output[i + 1], z: output[i + 2] });
  }
  return landmarks;
}

/**
 * Main authentication function — called per camera frame.
 * Designed to be 'worklet'-safe (pure functions, no async/await inside worklet).
 *
 * @param landmarkOutput - Raw Float32Array from Face Landmark TFLite model
 * @param recognitionOutput - Raw Float32Array from Face Recognition TFLite model
 * @param isLivenessAlreadyConfirmed - Pass true after liveness gate is passed
 */
export function runAuthPipeline(
  landmarkOutput: Float32Array,
  recognitionOutput: Float32Array,
  isLivenessAlreadyConfirmed: boolean
): {
  ear: number;
  mar: number;
  blinkDetected: boolean;
  smileDetected: boolean;
  embedding: number[] | null;
  matchResult: { id: string; score: number } | null;
} {
  const landmarks = parseLandmarks(landmarkOutput);
  const ear = calculateAverageEAR(landmarks);
  const mar = calculateMAR(landmarks);

  const blinkDetected = ear < ENV.EAR_BLINK_THRESHOLD;
  const smileDetected = mar > ENV.MAR_SMILE_THRESHOLD;

  let embedding: number[] | null = null;
  let matchResult: { id: string; score: number } | null = null;

  if (isLivenessAlreadyConfirmed) {
    // Extract 128-dim embedding from face recognition model output
    embedding = Array.from(recognitionOutput);

    // Compare against all stored employee embeddings
    const storedEmbeddings = getEmbeddingsForMatching();
    matchResult = findBestMatch(embedding, storedEmbeddings, ENV.SIMILARITY_THRESHOLD);
  }

  return { ear, mar, blinkDetected, smileDetected, embedding, matchResult };
}
