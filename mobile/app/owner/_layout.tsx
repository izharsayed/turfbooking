import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

export default function OwnerLayout() {
  const { isDarkMode } = useThemeStore();

  const tabBarBg = isDarkMode ? '#0f172a' : '#ffffff';
  const tabBarBorder = isDarkMode ? '#1e293b' : '#e2e8f0';
  const inactiveColor = isDarkMode ? '#64748b' : '#94a3b8';
  const activeColor = '#10b981';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: tabBarBorder,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="turfs"
        options={{
          title: 'My Turfs',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="soccer-field" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
