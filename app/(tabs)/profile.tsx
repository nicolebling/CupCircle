import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Alert,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";
import UserProfileCard, { UserProfileData } from "@/components/UserProfileCard";
import { useProfileManager, ProfileFormData } from "@/hooks/useProfileManager";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import * as ImagePicker from 'expo-image-picker';


// Profile schema
const insertProfileSchema = z.object({
  name: z.string().nonempty("Name is required"),
  birthday: z.string().nonempty("Birthday is required"),
  occupation: z.string().nonempty("Occupation is required"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters"),
  education: z.string().nonempty("Education is required"),
  photo: z.string().nonempty("Profile photo is required"),
});

export default function ProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profile, isLoading } = useQuery(["profile"], async () => {
    const res = await fetch("/api/profile");
    return res.json();
  });

  // Form setup
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      name: "",
      birthday: "",
      occupation: "",
      bio: "",
      education: "",
      photo: "",
    },
  });

  useEffect(() => {
    if (profile) {
      setValue("name", profile.name);
      setValue("birthday", profile.birthday);
      setValue("occupation", profile.occupation);
      setValue("bio", profile.bio);
      setValue("education", profile.education);
      setValue("photo", profile.photo);
    }
  }, [profile]);

  // Mutation to update profile
  const updateProfile = useMutation(
    async (data) => {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Profile update failed");
      return res.json();
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["profile"], data);
        setIsEditing(false);
      },
    },
  );

  // Image Picker for Profile Picture
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setValue("photo", result.uri);
    }
  };

  // Submit Handler
  const onSubmit = async (data) => {
    await updateProfile.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E76F51" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo Animation */}
      {/* <RotatingCircles /> */} {/* This component is missing */}

      <Text style={styles.title}>CupCircle</Text>
      <Text style={styles.subtitle}>Where every cup connects</Text>

      {isEditing ? (
        <View style={styles.card}>
          {/* Profile Image Upload */}
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {profile?.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.image} />
            ) : (
              <Text style={styles.uploadText}>Upload Photo</Text>
            )}
          </TouchableOpacity>

          {/* Input Fields */}
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name.message}</Text>
          )}

          <Controller
            control={control}
            name="birthday"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                placeholder="Birthday (YYYY-MM-DD)"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.birthday && (
            <Text style={styles.errorText}>{errors.birthday.message}</Text>
          )}

          <Controller
            control={control}
            name="occupation"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                placeholder="Occupation"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.occupation && (
            <Text style={styles.errorText}>{errors.occupation.message}</Text>
          )}

          <Controller
            control={control}
            name="bio"
            render={({ field }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                value={field.value}
                onChangeText={field.onChange}
                multiline
              />
            )}
          />
          {errors.bio && (
            <Text style={styles.errorText}>{errors.bio.message}</Text>
          )}

          <Controller
            control={control}
            name="education"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                placeholder="Education"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.education && (
            <Text style={styles.errorText}>{errors.education.message}</Text>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.buttonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Image source={{ uri: profile?.photo }} style={styles.image} />
          <Text style={styles.profileText}>{profile?.name}</Text>
          <Text style={styles.profileText}>{profile?.occupation}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 20, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E76F51",
    marginBottom: 5,
  },
  subtitle: { fontSize: 16, color: "#757575", marginBottom: 20 },
  card: {
    width: "100%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  textArea: { height: 80 },
  button: {
    backgroundColor: "#E76F51",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center" },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: 100, height: 100, borderRadius: 50 },
  profileText: { fontSize: 18, fontWeight: "bold", marginVertical: 5 },
  errorText: { color: "red", fontSize: 12 },
  uploadText: {
    textAlign: 'center',
  }
});