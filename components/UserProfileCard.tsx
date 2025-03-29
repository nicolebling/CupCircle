import React from 'react';
import ProfileCard, { UserProfileData } from './ProfileCard';
import { View, Text, TextInput } from 'react-native'; 
import { Button } from 'react-native-elements'; 
import Ionicons from '@expo/vector-icons/Ionicons'; 
import InterestSelector from './InterestSelector'; // Added import for InterestSelector

type UserProfileProps = {
  isEditMode?: boolean;
  isOnboarding?: boolean;
  isLoading?: boolean;
  onSave?: (userData: UserProfileData) => void;
  onCancel?: () => void;
  initialData?: UserProfileData;
};

export interface UserProfileData {
  name: string;
  photo: string;
  bio: string;
  occupation: string;
  interests: string[];
  industries: string[];
  neighborhoods: string[];
  favoriteCafes: string[];
  employment?: Employment[];
};

interface Employment {
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
}

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
        favoriteCafes: [],
        employment: [] // Added initial empty employment array
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