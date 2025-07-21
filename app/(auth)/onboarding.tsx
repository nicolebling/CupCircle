import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
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
    firstName: '',
    lastName: '',
    occupation: '',
    city: 'New York City',
    bio: '',
    photo_url: user?.photo_url || '',
    education: '',
    employment: [],
    career_transitions: [],
    experience_level: '',
    industry_categories: [],
    interests: [],
    favorite_cafes: [],
    centroid_lat: null,
    centroid_long: null,
  });

  const handleNext = () => {
    if (step < 12) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please enable media library access in settings.",
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result?.toString().split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const filePath = `${user?.id}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, decode(base64Data as string), {
          contentType: "image/png",
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("photos").getPublicUrl(filePath);

      setProfileData({
        ...profileData,
        photo_url: data.publicUrl
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCentroidChange = useCallback((centroid: { latitude: number; longitude: number } | null) => {
    setProfileData(prev => ({
      ...prev,
      centroid_lat: centroid?.latitude || null,
      centroid_long: centroid?.longitude || null,
    }));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!profileData.firstName || !profileData.lastName || !profileData.occupation || !profileData.city || 
          !profileData.bio || !profileData.education || !profileData.experience_level || 
          !profileData.industry_categories.length || !profileData.interests.length || 
          !profileData.favorite_cafes.length || !profileData.photo_url) {
        alert('Please fill in all required fields before continuing');
        setLoading(false);
        return;
      }
      const { firstName, lastName, ...profileDataWithoutNames } = profileData;
      const profileDataWithId = {
        ...profileDataWithoutNames,
        name: `${firstName} ${lastName}`,
        id: user?.id
      };
      await updateUser(profileDataWithId);

      // Register for push notifications now that profile is complete
      try {
        console.log('🔔 Registering for push notifications...');
        const { notificationService } = require('@/services/notificationService');
        const pushToken = await notificationService.registerForPushNotificationsAsync();

        if (pushToken) {
          await notificationService.savePushToken(user?.id, pushToken);
          console.log('✅ Push token saved successfully');
        } else {
          console.log('⚠️ Could not get push token');
        }
      } catch (error) {
        console.error('❌ Failed to register for push notifications:', error);
        // Don't block the user flow if push notifications fail
      }

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
              placeholder="First name"
              placeholderTextColor={colors.secondaryText}
              value={profileData.firstName}
              onChangeText={(text) => {
                const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
                setProfileData({ ...profileData, firstName: capitalizedText });
              }}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, marginTop: 12 }]}
              placeholder="Last name"
              placeholderTextColor={colors.secondaryText}
              value={profileData.lastName}
              onChangeText={(text) => {
                const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
                setProfileData({ ...profileData, lastName: capitalizedText });
              }}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>A headline for your profile</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>This could be your job title, passion, or just something that describes you best.</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Headline (Max 25 characters)"
              placeholderTextColor={colors.secondaryText}
              value={profileData.occupation}
              onChangeText={(text) => {
                if (text.length <= 25) {
                  setProfileData({ ...profileData, occupation: text });
                }
              }}
              maxLength={25}
            />
            <Text style={[styles.characterCount, { color: colors.secondaryText }]}>
              {profileData.occupation.length}/25 characters
            </Text>
          </View>
        );

      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Where are you located?</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>Currently, we're based only in NYC.</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.secondaryText, borderColor: colors.border, opacity: 0.6 }]}
              placeholder="New York City"
              placeholderTextColor={colors.secondaryText}
              value="New York City"
              editable={false}
            />
          </View>
        );

        case 4:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What best describes your current role or experience?</Text>
            <ExperienceLevelSelector
              selected={profileData.experience_level}
              onChange={(level) => setProfileData({ ...profileData, experience_level: level })}
              isDark={false}
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tell us about yourself</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Designer by day, aspiring barista by night. Let’s talk UX or espresso shots."
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={profileData.bio}
              onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Photo</Text>
            <View style={styles.photoContainer}>
              {profileData.photo_url ? (
                <Image 
                  source={{ uri: profileData.photo_url }} 
                  style={styles.profilePhoto}
                />
              ) : (
                <View
                  style={[
                    styles.profilePhoto,
                    {
                      backgroundColor: "#ededed",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Ionicons name="person" size={60} color="#fff" />
                </View>
              )}
              <TouchableOpacity 
                style={[styles.photoButton, { backgroundColor: colors.primary }]}
                onPress={pickImage}
              >
                <Text style={styles.photoButtonText}>
                  {profileData.photo_url ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 7:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Where did you study?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your school or university"
              placeholderTextColor={colors.secondaryText}
              value={profileData.education}
              onChangeText={(text) => setProfileData({ ...profileData, education: text })}
            />
          </View>
        );


      case 8:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What’s your current professional focus? (Max 3)</Text>
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Employment</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>Employment history is optional, but we recommend listing at least one.</Text>
              <EmploymentHistoryEntry
                employment={profileData.employment[0] || {}}
                onChange={(updated) => setProfileData({ ...profileData, employment: [updated] })}
                onDelete={() => setProfileData({ ...profileData, employment: [] })}
                isDark={false}
              />
            </View>
          );



        case 10:
          return (
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Career Transitions</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>If you've made a career shift, feel free to include it—it’s optional, but can add useful context.</Text>
              <CareerTransitionEntry
                transition={profileData.career_transitions[0] || {}}
                onChange={(updated) => setProfileData({ ...profileData, career_transitions: [updated] })}
                onDelete={() => setProfileData({ ...profileData, career_transitions: [] })}
                isDark={false}
              />
            </View>
          );

      case 11:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What do you enjoy doing?</Text>
            <InterestSelector
              selected={profileData.interests}
              onChange={(interests) => setProfileData({ ...profileData, interests })}
              maxInterests={5}
              isDark={false}
            />
          </View>
        );

      case 12:
        return (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top 3 Cafes</Text>
             <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>Share your top cafes for coffee chats.</Text>
            <CafeSelector
              selected={profileData.favorite_cafes}
              onChange={(cafes) => setProfileData({ ...profileData, favorite_cafes: cafes })}
              onCentroidChange={handleCentroidChange}
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
              Step {step} of 12
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${(step / 12) * 100}%`, backgroundColor: colors.primary }]} />
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
                {step === 12 ? 'Finish' : 'Next'}
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
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
  characterCount: {
    fontSize: 12,
    fontFamily: 'K2D-Regular',
    marginTop: -8,
    marginBottom: 16,
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