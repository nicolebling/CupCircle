import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
  Button,
  Image,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "@/lib/supabase";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import IndustrySelector from "@/components/IndustrySelector";
import InterestSelector from "@/components/InterestSelector";
import ExperienceLevelSelector from "@/components/ExperienceLevelSelector";
import NeighborhoodSelector from "@/components/NeighborhoodSelector";
import CafeSelector from "@/components/CafeSelector";
import { decode } from "base64-arraybuffer";
import { geoUtils } from "@/utils/geoUtils";

type ProfileFormProps = {
  userId: string;
  isNewUser?: boolean;
  onSave?: (profileData: any) => void;
  initialData?: any;
  onCancel?: () => void;
};

import EmploymentHistoryEntry from "./EmploymentHistoryEntry";
import CareerTransitionEntry from "./CareerTransitionEntry";

export default function ProfileForm({
  userId,
  isNewUser = true,
  onSave,
  initialData,
  onCancel,
}: ProfileFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [birthday, setBirthday] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [education, setEducation] = useState("");
  const [city, setCity] = useState("");
  const [industryCategories, setIndustryCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [favoriteCafes, setFavoriteCafes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [centroidLat, setCentroidLat] = useState<number | null>(null);
  const [centroidLng, setCentroidLng] = useState<number | null>(null);
  const [employmentHistory, setEmploymentHistory] = useState<
    Array<{
      company: string;
      position: string;
      fromDate: string;
      toDate: string;
    }>
  >([]);

  const [careerTransitions, setCareerTransitions] = useState<
    Array<{
      position1: string;
      position2: string;
    }>
  >([]);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isNewUser) {
      fetchProfile();
    }
  }, [userId, isNewUser]);

  // Calculate centroid whenever cafes change
  useEffect(() => {
    const calculateCentroid = async () => {
      if (favoriteCafes && favoriteCafes.length > 0) {
        console.log("Recalculating centroid for cafes:", favoriteCafes);
        try {
          const centroid = await geoUtils.getCafesCentroid(favoriteCafes);
          if (centroid) {
            setCentroidLat(centroid.latitude);
            setCentroidLng(centroid.longitude);
            console.log("Updated centroid:", { 
              latitude: centroid.latitude, 
              longitude: centroid.longitude 
            });
          } else {
            setCentroidLat(null);
            setCentroidLng(null);
            console.log("Could not calculate centroid - cleared values");
          }
        } catch (error) {
          console.error("Error calculating centroid:", error);
          setCentroidLat(null);
          setCentroidLng(null);
        }
      } else {
        // No cafes selected, clear centroid
        setCentroidLat(null);
        setCentroidLng(null);
        console.log("No cafes selected - cleared centroid");
      }
    };

    calculateCentroid();
  }, [favoriteCafes]); // Recalculate whenever favoriteCafes changes

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setName(data.name || "");
        setOccupation(data.occupation || "");
        setBio(data.bio || "");
        setAge(data.age);
        setBirthday(data.birthday ? data.birthday.toString() : null); //Added birthday fetch
        setExperienceLevel(data.experience_level || "");
        setEducation(data.education || "");
        setCity(data.city || "");
        setIndustryCategories(data.industry_categories || []);
        setSkills(data.skills || []);
        setNeighborhoods(data.neighborhoods || []);
        setFavoriteCafes(data.favorite_cafes || []);
        setInterests(data.interests || []);
        setAvatar(data.photo_url || "");
        setCentroidLat(data.centroid_lat || null);
        setCentroidLng(data.centroid_long || null);

        // Handle employment data
        let employmentData = [];
        if (data.employment) {
          try {
            // Parse the employment data array
            if (Array.isArray(data.employment)) {
              employmentData = data.employment.map((entry) =>
                typeof entry === "string" ? JSON.parse(entry) : entry,
              );
            } else {
              employmentData = [JSON.parse(data.employment)];
            }
          } catch (e) {
            console.error("Error parsing employment data:", e);
          }
        }
        setEmploymentHistory(employmentData);

        // Handle career transitions data
        let transitionsData = [];
        if (data.career_transitions) {
          try {
            transitionsData = Array.isArray(data.career_transitions)
              ? data.career_transitions.map((transition) =>
                  typeof transition === "string"
                    ? JSON.parse(transition)
                    : transition,
                )
              : [JSON.parse(data.career_transitions)];
          } catch (e) {
            console.error("Error parsing career transitions data:", e);
          }
        }
        setCareerTransitions(transitionsData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load profile information");
    } finally {
      setLoading(false);
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
    // Ensure permission is granted
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, //Add this line
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);

      // Ensure permission is granted
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      // Get the base64 data directly from the image picker
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result?.toString().split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const filePath = `${userId}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, decode(base64Data as string), {
          contentType: "image/png",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("photos").getPublicUrl(filePath);

      setAvatar(data.publicUrl);
    } catch (error) {
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

    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      // Use the pre-calculated centroid values
      console.log("Saving profile with centroid:", { 
        centroidLat, 
        centroidLng,
        cafesCount: favoriteCafes?.length || 0 
      });

      const profileData = {
        id: userId,
        name,
        occupation,
        photo_url: avatar,
        bio,
        birthday,
        age: birthday ? calculateAge(birthday) : null,
        experience_level: experienceLevel,
        education,
        city,
        industry_categories: industryCategories,
        skills: skills,
        neighborhoods: neighborhoods,
        favorite_cafes: favoriteCafes,
        interests: interests,
        employment: employmentHistory,
        career_transitions: careerTransitions,
        updated_at: new Date(),
        centroid_lat: centroidLat,
        centroid_long: centroidLng,
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select();

      if (error) {
        Alert.alert(
          "Profile Save Error",
          error?.message || "Failed to save profile. Please try again.",
        );
        throw error;
      }

      Alert.alert("Success", "Your profile has been saved");
      if (onSave) {
        onSave({
          id: userId,
          name,
          occupation,
          photo_url: avatar,
          bio,
          birthday,
          experience_level: experienceLevel,
          education,
          city,
          industry_categories: industryCategories,
          skills,
          neighborhoods,
          favorite_cafes: favoriteCafes,
          interests,
          employment: employmentHistory,
        });
      }
    } catch (error: any) {
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

  const calculateAge = (birthday: string) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const addEmploymentEntry = () => {
    if (employmentHistory.length >= 3) {
      Alert.alert(
        "Maximum Entries Reached",
        "You can only add up to 3 employment history entries.",
      );
      return;
    }

    const emptyEntry = { company: "", position: "", fromDate: "", toDate: "" };
    setEmploymentHistory((prev) => [...prev, emptyEntry]);
    setIsEditing(true); // Now setting edit mode to true to allow user to enter info
  };

  const updateEmploymentEntry = (index, updatedEntry) => {
    setEmploymentHistory((prevHistory) => {
      const newHistory = prevHistory.map((entry, i) =>
        i === index ? { ...updatedEntry } : entry,
      );

      // Sort entries by date (most recent first)
      return newHistory.sort((a, b) => {
        const dateA =
          a.toDate === "Present"
            ? new Date()
            : new Date(a.toDate.split("/")[1], a.toDate.split("/")[0]);
        const dateB =
          b.toDate === "Present"
            ? new Date()
            : new Date(b.toDate.split("/")[1], b.toDate.split("/")[0]);
        return dateB.getTime() - dateA.getTime();
      });
    });
  };

  const deleteEmploymentEntry = (index) => {
    setEmploymentHistory((prevHistory) =>
      prevHistory.filter((_, i) => i !== index),
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle"
                size={24}
                color="#c62828"
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.image}
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
              <View style={styles.editButton}>
                <Ionicons name="camera" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { marginTop: 24 }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Name
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Headline
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="Headline (Max 25 characters)"
                placeholderTextColor={isDark ? "#999" : "#777"}
                maxLength={25}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Experience Level
              </Text>
              <ExperienceLevelSelector
                selected={experienceLevel}
                onChange={setExperienceLevel}
                isDark={isDark}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                City
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={city}
                onChangeText={setCity}
                placeholder="Your city"
                placeholderTextColor={isDark ? "#999" : "#777"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Bio</Text>
              <TextInput
                style={[styles.textArea, isDark && styles.inputDark]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={isDark ? "#999" : "#777"}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.label, isDark && styles.textDark]}>
                  Employment (Optional)
                </Text>
                <TouchableOpacity onPress={addEmploymentEntry}>
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              {employmentHistory.map((employment, index) => (
                <EmploymentHistoryEntry
                  key={index}
                  employment={employment}
                  onChange={(updated) => updateEmploymentEntry(index, updated)}
                  onDelete={() => deleteEmploymentEntry(index)}
                  isDark={isDark}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              ))}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.label, isDark && styles.textDark]}>
                  Career Transitions (Optional)
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (careerTransitions.length >= 3) {
                      Alert.alert(
                        "Maximum Entries Reached",
                        "You can only add up to 3 career transition entries.",
                      );
                      return;
                    }
                    setCareerTransitions((prev) => [
                      ...prev,
                      { position1: "", position2: "" },
                    ]);
                  }}
                >
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              {careerTransitions.map((transition, index) => (
                <CareerTransitionEntry
                  key={index}
                  transition={transition}
                  onChange={(updated) => {
                    const newTransitions = [...careerTransitions];
                    newTransitions[index] = updated;
                    setCareerTransitions(newTransitions);
                  }}
                  onDelete={() => {
                    setCareerTransitions((prev) =>
                      prev.filter((_, i) => i !== index),
                    );
                  }}
                  isDark={isDark}
                />
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Education
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={education}
                onChangeText={setEducation}
                placeholder="Your educational background"
                placeholderTextColor={isDark ? "#999" : "#777"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Industry
              </Text>
              <IndustrySelector
                selected={industryCategories}
                onChange={setIndustryCategories}
                isDark={isDark}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Interests
              </Text>
              <InterestSelector
                selected={interests}
                onChange={setInterests}
                isDark={isDark}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            {/* <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Favorite Neighborhoods
              </Text>
              <NeighborhoodSelector
                selected={neighborhoods}
                onChange={setNeighborhoods}
                isDark={isDark}
              />
            </View> */}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Cafe Preferences
              </Text>
              <CafeSelector
                selected={favoriteCafes}
                onChange={setFavoriteCafes}
                isDark={isDark}
              />
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
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  titleDark: {
    color: "#fff",
  },
  textDark: {
    color: "#fff",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#c62828",
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: "#c62828",
    flex: 1,
    fontSize: 14,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
    fontFamily: "K2D-Regular",
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontFamily: "K2D-Regular",
  },
  inputDark: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#fff",
    marginBottom: 5,
  },
  textArea: {
    fontFamily: "K2D-Regular",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    height: 120,
    textAlignVertical: "top",
  },
  photoContainer: {
    alignItems: "center",
    width: "100%",
  },
  imageWrapper: {
    position: "relative",
    width: (width - 32) * 0.6,
    height: (width - 32) * 0.6,
    alignSelf: "center",
  },
  image: {
    width: (width - 32) * 0.6,
    height: (width - 32) * 0.6,
    resizeMode: "cover",
    borderRadius: ((width - 32) * 0.6) / 2,
    overflow: "hidden",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 24,
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: {
    marginTop: 10,
    color: "#0097FB",
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  tagText: {
    color: "#fff",
    marginRight: 5,
  },
  tagInput: {
    flexDirection: "row",
  },
  button: {
    backgroundColor: "#F97415",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "K2D-Bold",
  },
  ageText: {
    marginTop: 5,
    fontSize: 14,
    color: "#555",
  },
  addButton: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  employmentEntry: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  employmentEntryDark: {
    borderColor: "#555",
  },
  employmentInputGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 5,
  },
  halfWidth: {
    flex: 1,
  },
  deleteButton: {
    marginTop: 5,
    alignSelf: "flex-end",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginBottom: 32,
  },
});