import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Import useRouter
import { AuthContext } from '../context/AuthContext';

const SettingsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const router = useRouter(); // Initialize useRouter
  const { signOut } = useContext(AuthContext);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: colors.text }}>Settings</Text>
      <TouchableOpacity onPress={signOut} style={{ backgroundColor: colors.primary, padding: 10, borderRadius: 5 }}>
        <Text style={{ color: 'white' }}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: colors.primary, padding: 10, borderRadius: 5 }}>
        <Text style={{ color: 'white' }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;