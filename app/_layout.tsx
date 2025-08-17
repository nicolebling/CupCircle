import "react-native-url-polyfill/auto";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { usePasswordRecovery } from "@/hooks/usePasswordRecovery";
import { Text, TextInput } from "react-native";
import Colors from "@/constants/Colors";
import CustomSplashScreen from "@/components/CustomSplashScreen";
import Superwall from "expo-superwall/compat";
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// Suppress animation warnings in development
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('onAnimatedValueUpdate')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Handle password recovery deep links globally
  const { readyForNewPassword } = usePasswordRecovery();

  useEffect(() => {
    if (loading) return;

    const timeoutId = setTimeout(() => {
      const currentSegment = segments[0];
      const authSegment = segments[1];
      
      // Priority 1: Handle password recovery flow
      if (readyForNewPassword) {
        if (currentSegment !== "(auth)" || authSegment !== "reset-password") {
          console.log('Navigating to reset-password for recovery flow');
          router.replace("/(auth)/reset-password");
          return;
        }
      }
      
      // Priority 2: Handle unauthenticated users
      if (!user && currentSegment !== "(auth)") {
        router.replace("/(auth)/login");
      } 
      // Priority 3: Handle authenticated users (but not in recovery flow)
      else if (
        user &&
        currentSegment === "(auth)" &&
        authSegment !== "onboarding" &&
        authSegment !== "reset-password" &&
        !readyForNewPassword // Don't redirect if in password recovery flow
      ) {
        router.replace("/(tabs)/matching");
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, loading, segments, readyForNewPassword]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: "K2D-SemiBold",
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="messages" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: true,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    "K2D-Regular": require("../assets/fonts/K2D-Regular.ttf"),
    "K2D-Medium": require("../assets/fonts/K2D-Medium.ttf"),
    "K2D-Bold": require("../assets/fonts/K2D-Bold.ttf"),
    "K2D-SemiBold": require("../assets/fonts/K2D-SemiBold.ttf"),
  });
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    const apiKey =
      Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_SUPERWALL_IOS_API_KEY
        : process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY;
    Superwall.configure({
      apiKey: apiKey,
    });
  }, []);

  useEffect(() => {
    if (loaded || error) {
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = {
        fontFamily: "K2D-Regular",
        ...(Text.defaultProps.style || {}),
      };

      TextInput.defaultProps = TextInput.defaultProps || {};
      TextInput.defaultProps.style = {
        fontFamily: "K2D-Regular",
        ...(TextInput.defaultProps.style || {}),
      };

      // Hide the default splash screen immediately since we're using custom one
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  if (showCustomSplash) {
    return <CustomSplashScreen onFinish={() => setShowCustomSplash(false)} />;
  }

  return (
    <NetworkProvider>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}