import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Defs, Mask } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraOverlayProps {
  livenessMethod: 'blink' | 'smile' | null;
  livenessState: { isComplete: boolean; isTimedOut: boolean; blinkCount: number };
  instructionText: string;
}

export default function CameraOverlay({
  livenessMethod,
  livenessState,
  instructionText,
}: CameraOverlayProps) {
  const guideWidth = SCREEN_WIDTH * 0.75;
  const guideHeight = guideWidth * 1.25;
  const guideX = (SCREEN_WIDTH - guideWidth) / 2;
  const guideY = (SCREEN_HEIGHT * 0.45) - (guideHeight / 2);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Dark mask overlay with face-shaped cutout */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="mask">
            <Rect width="100%" height="100%" fill="white" />
            <Rect
              x={guideX}
              y={guideY}
              width={guideWidth}
              height={guideHeight}
              rx={guideWidth / 2} // Oval cutout
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill="rgba(10, 10, 12, 0.75)"
          mask="url(#mask)"
        />
      </Svg>

      {/* Glowing oval guide border */}
      <View
        style={[
          styles.guideBorder,
          {
            left: guideX,
            top: guideY,
            width: guideWidth,
            height: guideHeight,
            borderRadius: guideWidth / 2,
            borderColor: livenessState.isComplete
              ? '#10B981' // Green
              : livenessState.isTimedOut
              ? '#EF4444' // Red
              : '#6366F1', // Indigo glow
          },
        ]}
      />

      {/* Glassmorphic prompt card */}
      <View style={styles.promptContainer}>
        <View style={styles.glassCard}>
          <Text style={styles.promptTitle}>
            {livenessState.isComplete
              ? 'Liveness Verified'
              : livenessState.isTimedOut
              ? 'Verification Timeout'
              : 'Liveness Challenge'}
          </Text>
          <Text
            style={[
              styles.promptInstruction,
              {
                color: livenessState.isComplete
                  ? '#10B981'
                  : livenessState.isTimedOut
                  ? '#EF4444'
                  : '#FFFFFF',
              },
            ]}
          >
            {instructionText}
          </Text>
          {livenessMethod === 'blink' && !livenessState.isComplete && !livenessState.isTimedOut && (
            <Text style={styles.blinkCounter}>
              Blinks: {livenessState.blinkCount}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guideBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderStyle: 'solid',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowColor: '#6366F1',
    shadowOpacity: 0.8,
    elevation: 5,
  },
  promptContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  glassCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(25, 25, 35, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  promptInstruction: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 4,
  },
  blinkCounter: {
    fontSize: 14,
    color: '#818CF8',
    fontWeight: '600',
    marginTop: 8,
  },
});
