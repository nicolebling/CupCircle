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
  const { logout } = useAuth();

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
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Enable notifications</Text>
            <TouchableOpacity 
              style={[
                styles.toggle, 
                notifications ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }
              ]}
              onPress={handleNotificationsToggle}
            >
              <View style={[
                styles.toggleCircle, 
                notifications ? { right: 2 } : { left: 2 },
                { backgroundColor: colors.background }
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="diamond-outline" size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription</Text>
          </View>

          <TouchableOpacity 
            style={[styles.menuItem, { borderColor: colors.border }]}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Subscribe to the Circle</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Privacy & Security Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Security</Text>
          </View>

          <TouchableOpacity 
            style={[styles.menuItem, { borderColor: colors.border }]}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderColor: colors.border }]}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Change Email</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Community Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Community</Text>
          </View>

          <TouchableOpacity 
            style={[styles.menuItem, { borderColor: colors.border }]}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Safety & Community Guidelines</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderColor: colors.border }]}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Support Center</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
          </View>

          <TouchableOpacity 
            style={[styles.menuItem, { borderColor: colors.border }]}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderColor: colors.border }]}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'K2D-Bold',
  },
  spacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
    marginLeft: 12,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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