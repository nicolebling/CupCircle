import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import UserProfileCard, { UserProfileData } from '@/components/UserProfileCard';
import { useProfileManager, ProfileFormData } from '@/hooks/useProfileManager';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

// Assumed structure of ProfileForm component.  Replace with your actual component.
const ProfileForm = ({ userId, isNewUser, initialData, onSaveComplete, onCancel, redirectPath }) => {
  //Implementation for ProfileForm component would go here.  This is a placeholder
  const [formData, setFormData] = useState(initialData);

  const handleSave = async () => {
    onSaveComplete(formData);
  };


  return (
      <View>
        {/* Input fields for name, age, photo, etc. would go here */}
        <TouchableOpacity onPress={handleSave}>
          <Text>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
  );
};


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
  const { profile, isLoading: profileLoading, error, fetchProfile, updateProfile } = useProfileManager(userId);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

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

  if (isEditMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ProfileForm
          userId={userId}
          isNewUser={false}
          initialData={{
            name: profileData.name || '',
            username: '',
            photo_url: profileData.photo,
            occupation: profileData.occupation || '',
            bio: profileData.bio || '',
            age: profileData.age?.toString(),
            experience_level: profileData.experience || '',
            education: profileData.education || '',
            city: profileData.city || '',
            industry_categories: profileData.industries || [],
            skills: profileData.skills || [],
            neighborhoods: profileData.neighborhoods || [],
            favorite_cafes: profileData.favoriteCafes || [],
            interests: profileData.interests || [],
          }}
          onSaveComplete={(data) => {
            handleSaveProfile({
              name: data.name,
              age: data.age ? parseInt(data.age) : undefined,
              photo: data.photo_url,
              occupation: data.occupation,
              industries: data.industry_categories,
              skills: data.skills,
              experience: data.experience_level,
              education: data.education,
              bio: data.bio,
              city: data.city,
              neighborhoods: data.neighborhoods,
              favoriteCafes: data.favorite_cafes,
              interests: data.interests,
            });
            setIsEditMode(false);
          }}
          onCancel={() => setIsEditMode(false)}
          redirectPath="/(tabs)/profile"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>My Profile</Text>
          <TouchableOpacity onPress={() => setIsEditMode(true)} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {profileLoading || isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : (
          <UserProfileCard
            initialData={profileData}
            isEditMode={false}
            onSave={() => setIsEditMode(true)}
          />
        )}
      </ScrollView>
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
  pageTitle: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});