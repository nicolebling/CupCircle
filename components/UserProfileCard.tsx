import React from 'react';
import ProfileCard, { UserProfileData } from './ProfileCard';

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
        interests: []
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