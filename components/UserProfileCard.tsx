import React from 'react';
import ProfileCard, { UserProfileData } from './ProfileCard';
import { View, Text, TextInput } from 'react-native'; // Added imports for React Native components
import { Button } from 'react-native-elements'; // Assuming a Button component from react-native-elements
import Ionicons from '@expo/vector-icons/Ionicons'; // Added import for Ionicons

type UserProfileProps = {
  isEditMode?: boolean;
  isOnboarding?: boolean;
  isLoading?: boolean;
  onSave?: (userData: UserProfileData) => void;
  onCancel?: () => void;
  initialData?: UserProfileData;
};

export { UserProfileData };

export default function UserProfileCard({ 
  isEditMode = false, 
  isOnboarding = false,
  isLoading = false,
  onSave,
  onCancel,
  initialData
}: UserProfileProps) {
  return (
    <ProfileCard
      profile={initialData || {
        name: '',
        photo: 'https://via.placeholder.com/150',
        bio: '',
        occupation: '',
        interests: [],
        industries: [],
        neighborhoods: [],
        favoriteCafes: []
      }}
      isUserProfile={true}
      isEditMode={isEditMode}
      isOnboarding={isOnboarding}
      isLoading={isLoading}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}