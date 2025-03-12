
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert, View, Text, TouchableOpacity, Modal } from 'react-native';
import Colors from '@/constants/Colors';
import UserProfileCard, { UserProfileData } from '@/components/UserProfileCard';
import { useProfileManager, ProfileFormData } from '@/hooks/useProfileManager';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
  
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Sign Out", 
          onPress: () => signOut(),
          style: "destructive"
        }
      ]
    );
    setShowSettings(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Settings Modal */}
      {showSettings && (
        <View style={[styles.settingsMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.settingsOption}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error || "#ff3b30"} />
            <Text style={[styles.settingsOptionText, { color: colors.error || "#ff3b30" }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}
      
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  editButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  settingsMenu: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 150,
    padding: 8,
    borderRadius: 8,
    zIndex: 1000,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
  },
  settingsOptionText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginLeft: 10,
  },
});
