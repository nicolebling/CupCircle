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
  isUserProfile?: boolean; // Whether this is the user's own profile (edit mode)
  isEditMode?: boolean; // Whether the user profile is in edit mode
  isOnboarding?: boolean; // Whether this is in the onboarding flow
  isLoading?: boolean; // For loading states
  onSave?: (userData: UserProfileData) => void;
  onCancel?: () => void;
  onLike?: () => void;
  onSkip?: () => void;
  userId: string;
  isNewUser?: boolean;
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
  isEditMode = false,
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
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  //others
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
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
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

        console.log("Profile data loaded into form state");
      }

      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Failed to load profile information");
    } finally {
      setLoading(false);
    }
  };

  ///NEW

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

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);

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
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    try {
      console.log("Setting loading state and clearing errors");
      setLoading(true);
      setError("");
      
      if (!user) {
        console.error("No authenticated user found");
        setError("User not authenticated");
        return;
      }

      console.log("Current user state:", user);
      console.log("Using user ID:", user.id);

      const ageNumber = age ? parseInt(age) : null;
      console.log("Parsed age:", ageNumber);

      console.log("Preparing to save profile for user ID:", user.id);
      console.log("Auth context user data:", { user });

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

      console.log(
        "Profile data being sent:",
        JSON.stringify(profileData, null, 2),
      );

      console.log("Profile data being sent to Supabase:", JSON.stringify(profileData, null, 2));
      
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
      router.replace("/(tabs)/matching");
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

  ////////////////////////////

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
    if (isUserProfile && !userData.birthday)
      newErrors.age = "Age is required";
    if (!userData.occupation) newErrors.occupation = "Occupation is required";
    if (!userData.bio) newErrors.bio = "Bio is required";
    if (userData.bio.length > 500)
      newErrors.bio = "Bio must be less than 500 characters";

    // Add more validation as needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


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
      <ScrollView>
        <View
          style={[
            styles.userCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {getTitle()}
            </Text>
            <TouchableOpacity
              onPress={() =>
                isEditMode ? onCancel && onCancel() : handleEdit()
              }
            >
              <Ionicons
                name={isEditMode ? "close-outline" : "create-outline"}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: profile.photo }}
              style={styles.profilePhoto}
            />
          </View>

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

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Information
            </Text>
            <Text style={[styles.label, { color: colors.secondaryText }]}>
              Name
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {profile.name}
            </Text>

            <Text style={[styles.label, { color: colors.secondaryText }]}>
              Age
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {profile.age || "Not provided"}
            </Text>

            <Text style={[styles.label, { color: colors.secondaryText }]}>
              Occupation
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {profile.occupation}
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About Me
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {profile.bio}
            </Text>
          </View>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Interests
              </Text>
              <View style={styles.tagsContainer}>
                {profile.interests.map((interest, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Professional Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Professional Details
            </Text>

            {profile.experienceLevel && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  Experience Level
                </Text>
                <View style={styles.coffeeExperienceContainer}>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {profile.experienceLevel || ""}
                  </Text>
                  {/* Display coffee theme based on experience level */}
                  <View
                    style={[
                      styles.coffeeBadge,
                      {
                        backgroundColor:
                          getCoffeeColor(profile.experienceLevel || "") + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name="cafe"
                      size={14}
                      color={getCoffeeColor(profile.experienceLevel || "")}
                    />
                    <Text
                      style={[
                        styles.coffeeBadgeText,
                        {
                          color: getCoffeeColor(profile.experienceLevel || ""),
                        },
                      ]}
                    >
                      {getCoffeeTheme(profile.experienceLevel || "")}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {profile.industries && profile.industries.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  Industries
                </Text>
                <View style={styles.tagsContainer}>
                  {profile.industries.map((industry, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>
                        {industry}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  Skills
                </Text>
                <View style={styles.tagsContainer}>
                  {profile.skills.map((skill, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {profile.experience && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  Experience
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {profile.experience}
                </Text>
              </>
            )}

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
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location Preferences
            </Text>

            {profile.city && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  City
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {profile.city}
                </Text>
              </>
            )}

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
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>
                        {neighborhood}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {profile.favoriteCafes && profile.favoriteCafes.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.secondaryText }]}>
                  Favorite Cafes
                </Text>
                <View style={styles.tagsContainer}>
                  {profile.favoriteCafes.map((cafe, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>
                        {cafe}
                      </Text>
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
      <View
        style={[
          styles.userCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {getTitle()}
          </Text>
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
            onPress={() => console.log("Upload photo")}
          >
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>

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
              {avatar ? "Change Photo" : "Add Photo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Personal Information
          </Text>

          {/* Name */}
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Name*
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: errors.name ? "red" : colors.border,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.secondaryText}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Age */}
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Age*
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: errors.birthday ? "red" : colors.border,
              },
            ]}
            value={age}
            onChangeText={setAge}
            placeholder="Your Age"
            placeholderTextColor={colors.secondaryText}
          />
          {errors.birthday && (
            <Text style={styles.errorText}>{errors.birthday}</Text>
          )}

          {/* Occupation */}
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Occupation*
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: errors.occupation ? "red" : colors.border,
              },
            ]}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Your Occupation"
            placeholderTextColor={colors.secondaryText}
          />
          {errors.occupation && (
            <Text style={styles.errorText}>{errors.occupation}</Text>
          )}

          {/* Interests */}
          <View style={styles.label}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>
              Interests
            </Text>
            <InterestSelector
              selected={interests || []}
              onChange={setInterests}
              maxInterests={10}
            />

            {/* About me */}
            <Text style={[styles.label, { color: colors.secondaryText }]}>
              About Me*
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: errors.bio ? "red" : colors.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself (max 500 characters)"
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={5}
              maxLength={500}
            />
            <Text
              style={[styles.characterCount, { color: colors.secondaryText }]}
            >
              {userData.bio ? userData.bio.length : 0}/500
            </Text>
            {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
          </View>
        </View>

        {/* Professional Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Professional Details
          </Text>

          {/* Experience Level */}
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Experience Level
          </Text>
          <ExperienceLevelSelector
            selected={experienceLevel || ""}
            onChange={setExperienceLevel}
          />

          {/* Experience */}

          {/* Education */}
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Education
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={education}
            onChangeText={setEducation}
            placeholder="Your education background"
            placeholderTextColor={colors.secondaryText}
          />

          {/* Industries */}
          <Text style={[styles.label, { color: colors.secondaryText }]}>
            Industries (select up to 3)
          </Text>
          <IndustrySelector
            selected={industryCategories || []}
            onChange={setIndustryCategories}
            maxSelections={3}
          />
        </View>

        {/* Location Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Location Preferences
          </Text>

          {/* Neighborhoods */}
          <View>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Neighborhoods</Text>
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
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Add a neighborhood"
                placeholderTextColor={isDark ? '#999' : '#777'}
                onSubmitEditing={(e) => {
                  handleAddNeighborhood(e.nativeEvent.text);
                  e.currentTarget.clear();
                }}
              />
            </View>
          </View>
           </View>


        {/* Cafes */}
         <View>
             <Text style={[styles.label, { color: colors.secondaryText }]}>Favorite Cafes</Text>
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
               style={[
                 styles.input,
                 {
                   backgroundColor: colors.background,
                   color: colors.text,
                   borderColor: colors.border,
                 },
               ]}
               placeholder="Coffee House, Bean There, etc. (comma separated)"
               placeholderTextColor={isDark ? '#999' : '#777'}
               onSubmitEditing={(e) => {
                 handleAddCafe(e.nativeEvent.text);
                 e.currentTarget.clear();
               }}
             />
           </View>
         </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Saving..." : "Save Profile"}
            onPress={saveProfile}
            disabled={loading}
            style={styles.saveButton}
          />
          {loading && (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          )}
          <View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </View>

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <View style={styles.errorSummary}>
            <Text style={styles.errorSummaryText}>
              Please fix the errors above to continue
            </Text>
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
    padding: 16,
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
    width: "100%",
    height: 240,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  textDark: {
    color: '#fff',
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
});