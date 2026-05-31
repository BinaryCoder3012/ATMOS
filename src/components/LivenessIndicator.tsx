import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface LivenessIndicatorProps {
  method: 'blink' | 'smile' | null;
  earValue: number;
  marValue: number;
  earThreshold: number;
  marThreshold: number;
}

export default function LivenessIndicator({
  method,
  earValue,
  marValue,
  earThreshold,
  marThreshold,
}: LivenessIndicatorProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.15, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const earPercentage = Math.min(100, Math.max(0, (earValue / 0.4) * 100));
  const marPercentage = Math.min(100, Math.max(0, (marValue / 1.0) * 100));
  const earThresholdPos = (earThreshold / 0.4) * 100;
  const marThresholdPos = (marThreshold / 1.0) * 100;

  return (
    <View style={styles.container}>
      {method === 'blink' ? (
        <View style={styles.card}>
          <Animated.View style={[styles.iconCircle, animatedStyle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Text style={styles.icon}>👁️</Text>
          </Animated.View>
          <View style={styles.barContainer}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Eye Aspect Ratio (EAR)</Text>
              <Text style={styles.barValue}>{earValue.toFixed(2)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${earPercentage}%`, backgroundColor: '#818CF8' }]} />
              <View style={[styles.thresholdLine, { left: `${earThresholdPos}%` }]} />
            </View>
            <Text style={styles.helperText}>Goal: Blink (EAR drops below {earThreshold})</Text>
          </View>
        </View>
      ) : method === 'smile' ? (
        <View style={styles.card}>
          <Animated.View style={[styles.iconCircle, animatedStyle, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Text style={styles.icon}>😊</Text>
          </Animated.View>
          <View style={styles.barContainer}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Mouth Aspect Ratio (MAR)</Text>
              <Text style={styles.barValue}>{marValue.toFixed(2)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${marPercentage}%`, backgroundColor: '#F472B6' }]} />
              <View style={[styles.thresholdLine, { left: `${marThresholdPos}%` }]} />
            </View>
            <Text style={styles.helperText}>Goal: Smile (MAR rises above {marThreshold})</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  barContainer: {
    flex: 1,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  barValue: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#EF4444',
  },
  helperText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
  },
});
