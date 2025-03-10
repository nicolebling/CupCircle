
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Button from './ui/Button';

type UserProfileProps = {
  isEditMode?: boolean;
  isOnboarding?: boolean;
  onSave?: (userData: UserProfileData) => void;
  onCancel?: () => void;
  initialData?: UserProfileData;
};

export type UserProfileData = {
  id?: string;
  name: string;
  photo: string;
  birthday: string;
  age?: number;
  occupation: string;
  experienceLevel: string;
  industries: string[];
  skills: string[];
  experience: string;
  education: string;
  bio: string;
  city: string;
  neighborhoods: string[];
  favoriteCafes: string[];
  interests: string[];
};

const EMPTY_PROFILE: UserProfileData = {
  name: '',
  photo: 'https://via.placeholder.com/150',
  birthday: '',
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
};

export default function UserProfileCard({ 
  isEditMode = false, 
  isOnboarding = false,
  onSave,
  onCancel,
  initialData
}: UserProfileProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [userData, setUserData] = useState<UserProfileData>(initialData || EMPTY_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getTitle = () => {
    if (isOnboarding) return 'Complete Your Profile';
    if (isEditMode) return 'Edit Profile';
    return 'My Profile';
  };

  const handleChange = (field: keyof UserProfileData, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.name) newErrors.name = 'Name is required';
    if (!userData.birthday) newErrors.birthday = 'Birthday is required';
    if (!userData.occupation) newErrors.occupation = 'Occupation is required';
    if (!userData.bio) newErrors.bio = 'Bio is required';
    if (userData.bio.length > 500) newErrors.bio = 'Bio must be less than 500 characters';
    
    // Add more validation as needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      if (onSave) onSave(userData);
      setIsSaving(false);
    }, 1000);
  };

  if (!isEditMode && !isOnboarding) {
    // View mode
    return (
      <ScrollView>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <Image source={{ uri: userData.photo }} style={styles.profilePhoto} />
          </View>
          
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Name</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.name}</Text>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Age</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.age || 'Not provided'}</Text>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Occupation</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.occupation}</Text>
          </View>
          
          {/* Professional Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Details</Text>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Experience Level</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.experienceLevel}</Text>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Industries</Text>
            <View style={styles.tagsContainer}>
              {userData.industries.map((industry, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{industry}</Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Skills</Text>
            <View style={styles.tagsContainer}>
              {userData.skills.map((skill, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{skill}</Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Experience</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.experience}</Text>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Education</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.education}</Text>
          </View>
          
          {/* Bio */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.bio}</Text>
          </View>
          
          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Preferences</Text>
            <Text style={[styles.label, { color: colors.secondaryText }]}>City</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userData.city}</Text>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Neighborhoods</Text>
            <View style={styles.tagsContainer}>
              {userData.neighborhoods.map((neighborhood, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{neighborhood}</Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.label, { color: colors.secondaryText }]}>Favorite Cafes</Text>
            <View style={styles.tagsContainer}>
              {userData.favoriteCafes.map((cafe, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{cafe}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Interests */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.tagsContainer}>
              {userData.interests.map((interest, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }
  
  // Edit mode or Onboarding mode
  return (
    <ScrollView>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
          {!isOnboarding && (
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Profile Photo */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: userData.photo }} style={styles.profilePhoto} />
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: colors.primary }]} 
            onPress={() => console.log('Upload photo')}
          >
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Name*</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: errors.name ? 'red' : colors.border }
            ]}
            value={userData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Your full name"
            placeholderTextColor={colors.secondaryText}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Birthday*</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: errors.birthday ? 'red' : colors.border }
            ]}
            value={userData.birthday}
            onChangeText={(value) => handleChange('birthday', value)}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={colors.secondaryText}
          />
          {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Occupation*</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: errors.occupation ? 'red' : colors.border }
            ]}
            value={userData.occupation}
            onChangeText={(value) => handleChange('occupation', value)}
            placeholder="Your job title"
            placeholderTextColor={colors.secondaryText}
          />
          {errors.occupation && <Text style={styles.errorText}>{errors.occupation}</Text>}
        </View>
        
        {/* Professional Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Details</Text>
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Experience Level</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
            ]}
            value={userData.experienceLevel}
            onChangeText={(value) => handleChange('experienceLevel', value)}
            placeholder="Student, Entry Level, Senior, etc."
            placeholderTextColor={colors.secondaryText}
          />
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Experience</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
            ]}
            value={userData.experience}
            onChangeText={(value) => handleChange('experience', value)}
            placeholder="Your professional experience"
            placeholderTextColor={colors.secondaryText}
            multiline
            numberOfLines={4}
          />
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Education</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
            ]}
            value={userData.education}
            onChangeText={(value) => handleChange('education', value)}
            placeholder="Your education background"
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        
        {/* Bio */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me*</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.background, color: colors.text, borderColor: errors.bio ? 'red' : colors.border }
            ]}
            value={userData.bio}
            onChangeText={(value) => handleChange('bio', value)}
            placeholder="Tell others about yourself (max 500 characters)"
            placeholderTextColor={colors.secondaryText}
            multiline
            numberOfLines={5}
            maxLength={500}
          />
          <Text style={[styles.characterCount, { color: colors.secondaryText }]}>
            {userData.bio.length}/500
          </Text>
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>
        
        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Profile'}
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveButton}
          />
          {isSaving && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        </View>
        
        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <View style={styles.errorSummary}>
            <Text style={styles.errorSummaryText}>Please fix the errors above to continue</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  label: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  value: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 8,
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  saveButton: {
    height: 50,
  },
  spinner: {
    position: 'absolute',
    right: 20,
    top: 15,
  },
  errorText: {
    color: 'red',
    fontFamily: 'K2D-Regular',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  errorSummary: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorSummaryText: {
    color: 'red',
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
});
