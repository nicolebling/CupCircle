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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
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
      ),
    });
  }, [isEditMode, colors.text]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.settingsButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => signOut()}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
        </View>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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