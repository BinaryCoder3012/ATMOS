/**
 * Utility functions for preprocessing camera frames for ML models.
 * Resizing is done using a fast nearest-neighbor algorithm.
 */
import { MODEL_INPUT } from '../constants';

/**
 * Resizes and crops a flat Uint8Array (RGBA or RGB) into a new dimensions.
 * Handles crop to center square (aspect ratio correction).
 *
 * @param srcBytes - The source Uint8Array of pixel values
 * @param srcWidth - Width of the source frame
 * @param srcHeight - Height of the source frame
 * @param dstWidth - Target width
 * @param dstHeight - Target height
 * @param srcChannels - Number of channels in source (3 or 4)
 * @param dstChannels - Number of channels in output (typically 3)
 */
export function preprocessFrame(
  srcBytes: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
  srcChannels: number = 4,
  dstChannels: number = 3
): Uint8Array {
  const dstBytes = new Uint8Array(dstWidth * dstHeight * dstChannels);

  // 1. Center crop calculation (ensure square aspect ratio)
  const minDim = Math.min(srcWidth, srcHeight);
  const startX = Math.floor((srcWidth - minDim) / 2);
  const startY = Math.floor((srcHeight - minDim) / 2);

  const xRatio = minDim / dstWidth;
  const yRatio = minDim / dstHeight;

  // 2. Nearest-neighbor resize and channel copy
  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      // Map back to center-cropped source space
      const px = startX + Math.floor(x * xRatio);
      const py = startY + Math.floor(y * yRatio);

      const srcIdx = (py * srcWidth + px) * srcChannels;
      const dstIdx = (y * dstWidth + x) * dstChannels;

      // Extract RGB channels
      dstBytes[dstIdx] = srcBytes[srcIdx];         // R
      dstBytes[dstIdx + 1] = srcBytes[srcIdx + 1]; // G
      dstBytes[dstIdx + 2] = srcBytes[srcIdx + 2]; // B
      // Ignore Alpha channel if it exists and dst expects 3 channels
    }
  }

  return dstBytes;
}

/**
 * Normalizes Uint8Array RGB values into a Float32Array.
 * Can normalize to [-1.0, 1.0] (mean/std) or [0.0, 1.0] (division by 255).
 */
export function normalizeFrame(
  rgbBytes: Uint8Array,
  mean: number = MODEL_INPUT.MEAN,
  std: number = MODEL_INPUT.STD,
  useFloatRange: boolean = false
): Float32Array {
  const normalized = new Float32Array(rgbBytes.length);
  if (useFloatRange) {
    for (let i = 0; i < rgbBytes.length; i++) {
      normalized[i] = rgbBytes[i] / 255.0;
    }
  } else {
    for (let i = 0; i < rgbBytes.length; i++) {
      normalized[i] = (rgbBytes[i] - mean) / std;
    }
  }
  return normalized;
}
