
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    occupation: '',
    bio: '',
    interests: [] as string[],
    photo: 'https://randomuser.me/api/portraits/lego/1.jpg', // Default avatar
  });
  const [interest, setInterest] = useState('');

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

  const addInterest = () => {
    if (interest.trim() && !profileData.interests.includes(interest.trim())) {
      setProfileData({
        ...profileData,
        interests: [...profileData.interests, interest.trim()]
      });
      setInterest('');
    }
  };

  const removeInterest = (index: number) => {
    const newInterests = [...profileData.interests];
    newInterests.splice(index, 1);
    setProfileData({
      ...profileData,
      interests: newInterests
    });
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
              
              <View style={styles.interestInputContainer}>
                <TextInput
                  style={[styles.interestInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Add an interest (e.g., React, Marketing, Leadership)"
                  placeholderTextColor={colors.secondaryText}
                  value={interest}
                  onChangeText={setInterest}
                  onSubmitEditing={addInterest}
                />
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={addInterest}
                >
                  <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.interestTags}>
                {profileData.interests.map((item, index) => (
                  <View 
                    key={index} 
                    style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                    <TouchableOpacity onPress={() => removeInterest(index)}>
                      <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
                    </TouchableOpacity>
                  </View>
                ))}
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
                { backgroundColor: colors.primary },
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
    flex: step === 1 ? 2 : 1,
    flexDirection: 'row',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    color: 'white',
  },
  loadingIcon: {
    marginLeft: 8,
  }
});
