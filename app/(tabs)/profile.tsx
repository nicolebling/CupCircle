
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import UserProfileCard, { UserProfileData } from '@/components/UserProfileCard';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Sample profile data
  const [profileData] = useState<UserProfileData>({
    name: 'Emma Rodriguez',
    photo: 'https://randomuser.me/api/portraits/women/32.jpg',
    birthday: '04/15/1990',
    age: 33,
    occupation: 'Product Designer',
    experienceLevel: 'Senior Level',
    industries: ['Technology', 'Design', 'E-commerce'],
    skills: ['UI/UX', 'Figma', 'User Research', 'Prototyping'],
    experience: '8 years at various tech companies focusing on product design',
    education: 'BFA in Graphic Design, School of Visual Arts',
    bio: 'Creative designer passionate about creating intuitive and accessible digital products. Love connecting with other professionals over a cup of coffee to discuss design trends and collaboration opportunities.',
    city: 'New York City',
    neighborhoods: ['SoHo', 'Williamsburg', 'Chelsea'],
    favoriteCafes: ['Think Coffee', 'Blue Bottle', 'Stumptown'],
    interests: ['Design Thinking', 'Typography', 'Photography', 'Art Exhibitions', 'Coffee Brewing'],
  });
  
  const handleSaveProfile = (updatedData: UserProfileData) => {
    console.log('Profile updated:', updatedData);
    setIsEditMode(false);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <UserProfileCard 
        isEditMode={isEditMode}
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
