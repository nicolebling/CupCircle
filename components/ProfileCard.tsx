import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import Button from "./ui/Button";
import { Ionicons } from "@expo/vector-icons";
import IndustrySelector from "./IndustrySelector";
import ExperienceLevelSelector from "./ExperienceLevelSelector";
import InterestSelector from "./InterestSelector";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "./Badge";
import ProfileForm from "@/components/ProfileForm";

const { width } = Dimensions.get("window");

// Function to get coffee theme based on experience level
const getCoffeeTheme = (level: string): string => {
  switch (level) {
    case "Student":
      return "Warm Milk";
    case "Internship":
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
    default:
      return "";
  }
};

// Function to get color based on coffee level
const getCoffeeColor = (level: string): string => {
  switch (level) {
    case "Student":
      return "#E6C8A0"; // Warm milk color
    case "Internship":
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
  employment: string[];
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
  isLoading = false,
  onSave,
  onCancel,
  onLike,
  onSkip,
  userId,
  isNewUser = true,
}: ProfileCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [userData, setUserData] = useState<UserProfileData>(profile);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [education, setEducation] = useState("");
  const [city, setCity] = useState("");
  const [industryCategories, setIndustryCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [favoriteCafes, setFavoriteCafes] = useState<string[]>([]);
  const [employmentHistory, setEmploymentHistory] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const [profileData, setProfileData] = useState(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNewUser) {
      fetchProfile();
    }
  }, [userId, isNewUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log("Fetching profile for user ID:", userId);

      const { data: session } = await supabase.auth.getSession();
      //const userId = session?.user?.id;
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      console.log("Profile data fetched:", data);

      if (data) {
        setName(data.name || "");
        setUsername(data.username || "");
        setAvatar(data.photo_url || "");
        setOccupation(data.occupation || "");
        setBio(data.bio || "");
        setAge(data.age ? data.age.toString() : "");
        setExperienceLevel(data.experience_level || "");
        setEducation(data.education || "");
        setCity(data.city || "");
        setIndustryCategories(data.industry_categories || []);
        setSkills(data.skills || []);
        setNeighborhoods(data.neighborhoods || []);
        setFavoriteCafes(data.favorite_cafes || []);
        setInterests(data.interests || []);

        // Parse and set employment data
        let employmentData = [];
        if (data.employment) {
          try {
            employmentData = typeof data.employment === 'string' 
              ? JSON.parse(data.employment) 
              : data.employment;
          } catch (e) {
            console.error("Error parsing employment data:", e);
          }
        }
        setEmploymentHistory(employmentData);

        console.log("Profile data loaded into form state");
        console.log(data.favorite_cafes);
      }

      setUserData(data);
      setProfileData(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Failed to load profile information");
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

  // Function to handle edit button press
  const handleEdit = () => {
    if (onSave) {
      // This will trigger edit mode in the parent component
      onSave(userData);
    }
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

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Enable media access in settings.");
    }
  };

  const uploadImage = async (URI: string) => {
    try {
      setLoading(true);

      // Request permission before proceeding
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      const filename = uri.split("/").pop();
      const fileExt = filename?.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatar(data.publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }

    if (age && isNaN(Number(age))) {
      setError("Age must be a number");
      return false;
    }

    return true;
  };

  const { user } = useAuth();

  const saveProfile = async () => {
    console.log("Starting saveProfile function");
    if (!validateForm()) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.error("No authenticated user found:", userError?.message);
      return;
    }

    try {
      console.log("Setting loading state and clearing errors");
      setLoading(true);
      setError("");

      console.log("Current user:", user);
      console.log("Using user ID:", user.id);

      const ageNumber = age ? parseInt(age) : null;
      console.log("Parsed age:", ageNumber);

      console.log("Preparing to save profile for user ID:", user.id);
      console.log("Auth context user data:", { user });

      const profileData = {
        id: user.id, // Use the ID from AuthContext
        name,
        username,
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
        employment: employmentHistory, // Add employment history array
        updated_at: new Date(),
      };

      console.log(
        "Profile data being sent:",
        JSON.stringify(profileData, null, 2),
      );

      console.log(
        "Profile data being sent to Supabase:",
        JSON.stringify(profileData, null, 2),
      );

      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error response:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error hint:", error.hint);
        Alert.alert(
          "Profile Save Error",
          error?.message || "Failed to save profile. Please try again.",
        );
        throw error;
      }

      console.log("Profile saved successfully:", data);
      Alert.alert("Success", "Your profile has been saved");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile. Please try again.");
      if (error.code === "23505") {
        Alert.alert(
          "Duplicate Key Error",
          "A profile with this ID already exists. Please contact support.",
        );
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

  const getTitle = () => {
    if (isOnboarding) return "Complete Your Profile";
    if (isEditMode) return "Edit Profile";
    if (isUserProfile) return "My Profile";
    return profile.name || "Profile";
  };

  const handleChange = (field: keyof UserProfileData, value: any) => {
    setUserData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userData.name) newErrors.name = "Name is required";
    if (isUserProfile && !userData.birthday) newErrors.age = "Age is required";
    if (!userData.occupation) newErrors.occupation = "Occupation is required";
    if (!userData.bio) newErrors.bio = "Bio is required";
    if (userData.bio.length > 500)
      newErrors.bio = "Bio must be less than 500 characters";

    // Add more validation as needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      setUserData((prev) => ({ ...prev, favorite_cafes: selectedCafes }));
    } catch (error) {
      console.error("Error saving cafe selections:", error);
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
      setUserData(data);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
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
        <Image source={{ uri: profile.photo }} style={styles.image} />

        {profile.matchedCafe && (
          <View
            style={[styles.matchBadge, { backgroundColor: colors.primary }]}
          >
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
                <Ionicons
                  name="location"
                  size={16}
                  color={colors.secondaryText}
                />
                <Text
                  style={[styles.location, { color: colors.secondaryText }]}
                >
                  {profile.location}
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.occupationBadge,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons
              name="briefcase-outline"
              size={14}
              color={colors.primary}
              style={styles.occupationIcon}
            />
            <Text style={[styles.occupation, { color: colors.primary }]}>
              {profile.occupation}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>
          <Text
            style={[styles.sectionText, { color: colors.secondaryText }]}
            numberOfLines={3}
          >
            {profile.bio}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Interests
          </Text>
          <View style={styles.interestsContainer}>
            {profile.interests &&
              profile.interests.slice(0, 5).map((interest, index) => (
                <View
                  key={index}
                  style={[
                    styles.interestTag,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text
                    style={[styles.interestText, { color: colors.primary }]}
                  >
                    {interest}
                  </Text>
                </View>
              ))}
          </View>

          {profile.favoriteCafes && profile.favoriteCafes.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Favorite Cafes
              </Text>
              <View style={styles.interestsContainer}>
                {profile.favoriteCafes.slice(0, 3).map((cafe, index) => (
                  <View
                    key={index}
                    style={[
                      styles.interestTag,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Text
                      style={[styles.interestText, { color: colors.primary }]}
                    >
                      <Ionicons
                        name="cafe-outline"
                        size={12}
                        color={colors.primary}
                      />{" "}
                      {cafe}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {profile.neighborhoods && profile.neighborhoods.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Neighborhoods
              </Text>
              <View style={styles.interestsContainer}>
                {profile.neighborhoods
                  .slice(0, 3)
                  .map((neighborhood, index) => (
                    <View
                      key={index}
                      style={[
                        styles.interestTag,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Text
                        style={[styles.interestText, { color: colors.primary }]}
                      >
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color={colors.primary}
                        />{" "}
                        {neighborhood}
                      </Text>
                    </View>
                  ))}
              </View>
            </>
          )}

          {profile.experience && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Experience
              </Text>
              <Text
                style={[styles.sectionText, { color: colors.secondaryText }]}
                numberOfLines={2}
              >
                {profile.experience}
              </Text>
            </>
          )}
        </View>

        {onLike && onSkip && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={onSkip}
              style={[
                styles.actionButton,
                styles.skipButton,
                { backgroundColor: "#FEE2E2" },
              ]}
            >
              <Ionicons name="close" size={24} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLike}
              style={[
                styles.actionButton,
                styles.likeButton,
                { backgroundColor: "#DCFCE7" },
              ]}
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              padding: 0,
            },
          ]}
        >
          {/* Profile Photo */}
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
                  backgroundColor: "#1A1A1A",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 0,
                },
              ]}
            >
              <Ionicons name="person" size={60} color="#ffffff" />
            </View>
          )}

          <View style={{ padding: 16 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {profile.name}
              </Text>
            </View>

            <View
              style={[
                styles.tag,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignSelf: "flex-start",
                  marginTop: 4,
                },
              ]}
            >
              <Text style={[styles.occupation, { color: colors.primary }]}>
                {profile.occupation}
              </Text>
            </View>

            {profile.experience_level && (
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: colors.primary,
                    alignSelf: "flex-start",
                    marginTop: 4,
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
              >
                <Text style={[styles.occupation, { color: colors.primary }]}>
                  {profile.experience_level}
                  {"\t"}
                  <Ionicons
                    name="cafe"
                    size={14}
                    color={getCoffeeColor(profile.experience_level)}
                  />
                  <Text
                    style={[
                      styles.coffeeBadgeText,
                      { color: getCoffeeColor(profile.experience_level) },
                    ]}
                  >
                    {" "}
                    {getCoffeeTheme(profile.experience_level)}
                  </Text>
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>
                About
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {profile.bio}
              </Text>

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

              <Text style={[styles.label, { color: colors.secondaryText }]}>
                City
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {profile.city}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Professional Details */}
            <View style={styles.section}>

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
                            { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[styles.tagText, { color: colors.primary }]}
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
                          { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
                        ]}
                      >
                        <Text
                          style={[styles.tagText, { color: colors.primary }]}
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                          { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
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
              )}

              {/* Employment History Section */}
              
              {profile.employment && (
                <>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Employment History
                  </Text>
                  {(typeof profile.employment === 'string' 
                    ? JSON.parse(profile.employment) 
                    : profile.employment
                  ).map((job, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.employmentCard,
                        { 
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.primary + '40',
                          marginBottom: 12,
                          borderRadius: 8,
                          padding: 12
                        }
                      ]}
                    >
                      <View style={styles.employmentHeader}>
                        <Text style={[styles.companyName, { color: colors.text }]}>
                          {job.company}
                        </Text>
                        <Text style={[styles.position, { color: colors.primary }]}>
                          {job.position}
                        </Text>
                      </View>
                      <Text style={[styles.dateRange, { color: colors.secondaryText }]}>
                        {job.fromDate} - {job.toDate}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {profile.favorite_cafes && profile.favorite_cafes.length > 0 && (
                <>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Favorite Cafes
                  </Text>
                  <View style={styles.tagsContainer}>
                    {profile.favorite_cafes.map((cafe, index) => {
                      const [cafeName, cafeAddress] = cafe ? cafe.split("|||") : ['', ''];
                      return (
                        <View
                          key={index}
                          style={[
                            styles.tag,
                            {
                              backgroundColor: 'transparent',
                              borderWidth: 1,
                              borderColor: colors.primary,
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
                            <Ionicons
                              name="cafe"
                              size={12}
                              color={colors.primary}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.tagText,
                                {
                                  color: colors.primary,
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
                                fontSize: 10,
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
  employmentCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  employmentHeader: {
    marginBottom: 4,
  },
  companyName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  position: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
  dateRange: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
  },
  // Common styles
  card: {
    width: width - 32,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginHorizontal: 16,
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
    width: width - 32, // Full width of card minus margins
    height: width - 32, // Same as width for 1:1 ratio
    resizeMode: "cover",
  },
  content: {
    padding: 16,
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
    backgroundColor: "#EFE9D3",
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
    width: 120,
    height: 120,
    borderRadius: 60,
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
  value: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
    marginBottom: 16,
  },
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
});