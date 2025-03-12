
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

// Profile validation schema without zod for now
const insertProfileSchema = {
  name: {
    required: "Name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" }
  },
  birthday: {
    required: "Birthday is required",
  },
  occupation: {
    required: "Occupation is required",
  },
  bio: {
    maxLength: { value: 500, message: "Bio cannot exceed 500 characters" }
  }
};

export default function Profile() {
  const { userId, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthday: "",
    occupation: "",
    bio: "",
    photo: "https://via.placeholder.com/150",
    interests: [],
    industry_categories: [],
    neighborhoods: [],
    favorite_cafes: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes using mock data
      // In production, this would fetch from your API
      setTimeout(() => {
        // Mock profile data for demo purposes
        const mockProfile = {
          id: "profile-123",
          user_id: userId,
          name: "Jane Doe",
          birthday: "1990-01-01",
          occupation: "Software Engineer",
          bio: "Passionate about technology and coffee",
          photo: "https://via.placeholder.com/150",
          interests: ["Tech", "Coffee", "Travel"],
          industry_categories: ["Technology", "Education"],
          neighborhoods: ["Downtown", "Midtown"],
          favorite_cafes: ["Starbucks", "Blue Bottle"]
        };
        
        setProfile(mockProfile);
        setFormData(mockProfile);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error fetching profile:", error);
      setIsLoading(false);
    }
  };

  const validateField = (name, value) => {
    const fieldSchema = insertProfileSchema[name];
    if (!fieldSchema) return true;

    if (fieldSchema.required && (!value || value.trim() === "")) {
      return fieldSchema.required;
    }

    if (fieldSchema.minLength && value.length < fieldSchema.minLength.value) {
      return fieldSchema.minLength.message;
    }

    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength.value) {
      return fieldSchema.maxLength.message;
    }

    return true;
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const validation = validateField(name, value);
    if (validation !== true) {
      setErrors(prev => ({ ...prev, [name]: validation }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors = {};
    Object.keys(insertProfileSchema).forEach(field => {
      const validation = validateField(field, formData[field]);
      if (validation !== true) {
        newErrors[field] = validation;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      
      // For demo purposes
      // In production, this would call your API to save the profile
      setTimeout(() => {
        setProfile(formData);
        setIsEditing(false);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        handleFieldChange("photo", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting image:", error);
    }
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.tintColor} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={isEditing ? handlePhotoSelect : undefined}
          >
            <Image
              source={{ uri: formData.photo }}
              style={styles.profilePhoto}
            />
            {isEditing && (
              <View style={styles.editPhotoOverlay}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            )}
          </TouchableOpacity>
          
          {!isEditing ? (
            <>
              <Text style={styles.name}>{profile?.name}</Text>
              <Text style={styles.occupation}>{profile?.occupation}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={16} color="white" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => handleFieldChange("name", text)}
                placeholder="Your name"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
          )}
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Birthday</Text>
              <TextInput
                style={[styles.input, errors.birthday && styles.inputError]}
                value={formData.birthday}
                onChangeText={(text) => handleFieldChange("birthday", text)}
                placeholder="YYYY-MM-DD"
              />
              {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Occupation</Text>
              <TextInput
                style={[styles.input, errors.occupation && styles.inputError]}
                value={formData.occupation}
                onChangeText={(text) => handleFieldChange("occupation", text)}
                placeholder="Your occupation"
              />
              {errors.occupation && <Text style={styles.errorText}>{errors.occupation}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.textArea, errors.bio && styles.inputError]}
                value={formData.bio}
                onChangeText={(text) => handleFieldChange("bio", text)}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
              />
              {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
              <Text style={styles.charCount}>{formData.bio?.length || 0}/500</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Interests</Text>
              <InterestSelector
                selectedInterests={formData.interests || []}
                onSelectInterest={(interests) => 
                  setFormData(prev => ({ ...prev, interests }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Industry Categories</Text>
              <IndustrySelector
                selectedIndustries={formData.industry_categories || []}
                onSelectIndustry={(industry_categories) => 
                  setFormData(prev => ({ ...prev, industry_categories }))
                }
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setFormData(profile);
                  setErrors({});
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSubmit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileDetails}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <Text style={styles.bioText}>{profile?.bio || "No bio added yet."}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.tagContainer}>
                {profile?.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{interest}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No interests added yet.</Text>
                )}
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Industries</Text>
              <View style={styles.tagContainer}>
                {profile?.industry_categories && profile.industry_categories.length > 0 ? (
                  profile.industry_categories.map((industry, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{industry}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No industries added yet.</Text>
                )}
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Favorite Neighborhoods</Text>
              <View style={styles.tagContainer}>
                {profile?.neighborhoods && profile.neighborhoods.length > 0 ? (
                  profile.neighborhoods.map((neighborhood, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{neighborhood}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No neighborhoods added yet.</Text>
                )}
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Favorite Cafes</Text>
              <View style={styles.tagContainer}>
                {profile?.favorite_cafes && profile.favorite_cafes.length > 0 ? (
                  profile.favorite_cafes.map((cafe, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{cafe}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No favorite cafes added yet.</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  photoContainer: {
    marginBottom: 15,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editPhotoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.tintColor,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  occupation: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: Colors.tintColor,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  editButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "600",
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.tintColor,
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  profileDetails: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
  },
});
