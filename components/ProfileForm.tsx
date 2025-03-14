import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import IndustrySelector from '@/components/IndustrySelector';
import InterestSelector from '@/components/InterestSelector';
import ExperienceLevelSelector from '@/components/ExperienceLevelSelector';

type ProfileFormProps = {
  userId: string;
  isNewUser?: boolean;
};

export default function ProfileForm({ userId, isNewUser = true }: ProfileFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [education, setEducation] = useState('');
  const [city, setCity] = useState('');
  const [industryCategories, setIndustryCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [favoriteCafes, setFavoriteCafes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNewUser) {
      fetchProfile();
    }
  }, [userId, isNewUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile for user ID:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      console.log('Profile fetched:', data);

      if (data) {
        setName(data.name || '');
        setUsername(data.username || '');
        setAvatar(data.photo_url || '');
        setOccupation(data.occupation || '');
        setBio(data.bio || '');
        setAge(data.age ? data.age.toString() : '');
        setExperienceLevel(data.experience_level || '');
        setEducation(data.education || '');
        setCity(data.city || '');
        setIndustryCategories(data.industry_categories || []);
        setSkills(data.skills || []);
        setNeighborhoods(data.neighborhoods || []);
        setFavoriteCafes(data.favorite_cafes || []);
        setInterests(data.interests || []);

        console.log('Profile data loaded into form state');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddNeighborhood = (neighborhood: string) => {
    if (neighborhood.trim() && !neighborhoods.includes(neighborhood.trim())) {
      setNeighborhoods([...neighborhoods, neighborhood.trim()]);
    }
  };

  const handleRemoveNeighborhood = (index: number) => {
    setNeighborhoods(neighborhoods.filter((_, i) => i !== index));
  };

  const handleAddCafe = (cafe: string) => {
    if (cafe.trim() && !favoriteCafes.includes(cafe.trim())) {
      setFavoriteCafes([...favoriteCafes, cafe.trim()]);
    }
  };

  const handleRemoveCafe = (index: number) => {
    setFavoriteCafes(favoriteCafes.filter((_, i) => i !== index));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);

      const filename = uri.split('/').pop();
      const fileExt = filename?.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatar(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }

    if (age && isNaN(Number(age))) {
      setError('Age must be a number');
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const ageNumber = age ? parseInt(age) : null;

      console.log('Preparing to save profile for user ID:', userId);

      const profileData = {
        id: userId,
        name,
        occupation,
        photo_url: avatar,
        bio,
        age: ageNumber,
        experience_level: experienceLevel,
        education,
        city,
        industry_categories: industryCategories,
        skills,
        neighborhoods,
        favorite_cafes: favoriteCafes,
        interests,
        updated_at: new Date(),
      };

      console.log('Profile data being sent:', JSON.stringify(profileData, null, 2));

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' }) 
        .select();

      if (error) {
        console.error('Supabase error response:', error);
        console.error('Error details:', JSON.stringify(error)); 
        Alert.alert('Profile Save Error', error?.message || 'Failed to save profile. Please try again.'); 
        throw error;
      }

      console.log('Profile saved successfully:', data);
      Alert.alert('Success', 'Your profile has been saved');
      router.replace('/(tabs)/matching');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
      if (error.code === '23505') {
        Alert.alert('Duplicate Key Error', 'A profile with this ID already exists. Please contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isNewUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097FB" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            {isNewUser ? 'Complete Your Profile' : 'Edit Profile'}
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#c62828" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {avatar ? (
              <View style={styles.avatarWrapper}>
                <Ionicons name="image" size={80} color="#ccc" />
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={80} color="#ccc" />
              </View>
            )}
            <Text style={[styles.avatarText, isDark && styles.textDark]}>
              {avatar ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Name*</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={isDark ? '#999' : '#777'}
              />
            </View>

            

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Age</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={age}
                onChangeText={setAge}
                placeholder="Your age"
                placeholderTextColor={isDark ? '#999' : '#777'}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>City</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={city}
                onChangeText={setCity}
                placeholder="Your city"
                placeholderTextColor={isDark ? '#999' : '#777'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Professional Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Occupation</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="Your job title"
                placeholderTextColor={isDark ? '#999' : '#777'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Experience Level</Text>
              <ExperienceLevelSelector
                value={experienceLevel}
                onChange={setExperienceLevel}
                isDark={isDark}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Education</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={education}
                onChangeText={setEducation}
                placeholder="Your educational background"
                placeholderTextColor={isDark ? '#999' : '#777'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Industry Categories</Text>
              <IndustrySelector
                selected={industryCategories}
                onChange={setIndustryCategories}
                isDark={isDark}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Skills</Text>
              <View style={styles.tagsContainer}>
                {skills.map((skill, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{skill}</Text>
                    <TouchableOpacity onPress={() => handleRemoveSkill(index)}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.tagInput}>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  placeholder="Add a skill"
                  placeholderTextColor={isDark ? '#999' : '#777'}
                  onSubmitEditing={(e) => {
                    handleAddSkill(e.nativeEvent.text);
                    e.currentTarget.clear();
                  }}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Bio</Text>
              <TextInput
                style={[styles.textArea, isDark && styles.inputDark]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={isDark ? '#999' : '#777'}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Interests</Text>
              <InterestSelector
                selected={interests}
                onChange={setInterests}
                isDark={isDark}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Favorite Neighborhoods</Text>
              <View style={styles.tagsContainer}>
                {neighborhoods.map((neighborhood, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{neighborhood}</Text>
                    <TouchableOpacity onPress={() => handleRemoveNeighborhood(index)}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.tagInput}>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  placeholder="Add a neighborhood"
                  placeholderTextColor={isDark ? '#999' : '#777'}
                  onSubmitEditing={(e) => {
                    handleAddNeighborhood(e.nativeEvent.text);
                    e.currentTarget.clear();
                  }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Favorite Cafes</Text>
              <View style={styles.tagsContainer}>
                {favoriteCafes.map((cafe, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{cafe}</Text>
                    <TouchableOpacity onPress={() => handleRemoveCafe(index)}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.tagInput}>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  placeholder="Add a cafe"
                  placeholderTextColor={isDark ? '#999' : '#777'}
                  onSubmitEditing={(e) => {
                    handleAddCafe(e.nativeEvent.text);
                    e.currentTarget.clear();
                  }}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={saveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  titleDark: {
    color: '#fff',
  },
  textDark: {
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: '#c62828',
    flex: 1,
    fontSize: 14,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputDark: {
    backgroundColor: '#333',
    borderColor: '#555',
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    height: 120,
    textAlignVertical: 'top',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    marginTop: 10,
    color: '#0097FB',
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#0097FB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    marginRight: 5,
  },
  tagInput: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#0097FB',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});