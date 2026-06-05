import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AuthenticateScreen from '../screens/AuthenticateScreen';
import AdminNavigator from './AdminNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import { Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size }) => {
          let icon = '🏠';
          if (route.name === 'Home') {
            icon = '🏠';
          } else if (route.name === 'Authenticate') {
            icon = '👁️';
          } else if (route.name === 'Admin') {
            icon = '📋';
          } else if (route.name === 'Settings') {
            icon = '⚙️';
          }
          return <Text style={{ fontSize: size }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#818CF8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTintColor: '#F9FAFB',
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Authenticate"
        component={AuthenticateScreen}
        options={{ title: 'Offline Authenticate', tabBarLabel: 'Auth' }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminNavigator}
        options={{ headerShown: false, tabBarLabel: 'Logs' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'System Settings', tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  header: {
    backgroundColor: '#111827',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
});
