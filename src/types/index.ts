/**
 * Shared TypeScript types for the entire application.
 * All data structures must conform to these interfaces.
 */

/** 128-dimensional face embedding vector from MobileFaceNet */
export type FaceEmbedding = number[]; // length = 128

/** A single 3D facial landmark from MediaPipe Face Landmarker */
export interface Landmark {
  x: number; // normalized [0, 1] relative to frame width
  y: number; // normalized [0, 1] relative to frame height
  z: number; // depth relative to nose tip
}

/** Registered employee record stored in MMKV */
export interface Employee {
  id: string;                  // UUID, generated at registration
  name: string;
  employeeCode: string;        // e.g., "EMP-001"
  department: string;
  embedding: FaceEmbedding;    // 128-dim vector stored as JSON string
  registeredAt: string;        // ISO 8601 timestamp
  photoUri?: string;           // Optional: URI to registration photo
}

/** Attendance log entry stored in MMKV (offline queue) */
export interface AttendanceRecord {
  id: string;                  // UUID, generated at auth
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  timestamp: string;           // ISO 8601 timestamp of authentication
  livenessMethod: 'blink' | 'smile'; // Which challenge was passed
  similarityScore: number;     // Cosine similarity score [0, 1]
  syncStatus: 'pending' | 'synced' | 'failed';
  syncAttemptedAt?: string;    // ISO 8601 timestamp of last sync attempt
  photoUri?: string;           // Optional: URI to registration/matched photo
}

/** AWS sync request payload */
export interface SyncPayload {
  deviceId: string;
  records: AttendanceRecord[];
  syncedAt: string;
}

/** AWS sync response */
export interface SyncResponse {
  success: boolean;
  syncedCount: number;
  message: string;
}

/** Authentication result returned from AuthService */
export interface AuthResult {
  success: boolean;
  employee?: Employee;
  similarityScore?: number;
  livenessMethod?: 'blink' | 'smile';
  errorCode?: 'LIVENESS_FAILED' | 'NO_FACE' | 'NO_MATCH' | 'MODEL_ERROR' | 'TIMEOUT';
  errorMessage?: string;
  processingTimeMs?: number;   // Total pipeline duration for benchmarking
}

/** Liveness challenge state */
export interface LivenessState {
  isComplete: boolean;
  method: 'blink' | 'smile' | null;
  blinkCount: number;
  isTimedOut: boolean;
}

/** Performance benchmark log entry */
export interface BenchmarkEntry {
  timestamp: string;
  livenessMs: number;
  embeddingMs: number;
  similarityMs: number;
  totalMs: number;
  modelSizeMB: number;
}
