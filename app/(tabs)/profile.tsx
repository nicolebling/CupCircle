import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/constants/Colors";
import ProfileForm from "@/components/ProfileForm";
import UserProfileCard from "@/components/UserProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments, useNavigation } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from "react-native-reanimated";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfileData(data);
      
      // Trigger smooth fade-in animation
      opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Still show animation even on error
      opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    } finally {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoading(false), 200);
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
      navigation.setParams({ isEditMode: false });

      // Reset and trigger animation for updated profile
      opacity.value = 0;
      translateY.value = 20;
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withTiming(0, { duration: 400 });

    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile changes");
    }
  };

  const handleEdit = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    navigation.setParams({ isEditMode: newEditMode });
  };


  if (!user) {
    return null;
  }

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={handleEdit}
            style={{ marginRight: isEditMode ? 23 : 15 }}
          >
            <Ionicons
              name={isEditMode ? "close" : "create-outline"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          {!isEditMode && (
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              style={{ marginRight: 23 }}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [isEditMode, colors.text]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isEditMode ? (
        <ProfileForm
          userId={user.id}
          isNewUser={false}
          initialData={profileData}
          onSave={handleProfileSave}
          onCancel={() => setIsEditMode(false)}
        />
      ) : (
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <UserProfileCard
            initialData={profileData}
            isEditMode={false}
            onEdit={handleEdit}
            isLoading={isLoading}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});