
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { signOut } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Toggle functions
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  // Return to profile
  const handleBackPress = () => {
    router.back();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // The router navigation is handled in AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} style={{ marginLeft: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [colors.text]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderColor: colors.border }]}
          >
            <View style={styles.settingContent}>
              <Ionicons name="person-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderColor: colors.border }]}
          >
            <View style={styles.settingContent}>
              <Ionicons name="key-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          
          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggle, 
                notifications ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }
              ]}
              onPress={handleNotificationsToggle}
            >
              <View 
                style={[
                  styles.toggleKnob, 
                  notifications ? { right: 2 } : { left: 2 },
                  { backgroundColor: 'white' }
                ]} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Ionicons name="moon-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggle, 
                darkMode ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }
              ]}
              onPress={handleDarkModeToggle}
            >
              <View 
                style={[
                  styles.toggleKnob, 
                  darkMode ? { right: 2 } : { left: 2 },
                  { backgroundColor: 'white' }
                ]} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderColor: colors.border }]}
          >
            <View style={styles.settingContent}>
              <Ionicons name="help-circle-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderColor: colors.border }]}
          >
            <View style={styles.settingContent}>
              <Ionicons name="document-text-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderColor: colors.border }]}
          >
            <View style={styles.settingContent}>
              <Ionicons name="shield-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'K2D-SemiBold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'K2D-Regular',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleKnob: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
    marginLeft: 8,
  },
});
