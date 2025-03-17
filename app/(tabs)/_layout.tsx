import React from 'react';
import { Tabs, TouchableOpacity } from 'expo-router';
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
        name="index"
        options={{
          title: 'Circle Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

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
        options={({ navigation }) => ({
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size - 2} color={color} />
          ),
          headerRight: () => {
            const isEditMode = navigation.getState().routes.find(
              route => route.name === 'profile'
            )?.params?.isEditMode;
            
            return (
              <TouchableOpacity 
                style={{
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  marginRight: 16
                }}
                onPress={() => navigation.setParams({ isEditMode: !isEditMode })}
              >
                <Ionicons 
                  name={isEditMode ? "close" : "create-outline"} 
                  size={20} 
                  color={colors.text} 
                />
              </TouchableOpacity>
            );
          },
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