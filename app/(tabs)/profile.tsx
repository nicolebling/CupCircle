
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import InterestSelector from "@/components/InterestSelector";
import IndustrySelector from "@/components/IndustrySelector";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  occupation: z.string().optional(),
  bio: z.string().optional(),
  age: z.number().min(18).optional().nullable(),
  photo: z.string().optional(),
  interests: z.array(z.string()).optional(),
  industry_categories: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  neighborhoods: z.array(z.string()).optional(),
  favorite_cafes: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colors = Colors.light;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      occupation: user?.occupation || "",
      bio: user?.bio || "",
      age: user?.age || null,
      photo: user?.photo || "https://randomuser.me/api/portraits/lego/1.jpg",
      interests: user?.interests || [],
      industry_categories: user?.industry_categories || [],
      skills: user?.skills || [],
      neighborhoods: user?.neighborhoods || [],
      favorite_cafes: user?.favorite_cafes || [],
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        occupation: user.occupation || "",
        bio: user.bio || "",
        age: user.age || null,
        photo: user.photo || "https://randomuser.me/api/portraits/lego/1.jpg",
        interests: user.interests || [],
        industry_categories: user.industry_categories || [],
        skills: user.skills || [],
        neighborhoods: user.neighborhoods || [],
        favorite_cafes: user.favorite_cafes || [],
      });
    }
  }, [user, reset]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const onSaveProfile = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      await updateUser(data);
      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setValue("photo", result.assets[0].uri);
    }
  };

  if (authLoading || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Profile</Text>
          <TouchableOpacity onPress={toggleEditMode}>
            <Ionicons
              name={isEditMode ? "close-outline" : "create-outline"}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {isEditMode ? (
          // Edit mode
          <View style={styles.profileForm}>
            {/* Profile Image */}
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Image
                source={{ uri: user.photo || "https://randomuser.me/api/portraits/lego/1.jpg" }}
                style={styles.profilePhoto}
              />
              <View style={styles.editPhotoOverlay}>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.editPhotoText}>Change Photo</Text>
              </View>
            </TouchableOpacity>

            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text },
                    ]}
                    placeholder="Your name"
                    placeholderTextColor={colors.secondaryText}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Occupation */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Occupation</Text>
              <Controller
                control={control}
                name="occupation"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text },
                    ]}
                    placeholder="Your occupation"
                    placeholderTextColor={colors.secondaryText}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            {/* Age */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Age</Text>
              <Controller
                control={control}
                name="age"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text },
                    ]}
                    placeholder="Your age"
                    placeholderTextColor={colors.secondaryText}
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => {
                      const parsed = parseInt(text);
                      onChange(isNaN(parsed) ? null : parsed);
                    }}
                    keyboardType="number-pad"
                  />
                )}
              />
            </View>

            {/* Bio */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.textarea,
                      { backgroundColor: colors.card, color: colors.text },
                    ]}
                    placeholder="Tell others about yourself"
                    placeholderTextColor={colors.secondaryText}
                    multiline
                    numberOfLines={4}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            {/* Industry Categories */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Industries</Text>
              <Controller
                control={control}
                name="industry_categories"
                render={({ field: { onChange, value } }) => (
                  <IndustrySelector
                    selectedIndustries={value || []}
                    onIndustriesChange={onChange}
                  />
                )}
              />
            </View>

            {/* Interests */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Interests</Text>
              <Controller
                control={control}
                name="interests"
                render={({ field: { onChange, value } }) => (
                  <InterestSelector
                    selectedInterests={value || []}
                    onInterestsChange={onChange}
                    maxInterests={10}
                  />
                )}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit(onSaveProfile)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditMode(false)}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View mode
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: user.photo || "https://randomuser.me/api/portraits/lego/1.jpg" }}
              style={styles.profilePhoto}
            />
            <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
            {user.age && (
              <Text style={[styles.infoText, { color: colors.secondaryText }]}>
                Age: {user.age}
              </Text>
            )}
            {user.occupation && (
              <View style={styles.occupationContainer}>
                <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                <Text style={[styles.occupation, { color: colors.text }]}>
                  {user.occupation}
                </Text>
              </View>
            )}
            {user.bio && (
              <View style={styles.bioContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  About
                </Text>
                <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>
              </View>
            )}

            {user.industry_categories && user.industry_categories.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Industries
                </Text>
                <View style={styles.tagsContainer}>
                  {user.industry_categories.map((industry, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.primary + "20" },
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
              </View>
            )}

            {user.interests && user.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Interests
                </Text>
                <View style={styles.tagsContainer}>
                  {user.interests.map((interest, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.primary + "20" },
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
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileContainer: {
    alignItems: "center",
  },
  profileForm: {
    width: "100%",
  },
  photoContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editPhotoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
  },
  editPhotoText: {
    color: "white",
    marginTop: 5,
    fontSize: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  infoText: {
    fontSize: 16,
    marginTop: 5,
  },
  occupationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  occupation: {
    fontSize: 16,
    marginLeft: 5,
  },
  bioContainer: {
    marginTop: 20,
    width: "100%",
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginTop: 20,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textarea: {
    minHeight: 100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
});
