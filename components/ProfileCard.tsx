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
import ExperienceHistoryEntry from "./ExperienceHistoryEntry";
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
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Profile Photo */}
        <View style={styles.imageContainer}>
          {/* Added container */}
          {profile.photo ? (
            <Image source={{ uri: profile.photo }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.image,
                {
                  backgroundColor: "#ededed",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 2,
                },
              ]}
            >
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}
          {profile.experience_level && (
            <View
              style={[
                styles.decorativeCircle,
                { borderColor: getCoffeeColor(profile.experience_level) },
              ]}
            />
          )}
        </View>

        {/* Match badge - Edit for later */}
        {/* {profile.matchedCafe && (
          <View
            style={[styles.matchBadge, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="cafe" size={14} color="white" />
            <Text style={styles.matchBadgeText}>Café Match</Text>
          </View>
        )} */}

        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <View style={styles.headerInfo}>
              {/* Name */}
              <View style={styles.nameContainer}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {profile.name}{profile.last_name ? ` ${profile.last_name.charAt(0)}.` : ''}
                </Text>
              </View>

              {/* Occupation / Headline */}
              <View style={styles.positionContainer}>
                <Text style={[styles.position, { color: colors.primary }]}>
                  {profile.occupation}
                </Text>
              </View>

              {/* Experience level */}
              <View style={styles.locationContainer}>
                {profile.experience_level &&
                  (profile.employment?.length > 0 ||
                    profile.career_transitions?.length > 0) && (
                    <Text
                      style={[
                        styles.experience,
                        { color: colors.secondaryText },
                      ]}
                    >
                      {profile.experience_level}
                    </Text>
                  )}
              </View>

              {/* Location */}
              {profile.city && (
                <View style={styles.locationContainer}>
                  {/* <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.secondaryText}
                  /> */}
                  <Text
                    style={[styles.location, { color: colors.secondaryText }]}
                  >
                    {profile.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bio */}
          <View style={styles.bioContainer}>
            <Text style={[styles.bioText, { color: colors.text }]}>
              {profile.bio}
            </Text>
          </View>

          {/* Only show divider and Experience section if there's employment or career transition data */}
          {((profile.employment && profile.employment.length > 0) || 
            (profile.career_transitions && profile.career_transitions.length > 0)) && (
            <View style={styles.divider} />
          )}

          {/* Employment */}
          {profile.employment && profile.employment.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.secondaryText }]}>
                Experience
              </Text>
              {profile.employment.map((jobString, index) => {
                const job =
                  typeof jobString === "string"
                    ? JSON.parse(jobString)
                    : jobString;
                return (
                  <View key={index} style={styles.employmentContainer}>
                    <View style={styles.timelineDot} />
                    <View style={styles.employmentCard}>
                      <Text
                        style={[
                          styles.position,
                          { color: colors.text, fontSize: 16, marginBottom: 4 },
                        ]}
                      >
                        {job.position}
                      </Text>
                      <Text
                        style={[
                          styles.companyName,
                          { color: colors.text, fontSize: 14 },
                        ]}
                      >
                        {job.company}
                      </Text>
                      <Text
                        style={[
                          styles.dateRange,
                          {
                            color: colors.secondaryText,
                            fontSize: 14,
                            marginTop: 4,
                          },
                        ]}
                      >
                        {job.fromDate} - {job.toDate}
                      </Text>
                    </View>
                    {index < profile.employment.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* Career Transitions */}
          {profile.career_transitions &&
            profile.career_transitions.length > 0 && (
              <>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.secondaryText,
                      marginTop: 24,
                      marginBottom: 16,
                    },
                  ]}
                >
                  Career Transitions
                </Text>
                <View>
                  {profile.career_transitions.map(
                    (transitionString, index) => {
                      const transition = JSON.parse(transitionString);
                      return (
                        <View
                          key={index}
                          style={styles.transitionContainer}
                        >
                          <View style={styles.transitionCard}>
                            <View style={styles.transitionText}>
                              <Text
                                style={[
                                  styles.position,
                                  { color: colors.text },
                                ]}
                              >
                                {transition.position1}
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={20}
                                color={colors.primary}
                                style={styles.transitionArrow}
                              />
                              <Text
                                style={[
                                  styles.position,
                                  { color: colors.text },
                                ]}
                              >
                                {transition.position2}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    },
                  )}
                </View>
              </>
            )}

          {/* Education */}
          {profile.education && (
            <>
              <Text style={[styles.label, { color: colors.secondaryText }]}>
                Education
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {profile.education}
              </Text>
            </>
          )}

          {/* Industries */}
          {profile.industry_categories &&
            profile.industry_categories.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  Industries
                </Text>
                <View style={styles.interestsContainer}>
                  {profile.industry_categories.map((industry, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: "transparent",
                          borderWidth: 1,
                          borderColor: colors.text,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.tagText, { color: colors.text }]}
                      >
                        {industry}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

          {/* Interests */}
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Interests
          </Text>
          <View style={styles.interestsContainer}>
            {profile.interests &&
              profile.interests.slice(0, 5).map((interest, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: colors.text,
                    },
                  ]}
                >
                  <Text
                    style={[styles.tagText, { color: colors.text }]}
                  >
                    {interest}
                  </Text>
                </View>
              ))}
          </View>

        </View>

        {onLike && onSkip && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={[
                styles.actionButton,
                styles.likeButton,
                { backgroundColor: "#FFF" },
              ]}
              disabled={currentIndex === 0}
            >
              <Ionicons name="arrow-back" size={24} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLike}
              style={[
                styles.actionButton,
                styles.likeButton,
                { backgroundColor: "#FFF" },
              ]}
            >
              <Ionicons name="arrow-forward" size={24} color="#64748B" />
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
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              padding: 0,
              paddingTop: 16,
            },
          ]}
        >
          {/* Profile Photo */}
          <View style={[styles.imageContainer, { marginTop: 32 }]}>
            {/* Added container */}
            {profile.photo_url ? (
              <Image
                source={{ uri: profile.photo_url }}
                style={[styles.image, { marginTop: 0 }]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.image,
                  {
                    backgroundColor: "#ededed",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 0,
                  },
                ]}
              >
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            )}
            {profile.experience_level && (
              <View
                style={[
                  styles.decorativeCircle,
                  { borderColor: getCoffeeColor(profile.experience_level) },
                ]}
              />
            )}
          </View>

          <View style={{ padding: 16 }}>
            <View style={styles.headerContainer}>
              <View style={styles.headerInfo}>
                <Text
                  style={[
                    styles.name,
                    { color: colors.text, textAlign: "center" },
                  ]}
                >
                  {profile.name}{profile.last_name ? ` ${profile.last_name.charAt(0)}.` : ''}
                </Text>

                <View
                  style={[
                    styles.positionContainer,
                    { justifyContent: "center" },
                  ]}
                >
                  <Text style={[styles.position, { color: colors.primary,  }]}>
                    {profile.occupation}
                  </Text>
                </View>

                {/* Experience Level */}
                <View style={styles.locationContainer}>
                  {profile.experience_level &&
                    (profile.employment?.length > 0 ||
                      profile.career_transitions?.length > 0) && (
                      <Text
                        style={[
                          styles.experience,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {profile.experience_level}
                      </Text>
                    )}
                </View>

                {profile.city && (
                  <View
                    style={[
                      styles.locationContainer,
                      { justifyContent: "center" },
                    ]}
                  >
                    {/* <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.secondaryText}
                    /> */}
                    <Text
                      style={[styles.location, { color: colors.secondaryText }]}
                    >
                      {profile.city}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.bioContainer}>
              <Text style={[styles.bioText, { color: colors.text }]}>
                {profile.bio}
              </Text>
            </View>

            {/* Only show divider and Professional Details section if there's employment, career transitions, education, or industry data */}
            {((profile.employment && profile.employment.length > 0) || 
              (profile.career_transitions && profile.career_transitions.length > 0) ||
              profile.education ||
              (profile.industry_categories && profile.industry_categories.length > 0)) && (
              <View style={styles.divider} />
            )}

            {/* Professional Details */}
            <View style={styles.section}>
              {/* Employment Section */}
              {profile.employment && profile.employment.length > 0 && (
                <>
                  <Text
                    style={[
                      styles.label,
                      { color: colors.secondaryText, marginBottom: 16 },
                    ]}
                  >
                    Experience
                  </Text>
                  <View>
                    {/* Added View to wrap timeline */}
                    {Array.isArray(profile.employment) ? (
                      profile.employment.map((jobString, index) => {
                        // Parse each job entry from string to object
                        const job = JSON.parse(jobString);
                        return (
                          <View key={index} style={styles.employmentContainer}>
                            <View style={styles.timelineDot} />
                            <View style={styles.employmentCard}>
                              <Text
                                style={[
                                  styles.position,
                                  {
                                    color: colors.text,
                                    fontSize: 16,
                                    marginBottom: 4,
                                  },
                                ]}
                              >
                                {job.position}
                              </Text>
                              <Text
                                style={[
                                  styles.companyName,
                                  { color: colors.text, fontSize: 14 },
                                ]}
                              >
                                {job.company}
                              </Text>
                              <Text
                                style={[
                                  styles.dateRange,
                                  {
                                    color: colors.secondaryText,
                                    fontSize: 14,
                                    marginTop: 4,
                                  },
                                ]}
                              >
                                {job.fromDate} - {job.toDate}
                              </Text>
                            </View>
                            {index < profile.employment.length - 1 && (
                              <View style={styles.timelineLine} />
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <Text style={{ color: "red" }}>
                        Employment data is not an array!
                      </Text>
                    )}
                  </View>
                </>
              )}

              {/* Career Transitions Section */}
              {profile.career_transitions &&
                profile.career_transitions.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.label,
                        {
                          color: colors.secondaryText,
                          marginTop: 24,
                          marginBottom: 16,
                        },
                      ]}
                    >
                      Career Transitions
                    </Text>
                    <View>
                      {profile.career_transitions.map(
                        (transitionString, index) => {
                          const transition = JSON.parse(transitionString);
                          return (
                            <View
                              key={index}
                              style={styles.transitionContainer}
                            >
                              <View style={styles.transitionCard}>
                                <View style={styles.transitionText}>
                                  <Text
                                    style={[
                                      styles.position,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {transition.position1}
                                  </Text>
                                  <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color={colors.primary}
                                    style={styles.transitionArrow}
                                  />
                                  <Text
                                    style={[
                                      styles.position,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {transition.position2}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          );
                        },
                      )}
                    </View>
                  </>
                )}

              {/* Education */}
              {profile.education && (
                <>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Education
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {profile.education}
                  </Text>
                </>
              )}

              {/* Industry Categories */}
              {profile.industry_categories &&
                profile.industry_categories.length > 0 && (
                  <>
                    <Text
                      style={[styles.label, { color: colors.secondaryText }]}
                    >
                      Industries
                    </Text>
                    <View style={styles.tagsContainer}>
                      {profile.industry_categories.map((industry, index) => (
                        <View
                          key={index}
                          style={[
                            styles.tag,
                            {
                              backgroundColor: "transparent",
                              borderWidth: 1,
                              borderColor: colors.text,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.tagText, { color: colors.text}]}
                          >
                            {industry}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Interests
                  </Text>
                  <View style={styles.tagsContainer}>
                    {profile.interests.map((interest, index) => (
                      <View
                        key={index}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: "transparent",
                            borderWidth: 1,
                            borderColor: colors.text,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.tagText, { color: colors.text }]}
                        >
                          {interest}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Location */}
            <View style={styles.section}>
              {/* <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Location Preferences
              </Text>

              {profile.neighborhoods && profile.neighborhoods.length > 0 && (
                <>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Neighborhoods
                  </Text>
                  <View style={styles.tagsContainer}>
                    {profile.neighborhoods.map((neighborhood, index) => (
                      <View
                        key={index}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: "transparent",
                            borderWidth: 1,
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.tagText, { color: colors.primary }]}
                        >
                          {neighborhood}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )} */}

              {profile.favorite_cafes && profile.favorite_cafes.length > 0 && (
                <>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Cafe Preferences
                  </Text>
                  <View style={styles.tagsContainer}>
                    {profile.favorite_cafes.map((cafe, index) => {
                      const [cafeName, cafeAddress] = cafe
                        ? cafe.split("|||")
                        : ["", ""];
                      return (
                        <View
                          key={index}
                          style={[
                            styles.tag,
                            {
                              backgroundColor: "transparent",
                              borderWidth: 1,
                              borderColor: colors.text,
                              flexDirection: "column",
                              alignItems: "flex-start",
                              padding: 8,
                            },
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                          >
                            {/* <Ionicons
                              name="cafe"
                              size={12}
                              color={colors.primary}
                              style={{ marginRight: 4 }}
                            /> */}
                            <Text
                              style={[
                                styles.tagText,
                                {
                                  color: colors.text,
                                  fontFamily: "K2D-Medium",
                                },
                              ]}
                            >
                              {cafeName}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.tagText,
                              {
                                color: colors.secondaryText,
                                fontSize: 12,
                                fontFamily: "K2D-Regular",
                              },
                            ]}
                          >
                            {cafeAddress}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
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
  transitionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 32,
    position: "relative",
  },
  transitionCard: {
    flex: 1,
  },
  transitionText: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  arrow: {
    marginHorizontal: 8,
  },
  position: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    flexShrink: 1,
  },
  position2Long: {
    marginTop: 8,
    width: "100%",
  },
  transitionArrowLong: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  employmentCard: {
    marginBottom: 16,
  },
  employmentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 32,
    position: "relative",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginRight: 16,
    marginTop: 6,
  },
  timelineLine: {
    width: 1,
    position: "absolute",
    left: 3.5,
    top: 24,
    bottom: -24,
    backgroundColor: "#ccc",
  },
  employmentHeader: {
    marginBottom: 4,
  },
  companyName: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    color: "#666",
  },
  position: {
    fontFamily: "K2D-Medium",
    fontSize: 16,
  },
  dateRange: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    color: "#666",
  },
  // Common styles
  card: {
    width: width - 32,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    margin: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "K2D-Bold",
    fontSize: 24,
  },

  // Matching card styles
  image: {
    width: Math.min((width - 32) * 0.45, 180), // Smaller and capped for tablets
    height: Math.min((width - 32) * 0.45, 180), // Keep 1:1 ratio
    resizeMode: "cover",
    borderRadius: Math.min((width - 32) * 0.45, 180) / 2, // Makes the image circular
    alignSelf: "center", // Center the image
    zIndex: 2,
  },
  imageContainer: {
    position: "relative",
    marginTop: 40,
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingHorizontal: Math.max(16, (width - 600) / 2 + 16), // Add more padding on wider screens
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontFamily: "K2D-Bold",
    fontSize: 24,
  },
  locationContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    marginLeft: 4,
  },
  matchBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchBadgeText: {
    fontFamily: "K2D-Medium",
    fontSize: 12,
    color: "white",
    marginLeft: 4,
  },
  occupationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  occupationIcon: {
    marginRight: 6,
  },
  occupation: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#DFDFDF",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "K2D-SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  sectionText: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    fontFamily: "K2D-Medium",
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "center",
    color: "#FFF",
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
    shadowColor: "#000",
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
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  value: { fontFamily: "K2D-Regular", fontSize: 16, marginBottom: 16 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  tagText: {
    fontFamily: "K2D-Medium",
    fontSize: 12,
    marginRight: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontFamily: "K2D-Regular",
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 8,
    fontFamily: "K2D-Regular",
    fontSize: 16,
    textAlignVertical: "top",
  },
  characterCount: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 24,
    position: "relative",
  },
  saveButton: {
    height: 50,
  },
  spinner: {
    position: "absolute",
    right: 20,
    top: 15,
  },
  errorText: {
    color: "red",
    fontFamily: "K2D-Regular",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  errorSummary: {
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorSummaryText: {
    color: "red",
    fontFamily: "K2D-Medium",
    fontSize: 14,
  },
  coffeeExperienceContainer: {
    marginBottom: 16,
  },
  coffeeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  coffeeBadgeText: {
    fontFamily: "K2D-Medium",
    fontSize: 12,
    marginLeft: 4,
  },
  tagInput: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    marginTop: 10,
    color: "#0097FB",
    fontSize: 16,
  },
  textDark: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  inputGroup: {
    marginBottom: 20,
  },
  container: {
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  photoContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  headerInfo: {
    width: "100%",
    alignItems: "center",
  },
  positionContainer: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 8,
  },
  position: {
    fontFamily: "K2D-Medium",
    fontSize: 16,
  },
  experience: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    marginLeft: 8,
  },
  bioContainer: {
    marginBottom: 16,
    marginTop: 22,
    paddingHorizontal: 4, // Add padding to prevent text clipping
  },
  bioText: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  transitionArrow: {
    marginHorizontal: 8,
  },
  decorativeCircle: {
    position: "absolute",
    width: Math.min((width - 32) * 0.45, 180) + 20, // Match smaller image size
    height: Math.min((width - 32) * 0.45, 180) + 20,
    borderRadius: (Math.min((width - 32) * 0.45, 180) + 16) / 2,
    borderWidth: 6,
    backgroundColor: "transparent",
    top: -10,
    zIndex: 1,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: "visible",
  },
});