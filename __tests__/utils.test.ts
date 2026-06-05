import { calculateCosineSimilarity, findBestMatch } from '../src/utils/cosineSimilarity';
import { calculateAverageEAR } from '../src/utils/earCalculator';
import { calculateMAR } from '../src/utils/marCalculator';
import type { Landmark } from '../src/types';

describe('Biometric Math & Matching Utilities', () => {
  
  describe('Cosine Similarity', () => {
    test('Identical vectors should return similarity of 1.0', () => {
      const vecA = [1, 2, 3, 4, 5];
      const vecB = [1, 2, 3, 4, 5];
      expect(calculateCosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);
    });

    test('Opposite vectors should return similarity of 0.0 due to clamping [0, 1]', () => {
      const vecA = [1, 0];
      const vecB = [-1, 0];
      expect(calculateCosineSimilarity(vecA, vecB)).toBe(0.0);
    });

    test('Orthogonal vectors should return similarity of 0.0', () => {
      const vecA = [1, 0];
      const vecB = [0, 1];
      expect(calculateCosineSimilarity(vecA, vecB)).toBe(0.0);
    });

    test('Standard similar vectors should calculate correct similarity score', () => {
      const vecA = [3, 4]; // magnitude = 5
      const vecB = [4, 3]; // magnitude = 5
      // dot product = 3*4 + 4*3 = 24
      // similarity = 24 / 25 = 0.96
      expect(calculateCosineSimilarity(vecA, vecB)).toBeCloseTo(0.96, 5);
    });

    test('Vector dimension mismatch should throw an error', () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2];
      expect(() => calculateCosineSimilarity(vecA, vecB)).toThrow();
    });
  });

  describe('Batch Best Match Search', () => {
    const employees = [
      { id: '1', embedding: [1, 0, 0] },
      { id: '2', embedding: [0, 1, 0] },
      { id: '3', embedding: [0, 0, 1] },
    ];

    test('Should match the best candidate above similarity threshold', () => {
      const live = [0.9, 0.1, 0]; // Closest to id: '1'
      const match = findBestMatch(live, employees, 0.80);
      expect(match).not.toBeNull();
      expect(match?.id).toBe('1');
      expect(match?.score).toBeGreaterThanOrEqual(0.80);
    });

    test('Should return null if the highest score is below the threshold', () => {
      const live = [0.9, 0.1, 0];
      const match = findBestMatch(live, employees, 0.999);
      expect(match).toBeNull();
    });
  });

  describe('Eye Aspect Ratio (EAR) Calculation', () => {
    // Generate a mock array of 478 landmarks initialized to zero
    const createMockLandmarks = (): Landmark[] => {
      return Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }));
    };

    test('Should return correct EAR values for eyes', () => {
      const landmarks = createMockLandmarks();
      
      // LEFT_EYE indices: TOP_1: 159, TOP_2: 158, BOTTOM_1: 145, BOTTOM_2: 153, LEFT: 33, RIGHT: 133
      // Set LEFT eye horizontal distance to 10
      landmarks[33] = { x: 0, y: 0, z: 0 };
      landmarks[133] = { x: 10, y: 0, z: 0 };

      // Set LEFT eye vertical height to 3 (TOP_1 to BOTTOM_1 = 3, TOP_2 to BOTTOM_2 = 3)
      landmarks[159] = { x: 5, y: 3, z: 0 }; // TOP_1
      landmarks[145] = { x: 5, y: 0, z: 0 }; // BOTTOM_1
      landmarks[158] = { x: 6, y: 3, z: 0 }; // TOP_2
      landmarks[153] = { x: 6, y: 0, z: 0 }; // BOTTOM_2

      // RIGHT_EYE indices: TOP_1: 386, TOP_2: 385, BOTTOM_1: 374, BOTTOM_2: 380, LEFT: 362, RIGHT: 263
      // Set RIGHT eye horizontal distance to 10
      landmarks[362] = { x: 20, y: 0, z: 0 };
      landmarks[263] = { x: 30, y: 0, z: 0 };

      // Set RIGHT eye vertical height to 3
      landmarks[386] = { x: 25, y: 3, z: 0 }; // TOP_1
      landmarks[374] = { x: 25, y: 0, z: 0 }; // BOTTOM_1
      landmarks[385] = { x: 26, y: 3, z: 0 }; // TOP_2
      landmarks[380] = { x: 26, y: 0, z: 0 }; // BOTTOM_2

      // Formula: (vertical1 + vertical2) / (2.0 * horizontal)
      // vertical1 = sqrt((5-5)^2 + (3-0)^2) = 3
      // vertical2 = sqrt((6-6)^2 + (3-0)^2) = 3
      // horizontal = 10
      // EAR = (3 + 3) / (2 * 10) = 6 / 20 = 0.30

      const avgEAR = calculateAverageEAR(landmarks);
      expect(avgEAR).toBeCloseTo(0.30, 4);
    });

    test('Should return 0 if landmarks array is incomplete', () => {
      const incomplete = Array.from({ length: 10 }, () => ({ x: 0, y: 0, z: 0 }));
      expect(calculateAverageEAR(incomplete)).toBe(0);
    });
  });

  describe('Mouth Aspect Ratio (MAR) Calculation', () => {
    const createMockLandmarks = (): Landmark[] => {
      return Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }));
    };

    test('Should calculate correct aspect ratio of mouth shape', () => {
      const landmarks = createMockLandmarks();

      // MOUTH indices: TOP: 13, BOTTOM: 14, LEFT: 61, RIGHT: 291
      landmarks[61] = { x: 0, y: 0, z: 0 };  // LEFT
      landmarks[291] = { x: 10, y: 0, z: 0 }; // RIGHT
      landmarks[13] = { x: 5, y: 2, z: 0 };  // TOP
      landmarks[14] = { x: 5, y: 0, z: 0 };  // BOTTOM

      // MAR = verticalDist / horizontalDist = 2 / 10 = 0.20
      const mar = calculateMAR(landmarks);
      expect(mar).toBeCloseTo(0.20, 4);
    });

    test('Should return 0 if landmarks array length is below threshold', () => {
      const incomplete = Array.from({ length: 100 }, () => ({ x: 0, y: 0, z: 0 }));
      expect(calculateMAR(incomplete)).toBe(0);
    });
  });

});
