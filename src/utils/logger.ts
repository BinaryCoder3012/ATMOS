/**
 * Lightweight performance logger for benchmark collection.
 * Stores timing data locally in MMKV for evaluation committee review.
 * Only active in development/demo mode.
 */
import { ENV } from '../config/env';

export interface TimingMarks {
  start: number;
  livenessStart?: number;
  livenessEnd?: number;
  embeddingStart?: number;
  embeddingEnd?: number;
  similarityStart?: number;
  similarityEnd?: number;
  end?: number;
}

export function createTimingMarks(): TimingMarks {
  return { start: Date.now() };
}

export function logAuthBenchmark(marks: TimingMarks): void {
  if (!ENV.DEMO_MODE) return;

  const livenessMs = marks.livenessEnd && marks.livenessStart
    ? marks.livenessEnd - marks.livenessStart : 0;
  const embeddingMs = marks.embeddingEnd && marks.embeddingStart
    ? marks.embeddingEnd - marks.embeddingStart : 0;
  const similarityMs = marks.similarityEnd && marks.similarityStart
    ? marks.similarityEnd - marks.similarityStart : 0;
  const totalMs = marks.end ? marks.end - marks.start : 0;

  console.log(`\n📊 AUTH BENCHMARK REPORT`);
  console.log(`  Liveness check   : ${livenessMs}ms`);
  console.log(`  Face embedding   : ${embeddingMs}ms`);
  console.log(`  Cosine similarity: ${similarityMs}ms`);
  console.log(`  TOTAL PIPELINE   : ${totalMs}ms`);
  console.log(`  Constraint check : ${totalMs < 1000 ? '✅ PASS (<1sec)' : '❌ FAIL (>1sec)'}`);
}
