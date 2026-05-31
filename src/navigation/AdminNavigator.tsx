import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminScreen from '../screens/AdminScreen';
import AttendanceLogScreen from '../screens/AttendanceLogScreen';
import type { AdminTabParamList } from './types';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let icon = '📋';
          if (route.name === 'AdminDashboard') {
            icon = '👥';
          } else if (route.name === 'AttendanceLogs') {
            icon = '🕒';
          }
          return <Text style={{ fontSize: size, color }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#818CF8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopWidth: 1,
          borderTopColor: '#1F2937',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#111827',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#1F2937',
        },
        headerTintColor: '#F9FAFB',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminScreen}
        options={{ title: 'Employees' }}
      />
      <Tab.Screen
        name="AttendanceLogs"
        component={AttendanceLogScreen}
        options={{ title: 'Attendance Logs' }}
      />
    </Tab.Navigator>
  );
}
