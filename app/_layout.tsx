import { DarkTheme, DefaultTheme, ThemeProvider, } from '@react-navigation/native';
import {TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const [loaded, error] = useFonts({
    'K2D-Regular': require('../assets/fonts/K2D-Regular.ttf'),
    'K2D-Medium': require('../assets/fonts/K2D-Medium.ttf'),
    'K2D-Bold': require('../assets/fonts/K2D-Bold.ttf'),
    'K2D-SemiBold': require('../assets/fonts/K2D-SemiBold.ttf'),
  });
  
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (loaded) {
      // Set default text and text input properties
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = { 
        fontFamily: 'K2D-Regular',
        ...(Text.defaultProps.style || {}),
      };

      TextInput.defaultProps = TextInput.defaultProps || {};
      TextInput.defaultProps.style = { 
        fontFamily: 'K2D-Regular',
        ...(TextInput.defaultProps.style || {}),
      };

      // Hide splash screen
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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
            headerRight: () => (
              <TouchableOpacity 
                style={{
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  marginRight: 16
                }}
                onPress={() => setIsEditMode(!isEditMode)}
              >
                <Ionicons name={isEditMode ? "close" : "create-outline"} size={20} color={colors.text} />
              </TouchableOpacity>
            ),
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