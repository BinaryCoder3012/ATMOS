import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export function usePermissions() {
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'unavailable' | 'blocked' | 'loading'>('loading');

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
    } catch (e) {
      setCameraPermission('unavailable');
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const result = await request(getCameraPermissionConstant());
      if (result === RESULTS.GRANTED) {
        setCameraPermission('granted');
        return true;
      } else {
        setCameraPermission('denied');
        return false;
      }
    } catch (e) {
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
