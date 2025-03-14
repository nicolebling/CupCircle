import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import InterestSelector from '@/components/InterestSelector';
import IndustrySelector from '@/components/IndustrySelector'; // Import IndustrySelector

export default function OnboardingScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    occupation: '',
    bio: '',
    interests: [] as string[],
    industry_categories: [], // Add industry_categories to profileData
    photo: 'https://randomuser.me/api/portraits/lego/1.jpg', // Default avatar
  });
  const colors = Colors.light;

  const handleNext = () => {
    if (step < 3) {
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
      await updateUser(profileData);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save profile', error);
      alert('Failed to save profile information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData({...profileData, [field]: value});
  };


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
              Step {step} of 3
            </Text>
          </View>

          {step === 1 && (
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.secondaryText}
                value={profileData.name}
                onChangeText={(text) => setProfileData({ ...profileData, name: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>Occupation</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your job title"
                placeholderTextColor={colors.secondaryText}
                value={profileData.occupation}
                onChangeText={(text) => setProfileData({ ...profileData, occupation: text })}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About You</Text>

              <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Tell others about yourself, your experience, and what you're looking for in coffee chats..."
                placeholderTextColor={colors.secondaryText}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={profileData.bio}
                onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Interests</Text>
              <Text style={[styles.description, { color: colors.secondaryText }]}>
                Add interests that will help connect you with like-minded professionals
              </Text>

              <InterestSelector
                selectedInterests={profileData.interests}
                onInterestsChange={(interests) => setProfileData({...profileData, interests})}
                maxInterests={5}
              />
              <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                Select up to 5 interests that will help connect you with like-minded professionals
              </Text>
              <View style={styles.inputGroup}> {/* Placeholder for IndustrySelector */}
                <Text style={[styles.label, { color: colors.text }]}>Industries</Text>
                <IndustrySelector
                  selected={profileData.industry_categories || []}
                  onChange={(industries) => handleInputChange('industry_categories', industries)}
                  maxSelections={3}
                  isDark={false} // Assuming light theme by default.  Needs proper theme integration.
                />
              </View>
            </View>
          )}

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
                {step === 3 ? 'Finish' : 'Next'}
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
  card: {
    width: width - 32,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    padding: 16,
    margin: 16,
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
  buttonContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  saveButton: {
    height: 50,
  },
  errorText: {
    color: 'red',
    fontFamily: 'K2D-Regular',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
    marginBottom: 4,
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
  },
  formSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
    marginBottom: 16,
  },
  helperText: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginBottom: 8,
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
  interestInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  interestInput: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    marginRight: 8,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
    marginRight: 4,
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
  inputGroup: {
    marginBottom: 16,
  }
});