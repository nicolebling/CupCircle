
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { supabase } from "@/lib/supabase";
import Colors from '@/constants/Colors';
import ProfileForm from '@/components/ProfileForm';
import UserProfileCard from '@/components/UserProfileCard';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfileSave = async (updatedData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updatedData,
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      
      setProfileData(data);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {isEditMode ? (
        <ProfileForm 
          userId={user.id} 
          isNewUser={false}
          initialData={profileData}
          onSave={(updatedData) => {
            handleProfileSave(updatedData);
            setIsEditMode(false);
          }}
          onCancel={() => setIsEditMode(false)}
        />
      ) : (
        <UserProfileCard
          initialData={profileData}
          isEditMode={false}
          onEdit={() => setIsEditMode(true)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  }
});
