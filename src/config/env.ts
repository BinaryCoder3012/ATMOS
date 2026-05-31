/**
 * Safe environment variable loader.
 * Supports MMKV persistence overrides so that variables can be adjusted
 * dynamically via the Settings UI at runtime.
 */
import Config from 'react-native-config';
import { createMMKV } from 'react-native-mmkv';

const configStore = createMMKV({ id: 'datalake3-face-auth-config' });

export const ENV = {
  get AWS_SYNC_ENDPOINT() {
    return configStore.getString('config:syncEndpoint') ?? Config.AWS_SYNC_ENDPOINT ?? '';
  },
  get AWS_API_KEY() {
    return configStore.getString('config:apiKey') ?? Config.AWS_API_KEY ?? '';
  },
  get APP_ENV() {
    return (Config.APP_ENV ?? 'development') as 'development' | 'production';
  },
  get DEMO_MODE() {
    return Config.DEMO_MODE === 'true';
  },
  get SIMILARITY_THRESHOLD() {
    const val = configStore.getString('config:similarityThreshold');
    return val ? parseFloat(val) : parseFloat(Config.SIMILARITY_THRESHOLD ?? '0.85');
  },
  get EAR_BLINK_THRESHOLD() {
    const val = configStore.getString('config:earBlinkThreshold');
    return val ? parseFloat(val) : parseFloat(Config.EAR_BLINK_THRESHOLD ?? '0.20');
  },
  get MAR_SMILE_THRESHOLD() {
    const val = configStore.getString('config:marSmileThreshold');
    return val ? parseFloat(val) : parseFloat(Config.MAR_SMILE_THRESHOLD ?? '0.60');
  },
  get LIVENESS_BLINK_COUNT() {
    return parseInt(Config.LIVENESS_BLINK_COUNT ?? '1', 10);
  },
  get LIVENESS_TIMEOUT_MS() {
    return parseInt(Config.LIVENESS_TIMEOUT_MS ?? '10000', 10);
  },
  
  // Setters to write overrides dynamically
  setAWS_SYNC_ENDPOINT(val: string) {
    configStore.set('config:syncEndpoint', val);
  },
  setAWS_API_KEY(val: string) {
    configStore.set('config:apiKey', val);
  },
  setSIMILARITY_THRESHOLD(val: number) {
    configStore.set('config:similarityThreshold', val.toString());
  },
  setEAR_BLINK_THRESHOLD(val: number) {
    configStore.set('config:earBlinkThreshold', val.toString());
  },
  setMAR_SMILE_THRESHOLD(val: number) {
    configStore.set('config:marSmileThreshold', val.toString());
  },
  resetToDefaults() {
    configStore.remove('config:syncEndpoint');
    configStore.remove('config:apiKey');
    configStore.remove('config:similarityThreshold');
    configStore.remove('config:earBlinkThreshold');
    configStore.remove('config:marSmileThreshold');
  }
};
