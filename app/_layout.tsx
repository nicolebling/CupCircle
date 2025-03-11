import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Text, TextInput, View } from 'react-native';
import Colors from '@/constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Using system fonts instead of custom fonts
  const [loaded, error] = useState(true);

  useEffect(() => {
    // Set default text and text input properties
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = { 
      fontFamily: 'Arial, sans-serif',
      ...(Text.defaultProps.style || {}),
    };

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = { 
      fontFamily: 'Arial, sans-serif',
      ...(TextInput.defaultProps.style || {}),
    };

    // Hide splash screen
    SplashScreen.hideAsync();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}