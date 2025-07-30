import React, { useState, useEffect,  } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  Dimensions,
  LinearGradient,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import InterestSelector from "./InterestSelector";
import IndustrySelector from "./IndustrySelector";
import ExperienceLevelSelector from "./ExperienceLevelSelector";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import NeighborhoodSelector from "./NeighborhoodSelector";
import CafeSelector from "./CafeSelector";
import EmploymentHistoryEntry from "./EmploymentHistoryEntry";
import CareerTransitionEntry from "./CareerTransitionEntry";
import SkeletonLoader from "./SkeletonLoader";
import {
  ActivityIndicator,
} from "react-native";

const { width } = Dimensions.get("window");

// Function to get coffee theme based on experience level
const getCoffeeTheme = (level: string): string => {
  switch (level) {
    case "Student":
      return "Warm Milk";
    case "Intern":
      return "Latte";
    case "Entry":
      return "Light Roast";
    case "Junior":
      return "Medium Roast";
    case "Senior":
      return "Dark Roast";
    case "Director":
      return "Nitro Cold Brew";
    case "Executive":
      return "Espresso";
    case "Self-employed":
      return "Drip";
    case "Founder":
      return "Home Brewed";
    case "I don't work":
      return "Decaf";
    default:
      return "";
  }
};

// Function to get color based on coffee level
const getCoffeeColor = (level: string): string => {
  switch (level) {
    case "Student":
      return "#E6C8A0"; // Warm milk color
    case "Intern":
      return "#D2B48C"; // Latte color
    case "Entry":
      return "#C19A6B"; // Light roast
    case "Junior":
      return "#A67B5B"; // Medium roast
    case "Senior":
      return "#654321"; // Dark roast
    case "Director":
      return "#483C32"; // Nitro cold brew
    case "Executive":
      return "#301E1E"; // Espresso
    case "Self-employed":
      return "#27449F"; // Drip coffee color
    case "Founder":
      return "#2f6569"; // Home brewed color
    case "I don't work":
      return "#6d5271"; // Decaf color
    default:
      return "#F97415"; // App primary color
  }
};

export type UserProfileData = {
  id?: string;
  name: string;
  photo: string;
  birthday?: string;
  age?: number;
  occupation: string;
  experience_level?: string;
  industry_categories?: string[];
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
  employment?: Array<{
    company: string;
    position: string;
    fromDate: string;
    toDate: string;
  }>;
};

type ProfileCardProps = {
  userId: string;
  isNewUser?: boolean;
  profile: UserProfileData;
  isUserProfile?: boolean; // Whether this is the user's own profile (edit mode)
  isEditMode?: boolean; // Whether the user profile is in edit mode
  isOnboarding?: boolean; // Whether this is in the onboarding flow
  isLoading?: boolean; // For loading states
  onSave?: (userData: UserProfileData) => void;
  onCancel?: () => void;
  onLike?: () => void;
  onSkip?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
};

const EMPTY_PROFILE: UserProfileData = {
  name: "",
  photo: "https://via.placeholder.com/150",
  birthday: "",
  occupation: "",
  experienceLevel: "",
  industries: [],
  skills: [],
  experience: "",
  education: "",
  bio: "",
  city: "New York City",
  neighborhoods: [],
  favoriteCafes: [],
  interests: [],
};

export default function ProfileCard({
  profile = EMPTY_PROFILE,
  isUserProfile = false,
  // isEditMode = false,
  isOnboarding = false,
  onLike,
  onSkip,
  userId,
  isNewUser = true,
}: ProfileCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!isNewUser) {
      fetchProfile();
    }
  }, [userId, isNewUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data: session } = await supabase.auth.getSession();
      //const userId = session?.user?.id;
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {


        if (data.employment) {
          try {
            let employmentData = [];
            // Parse the employment data array
            if (Array.isArray(data.employment)) {
              employmentData = data.employment.map((entry) => {
                return typeof entry === "string" ? JSON.parse(entry) : entry;
              });
            } else {
              employmentData = [JSON.parse(data.employment)];
            }

          } catch (e) {
            console.error("Error parsing employment data:", e);

          }
        } 
      }
      setProfileData(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load profile information");
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  if (loading && !isNewUser) {
    return (
      <View style={styles.loadingContainer}>
        {/* <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text> */}
      </View>
    );
  }

  const handleCafeSelect = async (selectedCafes) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          favorite_cafes: selectedCafes,
          updated_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;
    } catch (error) {
      Alert.alert("Error", "Failed to save cafe selections");
    }
  };

  const handleProfileSave = async (updatedData) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          ...updatedData,
          updated_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      setProfileData(data);
      setIsEditMode(false);
    } catch (error) {

      Alert.alert("Error", "Failed to save profile changes");
    }
  };

  if (!user) {
    return null;
  }
  // For matching view
  if (!isUserProfile && !isEditMode && !isOnboarding) {
    return (
      <View style={[styles.card, { backgroundColor: colors.background }]}>
        {/* Hero Section with Gradient Background */}
        <View style={styles.heroSection}>
          <View style={styles.gradientOverlay} />

          {/* Profile Photo */}
          <View style={styles.photoWrapper}>
            {profile.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={48} color="#fff" />
              </View>
            )}
            {profile.experience_level && (
              <View style={[styles.experienceBadge, { backgroundColor: getCoffeeColor(profile.experience_level) }]}>
                <Text style={styles.experienceBadgeText}>{getCoffeeTheme(profile.experience_level)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Header Info */}
          <View style={styles.headerBlock}>
            <Text style={[styles.nameText, { color: colors.text }]}>{profile.name}</Text>
            <Text style={[styles.titleText, { color: colors.primary }]}>{profile.occupation}</Text>

            {profile.experience_level && (profile.employment?.length > 0 || profile.career_transitions?.length > 0) && (
              <View style={styles.levelContainer}>
                <View style={styles.levelDot} />
                <Text style={[styles.levelText, { color: colors.secondaryText }]}>{profile.experience_level}</Text>
              </View>
            )}

            {profile.city && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={14} color={colors.secondaryText} />
                <Text style={[styles.locationText, { color: colors.secondaryText }]}>{profile.city}</Text>
              </View>
            )}
          </View>

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <Text style={[styles.bioText, { color: colors.text }]}>{profile.bio}</Text>
          </View>

          {/* Professional Timeline */}
          {((profile.employment && profile.employment.length > 0) || 
            (profile.career_transitions && profile.career_transitions.length > 0)) && (
            <View style={styles.timelineSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>

              {profile.employment && profile.employment.length > 0 && (
                <View style={styles.timeline}>
                  {profile.employment.map((jobString, index) => {
                    const job = typeof jobString === "string" ? JSON.parse(jobString) : jobString;
                    return (
                      <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineIndicator}>
                          <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                          {index < profile.employment.length - 1 && (
                            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                          )}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[styles.jobTitle, { color: colors.text }]}>{job.position}</Text>
                          <Text style={[styles.companyText, { color: colors.primary }]}>{job.company}</Text>
                          <Text style={[styles.dateText, { color: colors.secondaryText }]}>
                            {job.fromDate} - {job.toDate}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Career Transitions */}
              {profile.career_transitions && profile.career_transitions.length > 0 && (
                <View style={styles.transitionsSection}>
                  <Text style={[styles.subsectionTitle, { color: colors.secondaryText }]}>Career Transitions</Text>
                  {profile.career_transitions.map((transitionString, index) => {
                    const transition = JSON.parse(transitionString);
                    return (
                      <View key={index} style={styles.transitionItem}>
                        <Text style={[styles.transitionText, { color: colors.text }]}>
                          {transition.position1}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.primary} style={styles.transitionArrow} />
                        <Text style={[styles.transitionText, { color: colors.text }]}>
                          {transition.position2}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Education */}
          {profile.education && (
            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Education</Text>
              <Text style={[styles.infoText, { color: colors.secondaryText }]}>{profile.education}</Text>
            </View>
          )}

          {/* Industries */}
          {profile.industry_categories && profile.industry_categories.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Industries</Text>
              <View style={styles.tagGrid}>
                {profile.industry_categories.map((industry, index) => (
                  <View key={index} style={[styles.modernTag, { borderColor: colors.primary }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{industry}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Interests */}
          <View style={styles.tagSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.tagGrid}>
              {profile.interests && profile.interests.slice(0, 6).map((interest, index) => (
                <View key={index} style={[styles.modernTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {onLike && onSkip && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={[styles.actionButton, { backgroundColor: colors.input }]}
              disabled={currentIndex === 0}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLike}
              style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // For user profile view (non-edit)
  if (isUserProfile && !isEditMode && !isOnboarding) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.userProfileContainer, { backgroundColor: colors.background }]}>
          {/* Enhanced Hero Section */}
          <View style={styles.userHeroSection}>
            <View style={styles.heroGradient} />

            {/* Profile Photo */}
            <View style={styles.userPhotoWrapper}>
              {profile.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.userProfileImage} />
              ) : (
                <View style={styles.userPlaceholderImage}>
                  <Ionicons name="person" size={60} color="#fff" />
                </View>
              )}
              {profile.experience_level && (
                <View style={[styles.userExperienceBadge, { backgroundColor: getCoffeeColor(profile.experience_level) }]}>
                  <Text style={styles.userExperienceBadgeText}>{getCoffeeTheme(profile.experience_level)}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.userContentSection}>
            {/* Header */}
            <View style={styles.userHeaderBlock}>
              <Text style={[styles.userNameText, { color: colors.text }]}>{profile.name}</Text>
              <Text style={[styles.userTitleText, { color: colors.primary }]}>{profile.occupation}</Text>

              {profile.experience_level && (profile.employment?.length > 0 || profile.career_transitions?.length > 0) && (
                <View style={styles.userLevelContainer}>
                  <View style={[styles.userLevelDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.userLevelText, { color: colors.secondaryText }]}>{profile.experience_level}</Text>
                </View>
              )}

              {profile.city && (
                <View style={styles.userLocationContainer}>
                  <Ionicons name="location" size={16} color={colors.secondaryText} />
                  <Text style={[styles.userLocationText, { color: colors.secondaryText }]}>{profile.city}</Text>
                </View>
              )}
            </View>

            {/* Bio */}
            <View style={styles.userBioSection}>
              <Text style={[styles.userBioText, { color: colors.text }]}>{profile.bio}</Text>
            </View>

            {/* Professional Details */}
            {((profile.employment && profile.employment.length > 0) || 
              (profile.career_transitions && profile.career_transitions.length > 0) ||
              profile.education ||
              (profile.industry_categories && profile.industry_categories.length > 0)) && (
              <View style={styles.professionalSection}>
                <Text style={[styles.userSectionTitle, { color: colors.text }]}>Professional Details</Text>

                {/* Employment Timeline */}
                {profile.employment && profile.employment.length > 0 && (
                  <View style={styles.userTimelineSection}>
                    <Text style={[styles.userSubsectionTitle, { color: colors.secondaryText }]}>Experience</Text>
                    <View style={styles.userTimeline}>
                      {Array.isArray(profile.employment) ? (
                        profile.employment.map((jobString, index) => {
                          const job = JSON.parse(jobString);
                          return (
                            <View key={index} style={styles.userTimelineItem}>
                              <View style={styles.userTimelineIndicator}>
                                <View style={[styles.userTimelineDot, { backgroundColor: colors.primary }]} />
                                {index < profile.employment.length - 1 && (
                                  <View style={[styles.userTimelineLine, { backgroundColor: colors.border }]} />
                                )}
                              </View>
                              <View style={styles.userTimelineContent}>
                                <Text style={[styles.userJobTitle, { color: colors.text }]}>{job.position}</Text>
                                <Text style={[styles.userCompanyText, { color: colors.primary }]}>{job.company}</Text>
                                <Text style={[styles.userDateText, { color: colors.secondaryText }]}>
                                  {job.fromDate} - {job.toDate}
                                </Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={{ color: "red" }}>Employment data is not an array!</Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Career Transitions */}
                {profile.career_transitions && profile.career_transitions.length > 0 && (
                  <View style={styles.userTransitionsSection}>
                    <Text style={[styles.userSubsectionTitle, { color: colors.secondaryText }]}>Career Transitions</Text>
                    {profile.career_transitions.map((transitionString, index) => {
                      const transition = JSON.parse(transitionString);
                      return (
                        <View key={index} style={styles.userTransitionItem}>
                          <Text style={[styles.userTransitionText, { color: colors.text }]}>
                            {transition.position1}
                          </Text>
                          <Ionicons name="arrow-forward" size={18} color={colors.primary} style={styles.userTransitionArrow} />
                          <Text style={[styles.userTransitionText, { color: colors.text }]}>
                            {transition.position2}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Education */}
                {profile.education && (
                  <View style={styles.userEducationSection}>
                    <Text style={[styles.userSubsectionTitle, { color: colors.secondaryText }]}>Education</Text>
                    <Text style={[styles.userEducationText, { color: colors.text }]}>{profile.education}</Text>
                  </View>
                )}

                {/* Industry Categories */}
                {profile.industry_categories && profile.industry_categories.length > 0 && (
                  <View style={styles.userTagSection}>
                    <Text style={[styles.userSubsectionTitle, { color: colors.secondaryText }]}>Industries</Text>
                    <View style={styles.userTagGrid}>
                      {profile.industry_categories.map((industry, index) => (
                        <View key={index} style={[styles.userModernTag, { borderColor: colors.primary }]}>
                          <Text style={[styles.userTagText, { color: colors.primary }]}>{industry}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.userInterestsSection}>
                <Text style={[styles.userSectionTitle, { color: colors.text }]}>Interests</Text>
                <View style={styles.userTagGrid}>
                  {profile.interests.map((interest, index) => (
                    <View key={index} style={[styles.userModernTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                      <Text style={[styles.userTagText, { color: colors.primary }]}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Cafe Preferences */}
            {profile.favorite_cafes && profile.favorite_cafes.length > 0 && (
              <View style={styles.userCafeSection}>
                <Text style={[styles.userSectionTitle, { color: colors.text }]}>Cafe Preferences</Text>
                <View style={styles.cafeGrid}>
                  {profile.favorite_cafes.map((cafe, index) => {
                    const [cafeName, cafeAddress] = cafe ? cafe.split("|||") : ["", ""];
                    return (
                      <View key={index} style={[styles.cafeCard, { backgroundColor: colors.input, borderColor: colors.border }]}>
                        <View style={styles.cafeHeader}>
                          <Ionicons name="cafe" size={20} color={colors.primary} />
                          <Text style={[styles.cafeName, { color: colors.text }]}>{cafeName}</Text>
                        </View>
                        <Text style={[styles.cafeAddress, { color: colors.secondaryText }]}>{cafeAddress}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  // Edit mode or Onboarding mode
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {isEditMode ? (
        <ScrollView>
          <ProfileForm
            userId={user.id}
            isNewUser={false}
            initialData={profileData}
            onSave={(updatedData) => {
              handleProfileSave(updatedData);
              setIsEditMode(false);
            }}
            onCancel={() => setIsEditMode(false)}
            onCafeSelect={handleCafeSelect}
          />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Matching card styles
  card: {
    width: width - 40,
    borderRadius: 24,
    overflow: "hidden",
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  heroSection: {
    height: 280,
    position: "relative",
    backgroundColor: "#F97415",
    justifyContent: "center",
    alignItems: "center",
  },

  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(249, 116, 21, 0.8)",
  },

  photoWrapper: {
    position: "relative",
    alignItems: "center",
  },

  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#fff",
  },

  placeholderImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },

  experienceBadge: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  experienceBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "K2D-SemiBold",
  },

  contentSection: {
    padding: 24,
  },

  headerBlock: {
    alignItems: "center",
    marginBottom: 24,
  },

  nameText: {
    fontSize: 28,
    fontFamily: "K2D-Bold",
    textAlign: "center",
    marginBottom: 4,
  },

  titleText: {
    fontSize: 18,
    fontFamily: "K2D-Medium",
    textAlign: "center",
    marginBottom: 12,
  },

  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F97415",
    marginRight: 8,
  },

  levelText: {
    fontSize: 14,
    fontFamily: "K2D-Medium",
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    fontSize: 14,
    fontFamily: "K2D-Regular",
    marginLeft: 4,
  },

  bioSection: {
    marginBottom: 32,
  },

  bioText: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    lineHeight: 24,
    textAlign: "center",
  },

  timelineSection: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: "K2D-Bold",
    marginBottom: 20,
  },

  timeline: {
    paddingLeft: 20,
  },

  timelineItem: {
    flexDirection: "row",
    marginBottom: 24,
  },

  timelineIndicator: {
    width: 20,
    alignItems: "center",
    marginRight: 16,
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },

  timelineLine: {
    width: 2,
    flex: 1,
  },

  timelineContent: {
    flex: 1,
  },

  jobTitle: {
    fontSize: 16,
    fontFamily: "K2D-SemiBold",
    marginBottom: 4,
  },

  companyText: {
    fontSize: 15,
    fontFamily: "K2D-Medium",
    marginBottom: 4,
  },

  dateText: {
    fontSize: 13,
    fontFamily: "K2D-Regular",
  },

  transitionsSection: {
    marginTop: 24,
  },

  subsectionTitle: {
    fontSize: 16,
    fontFamily: "K2D-SemiBold",
    marginBottom: 16,
  },

  transitionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(249, 116, 21, 0.05)",
    borderRadius: 12,
  },

  transitionText: {
    fontSize: 14,
    fontFamily: "K2D-Medium",
    flex: 1,
  },

  transitionArrow: {
    marginHorizontal: 12,
  },

  infoSection: {
    marginBottom: 32,
  },

  infoText: {
    fontSize: 15,
    fontFamily: "K2D-Regular",
    lineHeight: 22,
  },

  tagSection: {
    marginBottom: 32,
  },

  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  modernTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },

  tagText: {
    fontSize: 13,
    fontFamily: "K2D-Medium",
  },

  actionSection: {
    flexDirection: "row",
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },

  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  primaryActionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F97415",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // User profile styles
  userProfileContainer: {
    flex: 1,
  },

  userHeroSection: {
    height: 200,
    position: "relative",
    backgroundColor: "#F97415",
    justifyContent: "center",
    alignItems: "center",
  },

  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(249, 116, 21, 0.9)",
  },

  userPhotoWrapper: {
    position: "relative",
    alignItems: "center",
    marginTop: 40,
  },

  userProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },

  userPlaceholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },

  userExperienceBadge: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  userExperienceBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "K2D-SemiBold",
  },

  userContentSection: {
    padding: 24,
    marginTop: -20,
    backgroundColor: "inherit",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  userHeaderBlock: {
    alignItems: "center",
    marginBottom: 24,
  },

  userNameText: {
    fontSize: 32,
    fontFamily: "K2D-Bold",
    textAlign: "center",
    marginBottom: 6,
  },

  userTitleText: {
    fontSize: 20,
    fontFamily: "K2D-Medium",
    textAlign: "center",
    marginBottom: 12,
  },

  userLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  userLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },

  userLevelText: {
    fontSize: 15,
    fontFamily: "K2D-Medium",
  },

  userLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  userLocationText: {
    fontSize: 15,
    fontFamily: "K2D-Regular",
    marginLeft: 6,
  },

  userBioSection: {
    marginBottom: 32,
  },

  userBioText: {
    fontSize: 17,
    fontFamily: "K2D-Regular",
    lineHeight: 26,
    textAlign: "center",
  },

  professionalSection: {
    marginBottom: 32,
  },

  userSectionTitle: {
    fontSize: 24,
    fontFamily: "K2D-Bold",
    marginBottom: 24,
  },

  userTimelineSection: {
    marginBottom: 24,
  },

  userSubsectionTitle: {
    fontSize: 18,
    fontFamily: "K2D-SemiBold",
    marginBottom: 16,
  },

  userTimeline: {
    paddingLeft: 24,
  },

  userTimelineItem: {
    flexDirection: "row",
    marginBottom: 24,
  },

  userTimelineIndicator: {
    width: 24,
    alignItems: "center",
    marginRight: 20,
  },

  userTimelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },

  userTimelineLine: {
    width: 2,
    flex: 1,
  },

  userTimelineContent: {
    flex: 1,
  },

  userJobTitle: {
    fontSize: 18,
    fontFamily: "K2D-SemiBold",
    marginBottom: 4,
  },

  userCompanyText: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
    marginBottom: 6,
  },

  userDateText: {
    fontSize: 14,
    fontFamily: "K2D-Regular",
  },

  userTransitionsSection: {
    marginBottom: 24,
  },

  userTransitionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(249, 116, 21, 0.08)",
    borderRadius: 16,
  },

  userTransitionText: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
    flex: 1,
  },

  userTransitionArrow: {
    marginHorizontal: 16,
  },

  userEducationSection: {
    marginBottom: 24,
  },

  userEducationText: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    lineHeight: 24,
  },

  userTagSection: {
    marginBottom: 24,
  },

  userTagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  userModernTag: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },

  userTagText: {
    fontSize: 14,
    fontFamily: "K2D-Medium",
  },

  userInterestsSection: {
    marginBottom: 32,
  },

  userCafeSection: {
    marginBottom: 32,
  },

  cafeGrid: {
    gap: 12,
  },

  cafeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  cafeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  cafeName: {
    fontSize: 16,
    fontFamily: "K2D-SemiBold",
    marginLeft: 8,
  },

  cafeAddress: {
    fontSize: 14,
    fontFamily: "K2D-Regular",
    lineHeight: 20,
  },

  // Common styles
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});