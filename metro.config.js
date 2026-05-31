const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const { resolver: { assetExts } } = defaultConfig;

const config = {
  resolver: {
    assetExts: [...assetExts, 'tflite'],
    // Exclude CMake temp build dirs created by Gradle native compilation
    blockList: [
      /node_modules\/.*\/android\/\.cxx\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
      /android\/\.cxx\/.*/,
      /android\/build\/.*/,
    ],
  },
  watchFolders: [],
};

module.exports = mergeConfig(defaultConfig, config);
