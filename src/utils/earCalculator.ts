import type { Landmark } from '../types';
import { LANDMARK_INDICES } from '../constants';

/**
 * Euclidean distance between two 2D landmark points (x, y only).
 * We ignore Z for EAR since vertical blink movement is in the Y axis.
 */
function euclideanDist(a: Landmark, b: Landmark): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Calculate the Eye Aspect Ratio (EAR) for one eye.
 *
 * Formula (Soukupová & Čech, 2016):
 *   EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 *
 * When the eye is open, EAR ≈ 0.25–0.35.
 * During a blink, EAR drops sharply below the threshold (default 0.20).
 *
 * @param landmarks - Full 478-landmark array from MediaPipe Face Landmarker
 * @param eye - 'LEFT' or 'RIGHT'
 */
export function calculateEAR(
  landmarks: Landmark[],
  eye: 'LEFT' | 'RIGHT'
): number {
  const idx = LANDMARK_INDICES[`${eye}_EYE`];

  const p1 = landmarks[idx.LEFT];
  const p2 = landmarks[idx.TOP_1];
  const p3 = landmarks[idx.TOP_2];
  const p4 = landmarks[idx.RIGHT];
  const p5 = landmarks[idx.BOTTOM_2];
  const p6 = landmarks[idx.BOTTOM_1];

  const vertical1 = euclideanDist(p2, p6);
  const vertical2 = euclideanDist(p3, p5);
  const horizontal = euclideanDist(p1, p4);

  if (horizontal === 0) return 0;

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

/**
 * Average EAR across both eyes for more robust blink detection.
 * A single blink typically causes BOTH eyes to close simultaneously.
 */
export function calculateAverageEAR(landmarks: Landmark[]): number {
  if (landmarks.length < 478) return 0; // Guard against empty or incomplete landmarks
  const leftEAR = calculateEAR(landmarks, 'LEFT');
  const rightEAR = calculateEAR(landmarks, 'RIGHT');
  return (leftEAR + rightEAR) / 2.0;
}
