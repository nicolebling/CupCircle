
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Button from './ui/Button';
import { Ionicons } from '@expo/vector-icons';
import IndustrySelector from './IndustrySelector';
import ExperienceLevelSelector from './ExperienceLevelSelector';
import InterestSelector from './InterestSelector';

const { width } = Dimensions.get('window');

// Function to get coffee theme based on experience level
const getCoffeeTheme = (level: string): string => {
  switch (level) {
    case 'Student': return 'Warm Milk';
    case 'Internship': return 'Latte';
    case 'Entry': return 'Light Roast';
    case 'Junior': return 'Medium Roast';
    case 'Senior': return 'Dark Roast';
    case 'Director': return 'Nitro Cold Brew';
    case 'Executive': return 'Espresso';
    default: return '';
  }
};

// Function to get color based on coffee level
const getCoffeeColor = (level: string): string => {
  switch (level) {
    case 'Student': return '#E6C8A0'; // Warm milk color
    case 'Internship': return '#D2B48C'; // Latte color
    case 'Entry': return '#C19A6B'; // Light roast
    case 'Junior': return '#A67B5B'; // Medium roast
    case 'Senior': return '#654321'; // Dark roast
    case 'Director': return '#483C32'; // Nitro cold brew
    case 'Executive': return '#301E1E'; // Espresso
    default: return '#F97415'; // App primary color
  }
};

export type UserProfileData = {
  id?: string;
  name: string;
  photo: string;
  birthday?: string;
  age?: number;
  occupation: string;
  experienceLevel?: string;
  industries?: string[];
  skills?: string[];
  experience?: string;
  education?: string;
  bio: string;
  city?: string;
  location?: string;
  neighborhoods?: string[];
  favoriteCafes?: string[];
  interests: string[];
  matchedCafe?: boolean;
};

type ProfileCardProps = {
  profile: UserProfileData;
  isUserProfile?: boolean;  // Whether this is the user's own profile (edit mode)
  isEditMode?: boolean;     // Whether the user profile is in edit mode
  isOnboarding?: boolean;   // Whether this is in the onboarding flow
  isLoading?: boolean;      // For loading states
  onSave?: (userData: UserProfileData) => void;
  onCancel?: () => void;
  onLike?: () => void;
  onSkip?: () => void;
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

export default function ProfileCard({ 
  profile = EMPTY_PROFILE,
  isUserProfile = false,
  isEditMode = false, 
  isOnboarding = false,
  isLoading = false,
  onSave,
  onCancel,
  onLike,
  onSkip
}: ProfileCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [userData, setUserData] = useState<UserProfileData>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Function to handle edit button press
  const handleEdit = () => {
    if (onSave) {
      // This will trigger edit mode in the parent component
      onSave(userData);
    }
  };

  const getTitle = () => {
    if (isOnboarding) return 'Complete Your Profile';
    if (isEditMode) return 'Edit Profile';
    if (isUserProfile) return 'My Profile';
    return profile.name || 'Profile';
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
    if (isUserProfile && !userData.birthday) newErrors.birthday = 'Birthday is required';
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

  // For matching view
  if (!isUserProfile && !isEditMode && !isOnboarding) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={{ uri: profile.photo }} style={styles.image} />
        
        {profile.matchedCafe && (
          <View style={[styles.matchBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="cafe" size={14} color="white" />
            <Text style={styles.matchBadgeText}>Café Match</Text>
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile.name} {profile.age && <Text>{profile.age}</Text>}
            </Text>
            {profile.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color={colors.secondaryText} />
                <Text style={[styles.location, { color: colors.secondaryText }]}>{profile.location}</Text>
              </View>
            )}
          </View>
          
          <View style={[styles.occupationBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="briefcase-outline" size={14} color={colors.primary} style={styles.occupationIcon} />
            <Text style={[styles.occupation, { color: colors.primary }]}>{profile.occupation}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.sectionText, { color: colors.secondaryText }]} numberOfLines={3}>
            {profile.bio}
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
          <View style={styles.interestsContainer}>
            {profile.interests && profile.interests.slice(0, 5).map((interest, index) => (
              <View 
                key={index} 
                style={[
                  styles.interestTag, 
                  { backgroundColor: colors.primary + '20' }
                ]}
              >
                <Text style={[styles.interestText, { color: colors.primary }]}>{interest}</Text>
              </View>
            ))}
          </View>
          
          {profile.favoriteCafes && profile.favoriteCafes.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Favorite Cafes</Text>
              <View style={styles.interestsContainer}>
                {profile.favoriteCafes.slice(0, 3).map((cafe, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.interestTag, 
                      { backgroundColor: colors.primary + '15' }
                    ]}
                  >
                    <Text style={[styles.interestText, { color: colors.primary }]}>
                      <Ionicons name="cafe-outline" size={12} color={colors.primary} /> {cafe}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {profile.neighborhoods && profile.neighborhoods.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Neighborhoods</Text>
              <View style={styles.interestsContainer}>
                {profile.neighborhoods.slice(0, 3).map((neighborhood, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.interestTag, 
                      { backgroundColor: colors.primary + '15' }
                    ]}
                  >
                    <Text style={[styles.interestText, { color: colors.primary }]}>
                      <Ionicons name="location-outline" size={12} color={colors.primary} /> {neighborhood}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {profile.experience && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>
              <Text style={[styles.sectionText, { color: colors.secondaryText }]} numberOfLines={2}>
                {profile.experience}
              </Text>
            </>
          )}
        </View>
        
        {onLike && onSkip && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              onPress={onSkip} 
              style={[styles.actionButton, styles.skipButton, { backgroundColor: '#FEE2E2' }]}
            >
              <Ionicons name="close" size={24} color="#EF4444" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onLike} 
              style={[styles.actionButton, styles.likeButton, { backgroundColor: '#DCFCE7' }]}
            >
              <Ionicons name="checkmark" size={24} color="#22C55E" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // For user profile view (non-edit)
  if (isUserProfile && !isEditMode && !isOnboarding) {
    return (
      <ScrollView>
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
            <TouchableOpacity onPress={() => isEditMode ? (onCancel && onCancel()) : handleEdit()}>
              <Ionicons name={isEditMode ? "close-outline" : "create-outline"} size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <Image source={{ uri: profile.photo }} style={styles.profilePhoto} />
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile.name} {profile.age && <Text>{profile.age}</Text>}
            </Text>
            {profile.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color={colors.secondaryText} />
                <Text style={[styles.location, { color: colors.secondaryText }]}>{profile.location}</Text>
              </View>
            )}
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Name</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile.name}</Text>

            <Text style={[styles.label, { color: colors.secondaryText }]}>Age</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile.age || 'Not provided'}</Text>

            <Text style={[styles.label, { color: colors.secondaryText }]}>Occupation</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile.occupation}</Text>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile.bio}</Text>
          </View>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
              <View style={styles.tagsContainer}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Professional Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Details</Text>
            
            {profile.experienceLevel && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Experience Level</Text>
                <View style={styles.coffeeExperienceContainer}>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {profile.experienceLevel}
                  </Text>
                  {/* Display coffee theme based on experience level */}
                  <View style={[styles.coffeeBadge, { 
                    backgroundColor: getCoffeeColor(profile.experienceLevel) + '20' 
                  }]}>
                    <Ionicons name="cafe" size={14} color={getCoffeeColor(profile.experienceLevel)} />
                    <Text style={[styles.coffeeBadgeText, { 
                      color: getCoffeeColor(profile.experienceLevel) 
                    }]}>
                      {getCoffeeTheme(profile.experienceLevel)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {profile.industries && profile.industries.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Industries</Text>
                <View style={styles.tagsContainer}>
                  {profile.industries.map((industry, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{industry}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Skills</Text>
                <View style={styles.tagsContainer}>
                  {profile.skills.map((skill, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {profile.experience && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Experience</Text>
                <Text style={[styles.value, { color: colors.text }]}>{profile.experience}</Text>
              </>
            )}

            {profile.education && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Education</Text>
                <Text style={[styles.value, { color: colors.text }]}>{profile.education}</Text>
              </>
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Preferences</Text>
            
            {profile.city && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>City</Text>
                <Text style={[styles.value, { color: colors.text }]}>{profile.city}</Text>
              </>
            )}

            {profile.neighborhoods && profile.neighborhoods.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Neighborhoods</Text>
                <View style={styles.tagsContainer}>
                  {profile.neighborhoods.map((neighborhood, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{neighborhood}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {profile.favoriteCafes && profile.favoriteCafes.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Favorite Cafes</Text>
                <View style={styles.tagsContainer}>
                  {profile.favoriteCafes.map((cafe, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{cafe}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          
        </View>
      </ScrollView>
    );
  }

  // Edit mode or Onboarding mode
  return (
    <ScrollView>
      <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          <ExperienceLevelSelector
            selectedLevel={userData.experienceLevel || ''}
            onLevelChange={(level) => handleChange('experienceLevel', level)}
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
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Industries (select up to 3)</Text>
          <IndustrySelector
            selectedIndustries={userData.industries || []}
            onIndustriesChange={(industries) => handleChange('industries', industries)}
            maxSelections={3}
          />
        </View>

        {/* Location Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Preferences</Text>
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Neighborhoods</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
            ]}
            value={userData.neighborhoods ? userData.neighborhoods.join(', ') : ''}
            onChangeText={(value) => handleChange('neighborhoods', value.split(',').map(item => item.trim()).filter(item => item !== ''))}
            placeholder="Downtown, Tech District, etc. (comma separated)"
            placeholderTextColor={colors.secondaryText}
          />
          
          <Text style={[styles.label, { color: colors.secondaryText }]}>Favorite Cafes</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
            ]}
            value={userData.favoriteCafes ? userData.favoriteCafes.join(', ') : ''}
            onChangeText={(value) => handleChange('favoriteCafes', value.split(',').map(item => item.trim()).filter(item => item !== ''))}
            placeholder="Coffee House, Bean There, etc. (comma separated)"
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        
        {/* Interests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
          <InterestSelector
            selectedInterests={userData.interests || []}
            onInterestsChange={(interests) => handleChange('interests', interests)}
            maxInterests={10}
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
            {userData.bio ? userData.bio.length : 0}/500
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
  // Common styles
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
  
  // Matching card styles
  image: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    marginLeft: 4,
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchBadgeText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  occupationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  occupationIcon: {
    marginRight: 6,
  },
  occupation: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFE9D3',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  sectionText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButton: {
    // Styles specific to skip button
  },
  likeButton: {
    // Styles specific to like button
  },
  
  // User profile styles
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
  coffeeExperienceContainer: {
    marginBottom: 16,
  },
  coffeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  coffeeBadgeText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
});
