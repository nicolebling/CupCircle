
import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import UserProfileCard, { UserProfileData } from '@/components/UserProfileCard';
import { useProfileManager, ProfileFormData } from '@/hooks/useProfileManager';
import { AuthContext } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors.light;
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user ID from auth context
  const { user } = useContext(AuthContext);
  const userId = user?.id || "";
  const { profile, error, isLoading: profileLoading, fetchProfile, updateProfile } = useProfileManager(userId);
  
  // Local profile data for the UI
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: '',
    photo: 'https://randomuser.me/api/portraits/women/32.jpg',
    birthday: '',
    age: 0,
    occupation: '',
    experienceLevel: '',
    industries: [],
    skills: [],
    experience: '',
    education: '',
    bio: '',
    city: 'New York City',
    neighborhoods: [],
    favoriteCafes: [],
    interests: [],
  });
  
  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfile();
  }, []);
  
  // Update local state when profile data is loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        photo: profile.photo || 'https://randomuser.me/api/portraits/women/32.jpg',
        birthday: '', // Convert from age if needed
        age: profile.age || 0,
        occupation: profile.occupation || '',
        experienceLevel: '', // Map from industry_categories if applicable
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
});
