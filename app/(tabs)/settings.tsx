
import React, { useState } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  Switch,
  TextInput
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [notifications, setNotifications] = useState(true);
  const [isPasswordDialogVisible, setIsPasswordDialogVisible] = useState(false);
  const [isEmailDialogVisible, setIsEmailDialogVisible] = useState(false);
  
  // Form values
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const handleBack = () => {
    router.back();
  };
  
  const handleNotificationToggle = (value) => {
    setNotifications(value);
    Alert.alert(
      value ? "Notifications enabled" : "Notifications disabled",
      value ? "You will now receive notifications" : "You will no longer receive notifications"
    );
  };
  
  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    // Implement actual password update logic here
    Alert.alert("Success", "Password updated successfully");
    setIsPasswordDialogVisible(false);
    setCurrentPassword('');
    setNewPassword('');
  };
  
  const handleEmailUpdate = () => {
    if (!newEmail) {
      Alert.alert("Error", "Please enter your new email");
      return;
    }
    
    // Implement actual email update logic here
    Alert.alert("Success", "Email updated successfully");
    setIsEmailDialogVisible(false);
    setNewEmail('');
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => signOut()
        }
      ]
    );
  };
  
  const SettingsCard = ({ title, icon, children }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Ionicons name={icon} size={22} color={colors.primary} style={styles.icon} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );
  
  const SettingsButton = ({ title, onPress, rightIcon = "chevron-forward" }) => (
    <TouchableOpacity 
      style={[styles.settingsButton, { borderColor: colors.border }]} 
      onPress={onPress}
    >
      <Text style={[styles.settingsButtonText, { color: colors.text }]}>{title}</Text>
      <Ionicons name={rightIcon} size={18} color={colors.secondaryText} />
    </TouchableOpacity>
  );
  
  // Dialog for Password Change
  const PasswordDialog = () => (
    isPasswordDialogVisible ? (
      <View style={[styles.dialog, { backgroundColor: colors.card }]}>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: colors.text }]}>Change Password</Text>
          <TouchableOpacity onPress={() => setIsPasswordDialogVisible(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.dialogDescription, { color: colors.secondaryText }]}>
          Enter your current password and a new password to update your credentials.
        </Text>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        
        <View style={styles.dialogFooter}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.border }]} 
            onPress={() => setIsPasswordDialogVisible(false)}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]} 
            onPress={handlePasswordUpdate}
          >
            <Text style={styles.submitButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : null
  );
  
  // Dialog for Email Change
  const EmailDialog = () => (
    isEmailDialogVisible ? (
      <View style={[styles.dialog, { backgroundColor: colors.card }]}>
        <View style={styles.dialogHeader}>
          <Text style={[styles.dialogTitle, { color: colors.text }]}>Change Email</Text>
          <TouchableOpacity onPress={() => setIsEmailDialogVisible(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.dialogDescription, { color: colors.secondaryText }]}>
          Enter your new email to update your credentials.
        </Text>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>New Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            keyboardType="email-address"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email"
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        
        <View style={styles.dialogFooter}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.border }]} 
            onPress={() => setIsEmailDialogVisible(false)}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]} 
            onPress={handleEmailUpdate}
          >
            <Text style={styles.submitButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : null
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <SettingsCard title="Notifications" icon="notifications-outline">
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, { color: colors.text }]}>Enable notifications</Text>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#767577', true: colors.primary + '50' }}
              thumbColor={notifications ? colors.primary : '#f4f3f4'}
            />
          </View>
        </SettingsCard>
        
        <SettingsCard title="Subscribe" icon="diamond-outline">
          <SettingsButton 
            title="Subscribe to the Circle" 
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          />
        </SettingsCard>
        
        <SettingsCard title="Privacy & Security" icon="shield-outline">
          <SettingsButton 
            title="Change Password" 
            onPress={() => setIsPasswordDialogVisible(true)}
          />
          <SettingsButton 
            title="Change Email" 
            onPress={() => setIsEmailDialogVisible(true)}
          />
        </SettingsCard>
        
        <SettingsCard title="Community" icon="people-outline">
          <SettingsButton 
            title="Safety & Community Guidelines" 
            onPress={() => Alert.alert("Guidelines", "Our community guidelines ensure a respectful and productive environment for all users.")}
          />
          <SettingsButton 
            title="Support Center" 
            onPress={() => Alert.alert("Support", "Need help? Contact our support team via email or in-app chat.")}
          />
        </SettingsCard>
        
        <SettingsCard title="Legal" icon="document-text-outline">
          <SettingsButton 
            title="Privacy Policy" 
            onPress={() => Alert.alert("Privacy Policy", "Our privacy policy details how we collect, use, and protect your personal information.")}
          />
          <SettingsButton 
            title="Terms of Service" 
            onPress={() => Alert.alert("Terms of Service", "By using our app, you agree to abide by our terms of service.")}
          />
        </SettingsCard>
        
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.border }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={"#FF3B30"} />
          <Text style={[styles.logoutText, { color: "#FF3B30" }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Dialogs */}
      <PasswordDialog />
      <EmailDialog />
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'K2D-SemiBold',
  },
  placeholderButton: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
  },
  cardContent: {
    padding: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsButtonText: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginLeft: 8,
  },
  dialog: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontFamily: 'K2D-SemiBold',
  },
  dialogDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'K2D-Medium',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'K2D-Regular',
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
});
