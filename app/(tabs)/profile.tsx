
import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileCard, { UserProfileData } from '@/components/UserProfileCard';
import { supabase } from '@/lib/supabase';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

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
        .upsert({ id: user?.id, ...profileUpdateData }, { onConflict: 'id' });
      
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
