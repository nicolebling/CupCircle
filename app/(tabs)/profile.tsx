import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert, View, TouchableOpacity } from 'react-native';
import { supabase } from "@/lib/supabase";
import Colors from '@/constants/Colors';
import ProfileForm from '@/components/ProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => setIsEditMode(!isEditMode)}
          >
            <Ionicons name={isEditMode ? "close" : "create-outline"} size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ProfileForm 
        userId={user.id} 
        isNewUser={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});