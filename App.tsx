import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#111827" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
