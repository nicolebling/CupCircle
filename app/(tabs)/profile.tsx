import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import Colors from "@/constants/Colors";
import ProfileForm from "@/components/ProfileForm";
import UserProfileCard from "@/components/UserProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments, useNavigation } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const loadingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Start a timer to show loading state if fetch takes longer than 200ms
      loadingTimeout.current = setTimeout(() => setLoading(true), 200);

      // Try to get cached profile first
      const cachedProfile = await AsyncStorage.getItem(`profile_${user.id}`);
      if (cachedProfile) {
        setProfileData(JSON.parse(cachedProfile));
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Cache the new profile data
      await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      // Clear the timeout and loading state
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      setLoading(false);
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
      navigation.setParams({ isEditMode: false }); //Added this line

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

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={handleEdit}
            style={{ marginRight: 15 }}
          >
            <Ionicons
              name={isEditMode ? "close" : "create-outline"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
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
        <UserProfileCard
          initialData={profileData}
          isEditMode={false}
          onEdit={handleEdit}
        />
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