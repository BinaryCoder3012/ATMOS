import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import AuthenticateScreen from '../screens/AuthenticateScreen';
import RegisterEmployeeScreen from '../screens/RegisterEmployeeScreen';
import AdminNavigator from './AdminNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#111827',
        },
        headerTintColor: '#F9FAFB',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#0F172A',
        },
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Authenticate"
        component={AuthenticateScreen}
        options={{ title: 'Offline Authenticate' }}
      />
      <Stack.Screen
        name="RegisterEmployee"
        component={RegisterEmployeeScreen}
        options={{ title: 'Register Employee' }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'System Settings' }}
      />
    </Stack.Navigator>
  );
}
