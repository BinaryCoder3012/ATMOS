/**
 * Pure mathematical cosine similarity function.
 * Zero external dependencies — runs entirely in JS thread or worklet.
 *
 * Cosine similarity = (A · B) / (|A| × |B|)
 * Returns a value in [0, 1] where 1 = identical vectors.
 *
 * Time complexity: O(N) where N = embedding dimensions (128 for MobileFaceNet).
 * On a mid-range device this executes in < 1ms for 128-dim vectors.
 *
 * @param vecA - Live face embedding from camera frame
 * @param vecB - Stored employee baseline embedding from MMKV
 * @returns similarity score [0, 1]
 */
export function calculateCosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    throw new Error(
      `Embedding dimension mismatch: ${vecA.length} vs ${vecB.length}`
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

  if (magnitude === 0) return 0;

  // Clamp to [0, 1] to handle floating-point precision edge cases
  return Math.max(0, Math.min(1, dotProduct / magnitude));
}

/**
 * Batch similarity search: compare one live embedding against all stored employees.
 * Returns the best match above threshold, or null if no match found.
 *
 * @param liveEmbedding - Live face embedding from camera frame
 * @param employees - All registered employees with their stored embeddings
 * @param threshold - Minimum similarity score to consider a match
 */
export function findBestMatch(
  liveEmbedding: number[],
  employees: Array<{ id: string; embedding: number[] }>,
  threshold: number
): { id: string; score: number } | null {
  let bestScore = 0;
  let bestId: string | null = null;

  for (const employee of employees) {
    const score = calculateCosineSimilarity(liveEmbedding, employee.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestId = employee.id;
    }
  }

  if (bestId && bestScore >= threshold) {
    return { id: bestId, score: bestScore };
  }
  return null;
}
