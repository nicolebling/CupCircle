
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import ProfileForm from '@/components/ProfileForm';
import { supabase } from '@/lib/supabase';

export default function ProfileSetupScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get the user ID from the Supabase session
  useEffect(() => {
    async function getUserId() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("User ID for profile setup:", session.user.id);
        setUserId(session.user.id);
      }
      setLoading(false);
    }
    
    getUserId();
  }, []);
  
  if (loading) {
    return (
      <ThemeProvider value={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading your profile...</Text>
          </View>
        </SafeAreaView>
      </ThemeProvider>
    );
  }
  
  if (!userId) {
    return (
      <ThemeProvider value={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              Unable to load your profile. Please try logging in again.
            </Text>
          </View>
        </SafeAreaView>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider value={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.content}>
          <ProfileForm userId={userId} isNewUser={true} />
        </View>
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  }
});
