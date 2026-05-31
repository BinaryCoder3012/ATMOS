import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceBarProps {
  score: number;
  threshold: number;
}

export default function ConfidenceBar({ score, threshold }: ConfidenceBarProps) {
  const percentage = Math.min(100, Math.max(0, score * 100));
  const thresholdPos = threshold * 100;
  const isMatch = score >= threshold;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Match Confidence</Text>
        <Text style={[styles.value, { color: isMatch ? '#10B981' : '#EF4444' }]}>
          {(score * 100).toFixed(1)}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: isMatch ? '#10B981' : '#F59E0B',
            },
          ]}
        />
        <View style={[styles.thresholdLine, { left: `${thresholdPos}%` }]} />
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Threshold: {(threshold * 100).toFixed(0)}%</Text>
        <Text style={styles.footerText}>
          {isMatch ? '✓ Matching Identity' : '✗ Insufficient Match'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#374151',
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#EF4444',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
