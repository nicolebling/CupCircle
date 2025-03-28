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

const { width } = Dimensions.get('window');
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../provider/AuthProvider";
import * as FileSystem from "expo-file-system";
import { FileObject } from "@supabase/storage-js";

import { supabase } from "@/lib/supabase";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import IndustrySelector from "@/components/IndustrySelector";
import InterestSelector from "@/components/InterestSelector";
import ExperienceLevelSelector from "@/components/ExperienceLevelSelector";
import NeighborhoodSelector from "@/components/NeighborhoodSelector";
import CafeSelector from "@/components/CafeSelector";
import ImageItem from "@/components/ImageItem";
import { decode } from "base64-arraybuffer";

type ProfileFormProps = {
  userId: string;
  isNewUser?: boolean;
  onSave?: (profileData: any) => void;
  initialData?: any;
  onCancel?: () => void;
};

import EmploymentHistoryEntry from './EmploymentHistoryEntry';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempDate, setTempDate] = useState(
    birthday ? new Date(birthday) : new Date(),
  );
  const [employmentHistory, setEmploymentHistory] = useState([]);

  useEffect(() => {
    if (!isNewUser) {
      fetchProfile();
    }
  }, [userId, isNewUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log("Fetching profile for user ID:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      console.log(userId);
      console.log("Profile fetched:", data);

      if (data) {
        setName(data.name || "");
        setOccupation(data.occupation || "");
        setBio(data.bio || "");
        setAge(data.age);
        setBirthday(data.birthday ? data.birthday.toString() : ""); //Added birthday fetch
        setExperienceLevel(data.experience_level || "");
        setEducation(data.education || "");
        setCity(data.city || "");
        setIndustryCategories(data.industry_categories || []);
        setSkills(data.skills || []);
        setNeighborhoods(data.neighborhoods || []);
        setFavoriteCafes(data.favorite_cafes || []);
        setInterests(data.interests || []);
        setAvatar(data.photo_url || "");

        console.log("Profile data loaded into form state");
      }
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

  const handleAddCafe = (cafe: string) => {
    if (cafe.trim() && !favoriteCafes.includes(cafe.trim())) {
      setFavoriteCafes([...favoriteCafes, cafe.trim()]);
    }
  };

  const handleRemoveCafe = (index: number) => {
    setFavoriteCafes(favoriteCafes.filter((_, i) => i !== index));
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

  const handleConfirm = () => {
    const formattedDate = tempDate.toISOString().split("T")[0];
    setBirthday(formattedDate); // Update birthday
    const calculatedAge = calculateAge(formattedDate);
    setAge(calculatedAge); // Update age based on new birthday
    setShowDatePicker(false); // Close the date picker after confirmation
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

    console.log(result);
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      console.log("Starting upload for:", uri);

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

    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

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
        //employmentHistory, 
        updated_at: new Date(),
      };

      console.log(
        "Profile data being sent:",
        JSON.stringify(profileData, null, 2),
      );

      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select();

      if (error) {
        console.error("Supabase error response:", error);
        console.error("Error details:", JSON.stringify(error));
        Alert.alert(
          "Profile Save Error",
          error?.message || "Failed to save profile. Please try again.",
        );
        throw error;
      }

      console.log("Profile saved successfully:", data);
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
          //employmentHistory,
        });
      }
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

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setBirthday(selectedDate); // store as Date object
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setAge(calculateAge(formattedDate));
    }
    setShowDatePicker(false);
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

          <TouchableOpacity onPress={pickImage}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, { backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="person" size={60} color="#ffffff" />
              </View>
            )}
            <View style={styles.changePhotoButton}>
              <Text style={[styles.avatarText, isDark && styles.textDark]}>
                {avatar ? "Change Photo" : "Add Photo"}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              Basic Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Name*
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
                Birthday*
              </Text>

              <View style={styles.inputGroup}>
                <TouchableOpacity
                  style={[styles.input, isDark && styles.inputDark]}
                  onPress={() => setShowDatePicker(true)} // Show DateTimePicker when tapped
                >
                  <Text style={{ paddingVertical: 10 }}>
                    {birthday
                      ? new Date(birthday).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Select your birthday"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                    <TouchableOpacity onPress={handleConfirm}>
                      <Text>Confirm Birthday</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {age !== null && (
                <Text style={[styles.ageText, isDark && styles.textDark]}>
                  Age: {age}
                </Text>
              )}
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
              <Text style={[styles.label, isDark && styles.textDark]}>Education</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={education}
                onChangeText={setEducation}
                placeholder="Your educational background"
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

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              Professional Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Occupation
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="Your job title"
                placeholderTextColor={isDark ? "#999" : "#777"}
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
                Industry Categories
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


            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.label, isDark && styles.textDark]}>Employment (Optional)</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (employmentHistory.length >= 3) {
                      Alert.alert(
                        "Maximum Entries Reached",
                        "You can only add up to 3 employment history entries."
                      );
                      return;
                    }
                    setEmploymentHistory([
                      {
                        company: '',
                        position: '',
                        fromDate: '',
                        toDate: '',
                      },
                      ...employmentHistory,
                    ]);
                  }}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {employmentHistory.map((employment, index) => (
                <EmploymentHistoryEntry
                  key={index}
                  employment={employment}
                  onChange={(updated) => {
                    const newHistory = [...employmentHistory];
                    newHistory[index] = updated;
                    setEmploymentHistory(newHistory);
                  }}
                  onDelete={() => {
                    const newHistory = employmentHistory.filter((_, i) => i !== index);
                    setEmploymentHistory(newHistory);
                  }}
                  isDark={isDark}
                />
              ))}
              
            </View>

            
          </View>

          

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              Personal Information
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Favorite Neighborhoods
              </Text>
              <NeighborhoodSelector
                selected={neighborhoods}
                onChange={setNeighborhoods}
                isDark={isDark}
              />
            </View>
            

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Favorite Cafes
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
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 5, // Added marginBottom for better spacing
  },
  inputDark: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#fff",
    marginBottom: 5, // Added marginBottom for better spacing
  },
  textArea: {
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
  image: {
    width: width - 32,
    height: width - 32,
    resizeMode: "cover",
    borderRadius: 16,
    overflow: "hidden",
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
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
    backgroundColor: "#0097FB",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 10, // Adds space between inputs
    marginBottom: 5,
  },
  halfWidth: {
    flex: 1, // Makes each input take up half the row
  },
  deleteButton: {
    marginTop: 5,
    alignSelf: "flex-end", // Aligns delete button to the right
  },
});