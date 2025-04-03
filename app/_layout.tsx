
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Text, TextInput } from 'react-native';
import Colors from '@/constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (loading) return;

    const timeoutId = setTimeout(() => {
      const currentSegment = segments[0];
      if (!user && currentSegment !== '(auth)') {
        router.replace('/(auth)/login');
      } else if (user && currentSegment === '(auth)') {
        router.replace('/(tabs)/matching');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, loading, segments]);

  if (loading) {
    return null; // Or a loading spinner component
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
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    'K2D-Regular': require('../assets/fonts/K2D-Regular.ttf'),
    'K2D-Medium': require('../assets/fonts/K2D-Medium.ttf'),
    'K2D-Bold': require('../assets/fonts/K2D-Bold.ttf'),
    'K2D-SemiBold': require('../assets/fonts/K2D-SemiBold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
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

      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
