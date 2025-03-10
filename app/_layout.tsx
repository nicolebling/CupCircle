
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'K2D-Regular': require('../assets/fonts/K2D-Regular.ttf'),
    'K2D-Medium': require('../assets/fonts/K2D-Medium.ttf'),
    'K2D-Bold': require('../assets/fonts/K2D-Bold.ttf'),
    'K2D-SemiBold': require('../assets/fonts/K2D-SemiBold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput, View } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [loaded, error] = useFonts({
    'K2D-Regular': require('../assets/fonts/K2D-Regular.ttf'),
    'K2D-Medium': require('../assets/fonts/K2D-Medium.ttf'),
    'K2D-SemiBold': require('../assets/fonts/K2D-SemiBold.ttf'),
    'K2D-Bold': require('../assets/fonts/K2D-Bold.ttf'),
  });

  // Set default font family for all Text components
  useEffect(() => {
    if (loaded) {
      // Set default text and text input properties
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = { fontFamily: 'K2D-Regular' };
      
      TextInput.defaultProps = TextInput.defaultProps || {};
      TextInput.defaultProps.style = { fontFamily: 'K2D-Regular' };
      
      // Hide splash screen
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'K2D-SemiBold',
        },
      }}
    />
  );
}
