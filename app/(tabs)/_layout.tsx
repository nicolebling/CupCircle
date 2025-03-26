import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colors = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopColor: 'transparent',
          backgroundColor: '#F97415',
          borderTopWidth: 0,
          height: 60,
          paddingVertical: 8,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'K2D-SemiBold',
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        }
      }}
    >

      <Tabs.Screen
        name="matching"
        options={{
          title: 'Explore Your Circle',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Circle Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="availability"
        options={{
          title: 'My Availability',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={({ route }) => ({
          title: route.params?.isEditMode ? 'Edit Profile' : 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size - 2} color={color} />
          ),
        })}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: null, // This ensures the tab doesn't show in the tab bar
        }}
      />
    </Tabs>
  );
}