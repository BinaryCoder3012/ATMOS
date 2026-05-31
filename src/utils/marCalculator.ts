import type { Landmark } from '../types';
import { LANDMARK_INDICES } from '../constants';

function euclideanDist(a: Landmark, b: Landmark): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Calculate the Mouth Aspect Ratio (MAR) for smile detection.
 *
 * Formula (adapted from face landmark geometry):
 *   MAR = vertical_mouth_opening / horizontal_mouth_width
 *
 * A closed resting mouth has MAR ≈ 0.1–0.2.
 * A smile opens the mouth: MAR > threshold (default 0.60 for a visible smile).
 *
 * NOTE: This detects an OPEN smile (teeth showing). A closed-lip smile
 * may not trigger this — use blink as the primary liveness method.
 */
export function calculateMAR(landmarks: Landmark[]): number {
  if (landmarks.length < 292) return 0; // Guard against empty/incomplete landmarks
  const idx = LANDMARK_INDICES.MOUTH;

  const top = landmarks[idx.TOP];
  const bottom = landmarks[idx.BOTTOM];
  const left = landmarks[idx.LEFT];
  const right = landmarks[idx.RIGHT];

  const verticalDist = euclideanDist(top, bottom);
  const horizontalDist = euclideanDist(left, right);

  if (horizontalDist === 0) return 0;

  return verticalDist / horizontalDist;
}
