
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
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileCard, { UserProfileData } from '@/components/UserProfileCard';
import { supabase } from '@/lib/supabase';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Link, router } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      if (!user) {
        Alert.alert('Not logged in', 'Please log in to view your profile');
        return;
      }

      // Fetch profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile information');
        return;
      }

      if (data) {
        // Transform the data to match UserProfileData structure
        const userProfileData: UserProfileData = {
          name: data.full_name || data.name || '',
          photo: data.avatar_url || data.photo_url || 'https://via.placeholder.com/150',
          bio: data.bio || '',
          occupation: data.occupation || '',
          interests: data.interests || [],
          industries: data.industry_categories || [],
          neighborhoods: data.neighborhoods || [],
          favoriteCafes: data.favorite_cafes || []
        };
        setProfileData(userProfileData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async (updatedData: UserProfileData) => {
    try {
      setLoading(true);
      
      // Transform UserProfileData to match the database structure
      const profileUpdateData = {
        full_name: updatedData.name,
        photo_url: updatedData.photo,
        bio: updatedData.bio,
        occupation: updatedData.occupation,
        interests: updatedData.interests,
        industry_categories: updatedData.industries,
        neighborhoods: updatedData.neighborhoods,
        favorite_cafes: updatedData.favoriteCafes
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user?.id, ...profileUpdateData }, { onConflict: 'id', ignoreDuplicates: false });
      
      if (error) {
        throw error;
      }
      
      setProfileData(updatedData);
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (loading && !profileData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097FB" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>My Profile</Text>
        {!isEditing && (
          <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <Ionicons name="pencil" size={24} color={isDark ? "#ffffff" : "#000000"} />
          </TouchableOpacity>
        )}
      </View>
      
      {profileData && (
        <UserProfileCard
          initialData={profileData}
          isEditMode={isEditing}
          isLoading={loading}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
        />
      )}
      
      {!isEditing && (
        <TouchableOpacity 
          onPress={signOut} 
          style={styles.signOutButton}
        >
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      )}
      
      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  titleDark: {
    color: '#ffffff',
  },
  editButton: {
    padding: 8,
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  signOutText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
