import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export type CameraPermissionStatus =
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'blocked'
  | 'loading';

export function usePermissions() {
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('loading');

  const getCameraPermissionConstant = () => {
    return Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;
  };

  const checkCameraPermission = useCallback(async () => {
    try {
      const result = await check(getCameraPermissionConstant());
      switch (result) {
        case RESULTS.GRANTED:
          setCameraPermission('granted');
          break;
        case RESULTS.DENIED:
          setCameraPermission('denied');
          break;
        case RESULTS.BLOCKED:
          setCameraPermission('blocked');
          break;
        default:
          setCameraPermission('unavailable');
          break;
      }
    } catch {
      setCameraPermission('unavailable');
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const result = await request(getCameraPermissionConstant());
      switch (result) {
        case RESULTS.GRANTED:
          setCameraPermission('granted');
          return true;
        case RESULTS.BLOCKED:
          setCameraPermission('blocked');
          return false;
        case RESULTS.UNAVAILABLE:
          setCameraPermission('unavailable');
          return false;
        default:
          setCameraPermission('denied');
          return false;
      }
    } catch {
      setCameraPermission('denied');
      return false;
    }
  }, []);

  useEffect(() => {
    checkCameraPermission();
  }, [checkCameraPermission]);

  return {
    cameraPermission,
    checkCameraPermission,
    requestCameraPermission,
  };
}
