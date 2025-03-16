import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert, View, Text, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import UserProfileCard, { UserProfileData } from '@/components/UserProfileCard';
import { useProfileManager, ProfileFormData } from '@/hooks/useProfileManager';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';


export default function ProfileScreen() {

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: '',
    age: undefined,
    photo: undefined,
    occupation: '',
    industries: [],
    skills: [],
    experience: '',
    education: '',
    bio: '',
    city: '',
    neighborhoods: [],
    favoriteCafes: [],
    interests: [],
  });

  const userId = user?.id || '';
  const { profile, isLoading: profileLoading, error, fetchProfile, updateProfile } = useProfileManager(user?.id || '');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session?.user) {
          console.log("No authenticated session found");
          return;
        }
        
        const currentUser = session.data.session.user;
        if (!currentUser.id) {
          console.log("No user ID available in session");
          return;
        }

        console.log("Profile fetch triggered for user:", currentUser.id);
        await fetchProfile();
        console.log("Profile fetch completed successfully");
      } catch (error) {
        console.error("Error in profile loading:", error);
      }
    };

    loadProfile();
  }, [user]);

  // Separate effect for updating profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        age: profile.age,
        photo: profile.photo_url,
        occupation: profile.occupation || '',
        industries: profile.industry_categories || [],
        skills: profile.skills || [],
        experience: profile.experience_level || '',
        education: profile.education || '',
        bio: profile.bio || '',
        city: profile.city || '',
        neighborhoods: profile.neighborhoods || [],
        favoriteCafes: profile.favorite_cafes || [],
        interests: profile.interests || [],
      });
      setIsLoading(false);
    }
  }, [profile]);

  const [isLoading, setIsLoading] = useState(true);

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        age: profile.age,
        photo: profile.photo,
        occupation: profile.occupation || '',
        industries: profile.industry_categories || [],
        skills: profile.skills || [],
        experience: '', // Not directly mapped
        education: '', // Not directly mapped
        bio: profile.bio || '',
        city: 'New York City', // Default or from location
        neighborhoods: profile.neighborhoods || [],
        favoriteCafes: profile.favorite_cafes || [],
        interests: profile.interests || [],
      });
      setIsLoading(false);
    }
  }, [profile]);

  // Error handling
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleSaveProfile = async (updatedData: UserProfileData) => {
    // If not in edit mode, toggle to edit mode
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    // Convert UI format to database format
    const profileFormData: ProfileFormData = {
      name: updatedData.name,
      age: updatedData.age,
      occupation: updatedData.occupation,
      photo: updatedData.photo,
      bio: updatedData.bio,
      industry_categories: updatedData.industries,
      skills: updatedData.skills,
      neighborhoods: updatedData.neighborhoods,
      favorite_cafes: updatedData.favoriteCafes,
      interests: updatedData.interests,
    };

    const success = await updateProfile(profileFormData);
    if (success) {
      setIsEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    }
  };

  const navigateToSettings = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={navigateToSettings}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <UserProfileCard 
        isEditMode={isEditMode}
        isLoading={isLoading || profileLoading}
        initialData={profileData}
        onSave={handleSaveProfile}
        onCancel={() => setIsEditMode(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  editButton: {
    padding: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});