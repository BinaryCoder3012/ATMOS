/**
 * Central MMKV store instance.
 * react-native-mmkv uses a C++ synchronous engine — no async/await needed.
 * This is ~30x faster than AsyncStorage.
 */
import { createMMKV } from 'react-native-mmkv';

export const store = createMMKV({
  id: 'datalake3-face-auth-store',
  // encryptionKey is intentionally not hardcoded here.
  // For production, generate a device-unique key and store it in
  // the iOS Keychain / Android Keystore.
});

// Typed wrappers for safe JSON serialization/deserialization
export function storeJSON<T>(key: string, value: T): void {
  store.set(key, JSON.stringify(value));
}

export function loadJSON<T>(key: string): T | null {
  const raw = store.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function deleteKey(key: string): void {
  store.remove(key);
}

export function getAllKeysWithPrefix(prefix: string): string[] {
  return store.getAllKeys().filter((k: string) => k.startsWith(prefix));
}
