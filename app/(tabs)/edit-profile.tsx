
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import InterestSelector from '@/components/InterestSelector';
import IndustrySelector from '@/components/IndustrySelector';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { getProfile, updateProfile, isLoading } = useApi();

  const [profile, setProfile] = useState({
    name: '',
    age: '',
    occupation: '',
    bio: '',
    industry_categories: [] as string[],
    skills: [] as string[],
    interests: [] as string[]
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      const userProfile = await getProfile();
      if (userProfile) {
        setProfile({
          name: userProfile.name || '',
          age: userProfile.age ? String(userProfile.age) : '',
          occupation: userProfile.occupation || '',
          bio: userProfile.bio || '',
          industry_categories: userProfile.industry_categories || [],
          skills: userProfile.skills || [],
          interests: userProfile.interests || []
        });
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user, getProfile]);

  const handleChange = (name: string, value: any) => {
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Convert age to number
    const profileData = {
      ...profile,
      age: profile.age ? parseInt(profile.age, 10) : null
    };

    try {
      const result = await updateProfile(profileData);
      if (result) {
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Input
          label="Full Name"
          value={profile.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter your full name"
        />

        <Input
          label="Age"
          value={profile.age}
          onChangeText={(value) => handleChange('age', value)}
          placeholder="Enter your age"
          keyboardType="numeric"
        />

        <Input
          label="Occupation"
          value={profile.occupation}
          onChangeText={(value) => handleChange('occupation', value)}
          placeholder="Enter your occupation"
        />

        <Input
          label="Bio"
          value={profile.bio}
          onChangeText={(value) => handleChange('bio', value)}
          placeholder="Tell us about yourself"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <IndustrySelector
          selectedIndustries={profile.industry_categories}
          onSelect={(industries) => handleChange('industry_categories', industries)}
        />

        <InterestSelector
          selectedInterests={profile.interests}
          onSelect={(interests) => handleChange('interests', interests)}
        />

        <Input
          label="Skills (comma separated)"
          value={profile.skills.join(', ')}
          onChangeText={(value) => handleChange('skills', value.split(',').map(s => s.trim()))}
          placeholder="Enter your skills"
        />

        <Button
          title="Save Profile"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 24,
  }
});
