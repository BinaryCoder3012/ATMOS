/**
 * Application-wide constants.
 * Thresholds that depend on environment are loaded from ENV config.
 */

/** MediaPipe Face Landmarker specific landmark indices */
export const LANDMARK_INDICES = {
  // Eye landmarks for EAR (Eye Aspect Ratio) calculation
  LEFT_EYE: {
    TOP_1: 159, TOP_2: 158,
    BOTTOM_1: 145, BOTTOM_2: 153,
    LEFT: 33, RIGHT: 133,
  },
  RIGHT_EYE: {
    TOP_1: 386, TOP_2: 385,
    BOTTOM_1: 374, BOTTOM_2: 380,
    LEFT: 362, RIGHT: 263,
  },
  // Mouth landmarks for MAR (Mouth Aspect Ratio) calculation
  MOUTH: {
    TOP: 13, BOTTOM: 14,
    LEFT: 61, RIGHT: 291,
    TOP_INNER_1: 312, TOP_INNER_2: 82,
    BOTTOM_INNER_1: 317, BOTTOM_INNER_2: 87,
  },
} as const;

/** Model file names — must match files in android/app/src/main/assets and iOS bundle */
export const MODEL_FILES = {
  FACE_RECOGNITION: 'mobilefacenet_int8.tflite',
  FACE_LANDMARK: 'face_landmark.tflite',
} as const;

/** MobileFaceNet input specification */
export const MODEL_INPUT = {
  WIDTH: 112,
  HEIGHT: 112,
  CHANNELS: 3,
  /** Normalize pixel values: pixel = (pixel - 127.5) / 128.0 */
  MEAN: 127.5,
  STD: 128.0,
} as const;

/** MMKV Storage key namespaces */
export const STORAGE_KEYS = {
  EMPLOYEES_LIST: 'employees:list',        // JSON array of employee IDs
  EMPLOYEE_PREFIX: 'employees:data:',      // + employeeId = Employee JSON
  ATTENDANCE_LIST: 'attendance:list',      // JSON array of attendance IDs
  ATTENDANCE_PREFIX: 'attendance:data:',   // + recordId = AttendanceRecord JSON
  DEVICE_ID: 'app:deviceId',
  LAST_SYNC_AT: 'app:lastSyncAt',
} as const;
