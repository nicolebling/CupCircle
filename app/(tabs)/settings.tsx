
import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const renderSettingItem = (
    icon: any, 
    title: string, 
    hasSwitch = false, 
    switchValue = false, 
    onSwitchChange?: (value: boolean) => void,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={hasSwitch || !onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={22} color={colors.primary} style={styles.settingIcon} />
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      </View>
      
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary + '50' }}
          thumbColor={switchValue ? colors.primary : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Notifications</Text>
          {renderSettingItem(
            'notifications-outline',
            'Enable Notifications',
            true,
            notificationsEnabled,
            (value) => setNotificationsEnabled(value)
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Subscription</Text>
          {renderSettingItem('diamond', 'Subscribe to Premium', false, false, undefined, () => console.log('Subscribe'))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Privacy & Security</Text>
          {renderSettingItem('lock-closed-outline', 'Change Password', false, false, undefined, () => console.log('Change password'))}
          {renderSettingItem('mail-outline', 'Change Email', false, false, undefined, () => console.log('Change email'))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Community</Text>
          {renderSettingItem('people-outline', 'Community Guidelines', false, false, undefined, () => console.log('Community Guidelines'))}
          {renderSettingItem('help-buoy-outline', 'Support Center', false, false, undefined, () => console.log('Support'))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Legal</Text>
          {renderSettingItem('document-text-outline', 'Privacy Policy', false, false, undefined, () => console.log('Privacy Policy'))}
          {renderSettingItem('document-outline', 'Terms of Service', false, false, undefined, () => console.log('Terms of Service'))}
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={handleSignOut}
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
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  rightPlaceholder: {
    width: 32,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  sectionTitle: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  logoutText: {
    marginLeft: 8,
    color: '#FF3B30',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
});
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigateBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Account</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Change Email</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Preferences</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <Ionicons name="moon-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Other</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderColor: colors.border }]}>
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <Ionicons name="shield-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: colors.background, borderColor: colors.error }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} style={styles.logoutIcon} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
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
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'K2D-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'K2D-SemiBold',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 36,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
});
