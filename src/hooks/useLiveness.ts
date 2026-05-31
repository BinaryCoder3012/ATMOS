import { useState, useEffect, useRef, useCallback } from 'react';
import { ENV } from '../config/env';
import type { LivenessState } from '../types';

export function useLiveness() {
  const [livenessState, setLivenessState] = useState<LivenessState>({
    isComplete: false,
    method: null,
    blinkCount: 0,
    isTimedOut: false,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetLiveness = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Pick a random method: 'blink' or 'smile'
    const methods: ('blink' | 'smile')[] = ['blink', 'smile'];
    const chosenMethod = methods[Math.floor(Math.random() * methods.length)];

    setLivenessState({
      isComplete: false,
      method: chosenMethod,
      blinkCount: 0,
      isTimedOut: false,
    });

    timerRef.current = setTimeout(() => {
      setLivenessState(prev => {
        if (!prev.isComplete) {
          return { ...prev, isTimedOut: true };
        }
        return prev;
      });
    }, ENV.LIVENESS_TIMEOUT_MS);
  }, []);

  const confirmBlink = useCallback(() => {
    setLivenessState(prev => {
      if (prev.isComplete || prev.isTimedOut || prev.method !== 'blink') {
        return prev;
      }
      const nextCount = prev.blinkCount + 1;
      const isComplete = nextCount >= ENV.LIVENESS_BLINK_COUNT;
      if (isComplete && timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return {
        ...prev,
        blinkCount: nextCount,
        isComplete,
      };
    });
  }, []);

  const confirmSmile = useCallback(() => {
    setLivenessState(prev => {
      if (prev.isComplete || prev.isTimedOut || prev.method !== 'smile') {
        return prev;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return {
        ...prev,
        isComplete: true,
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    livenessState,
    confirmBlink,
    confirmSmile,
    resetLiveness,
  };
}
