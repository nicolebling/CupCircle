import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import ProfileForm, { ProfileFormData } from '@/components/ProfileForm';

export default function OnboardingScreen() {
  const { user, updateUser } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  const handleProfileSave = async (profileData: ProfileFormData) => {
    try {
      if (updateUser) {
        await updateUser({
          name: profileData.name,
          occupation: profileData.occupation,
          bio: profileData.bio,
          interests: profileData.interests,
          photo: profileData.photo_url,
        });
      }
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save profile', error);
      alert('Failed to save profile information. Please try again.');
    }
  };

  if (!userId) {
    return (
      <ThemeProvider value={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.content}>
          <ProfileForm 
            userId={userId}
            isNewUser={true}
            onSaveComplete={handleProfileSave}
            redirectPath="/(tabs)"
            initialData={{
              name: user?.name || '',
              occupation: '',
              bio: '',
              interests: [],
              photo_url: 'https://randomuser.me/api/portraits/lego/1.jpg', // Default avatar
            }}
          />
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
  }
});