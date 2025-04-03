
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import InterestSelector from '@/components/InterestSelector';
import IndustrySelector from '@/components/IndustrySelector';
import ExperienceLevelSelector from '@/components/ExperienceLevelSelector';
import CafeSelector from '@/components/CafeSelector';
import EmploymentHistoryEntry from '@/components/EmploymentHistoryEntry';
import CareerTransitionEntry from '@/components/CareerTransitionEntry';

export default function OnboardingScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    occupation: '',
    city: '',
    bio: '',
    photo_url: user?.photo_url || 'https://randomuser.me/api/portraits/lego/1.jpg',
    education: '',
    employment: [],
    career_transitions: [],
    experience_level: '',
    industry_categories: [],
    interests: [],
    favorite_cafes: [],
    photo: 'https://randomuser.me/api/portraits/lego/1.jpg',
  });

  const handleNext = () => {
    if (step < 10) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!profileData.name || !profileData.occupation || !profileData.city || 
          !profileData.bio || !profileData.education || !profileData.experience_level || 
          !profileData.industry_categories.length || !profileData.interests.length || 
          !profileData.favorite_cafes.length) {
        alert('Please fill in all required fields before continuing');
        setLoading(false);
        return;
      }
      await updateUser(profileData);
      router.replace('/(tabs)/matching');
    } catch (error) {
      console.error('Failed to save profile', error);
      alert('Failed to save profile information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const colors = Colors.light;

    switch(step) {
      case 1:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What's your name?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.secondaryText}
              value={profileData.name}
              onChangeText={(text) => setProfileData({ ...profileData, name: text })}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What's your occupation?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your job title"
              placeholderTextColor={colors.secondaryText}
              value={profileData.occupation}
              onChangeText={(text) => setProfileData({ ...profileData, occupation: text })}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Where are you located?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your city"
              placeholderTextColor={colors.secondaryText}
              value={profileData.city}
              onChangeText={(text) => setProfileData({ ...profileData, city: text })}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tell us about yourself</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Write a short bio..."
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={profileData.bio}
              onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Photo</Text>
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: profileData.photo_url }} 
                style={styles.profilePhoto}
              />
              <TouchableOpacity 
                style={[styles.photoButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // For now, we'll just use a placeholder image
                  setProfileData({ 
                    ...profileData, 
                    photo_url: `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 8) + 1}.jpg`
                  });
                }}
              >
                <Text style={styles.photoButtonText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Education</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your educational background"
              placeholderTextColor={colors.secondaryText}
              value={profileData.education}
              onChangeText={(text) => setProfileData({ ...profileData, education: text })}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Employment History</Text>
            <EmploymentHistoryEntry
              employment={profileData.employment[0] || {}}
              onChange={(updated) => setProfileData({ ...profileData, employment: [updated] })}
              onDelete={() => setProfileData({ ...profileData, employment: [] })}
              isDark={false}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Career Transitions</Text>
            <CareerTransitionEntry
              transition={profileData.career_transitions[0] || {}}
              onChange={(updated) => setProfileData({ ...profileData, career_transitions: [updated] })}
              onDelete={() => setProfileData({ ...profileData, career_transitions: [] })}
              isDark={false}
            />
          </View>
        );

      case 7:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience Level</Text>
            <ExperienceLevelSelector
              selected={profileData.experience_level}
              onChange={(level) => setProfileData({ ...profileData, experience_level: level })}
              isDark={false}
            />
          </View>
        );

      case 8:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Industry Categories</Text>
            <IndustrySelector
              selected={profileData.industry_categories}
              onChange={(industries) => setProfileData({ ...profileData, industry_categories: industries })}
              maxSelections={3}
              isDark={false}
            />
          </View>
        );

      case 9:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <InterestSelector
              selectedInterests={profileData.interests}
              onInterestsChange={(interests) => setProfileData({ ...profileData, interests })}
              maxInterests={5}
            />
          </View>
        );

      case 10:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Favorite Cafes</Text>
            <CafeSelector
              selected={profileData.favorite_cafes}
              onChange={(cafes) => setProfileData({ ...profileData, favorite_cafes: cafes })}
              isDark={false}
            />
          </View>
        );
    }
  };

  const colors = Colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Step {step} of 10
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${(step / 10) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>

          {renderStep()}

          <View style={styles.navigationContainer}>
            {step > 1 && (
              <TouchableOpacity 
                style={[styles.backButton, { borderColor: colors.border }]} 
                onPress={handleBack}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.nextButton, 
                { backgroundColor: colors.primary, flex: step === 1 ? 2 : 1 },
                loading && { opacity: 0.7 }
              ]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.nextButtonText}>
                {step === 10 ? 'Finish' : 'Next'}
              </Text>
              {loading && <Ionicons name="sync" size={18} color="white" style={styles.loadingIcon} />}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'K2D-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
  formSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  textArea: {
    minHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
  nextButton: {
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    color: 'white',
  },
  loadingIcon: {
    marginLeft: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  photoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  photoButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
});
