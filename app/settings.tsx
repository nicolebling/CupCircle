import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  Switch
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigation } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { openBrowserAsync } from "expo-web-browser";
import Superwall, { LogLevel } from "expo-superwall/compat";
import { supabase } from "@/lib/supabase";
import { notificationService } from "@/services/notificationService";

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { signOut, user } = useAuth();

  const [notificationSettings, setNotificationSettings] = React.useState({
    coffee_requests: true,
    coffee_updates: true,
    messages: true,
    system_updates: true,
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNotificationToggle = async (notificationType: string, newValue: boolean) => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "User not found. Please try again.");
        return;
      }

      const updatedSettings = {
        ...notificationSettings,
        [notificationType]: newValue
      };

      let pushToken = null;
      const anyNotificationEnabled = Object.values(updatedSettings).some(enabled => enabled);

      // If any notification is enabled, ensure we have push token
      if (anyNotificationEnabled) {
        pushToken = await notificationService.registerForPushNotificationsAsync();
        if (!pushToken) {
          Alert.alert(
            "Permission Required",
            "Push notification permission is required to enable notifications.",
            [{ text: "OK" }]
          );
          return;
        }
      }

      // Update the notification preferences in the database
      const updateData: any = { 
        notification_settings: updatedSettings,
        notifications_enabled: anyNotificationEnabled
      };
      
      if (pushToken) {
        updateData.push_token = pushToken;
      } else if (!anyNotificationEnabled) {
        updateData.push_token = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating notification preferences:", error);
        Alert.alert("Error", "Failed to update notification settings. Please try again.");
        return;
      }

      // Update local state
      setNotificationSettings(updatedSettings);
      
      // Show success alert
      const notificationNames = {
        coffee_requests: "Coffee Chat Requests",
        coffee_updates: "Coffee Chat Updates", 
        messages: "Messages",
        system_updates: "System Updates"
      };
      
      const statusMessage = newValue ? "enabled" : "disabled";
      Alert.alert(
        "Notification Updated",
        `${notificationNames[notificationType]} notifications have been ${statusMessage}.`,
        [{ text: "OK" }]
      );

      console.log(`${notificationNames[notificationType]} notifications ${statusMessage} for user ${user.id}`);
      
    } catch (error) {
      console.error("Error toggling notification:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Router navigation handled in AuthContext
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    try {
      // First verify the current password by attempting to re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert("Error", "Current password is incorrect");
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        Alert.alert("Error", updateError.message);
        return;
      }

      Alert.alert("Success", "Password updated successfully");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change error:", error);
      Alert.alert("Error", "Failed to update password. Please try again.");
    }
  };

  const resetPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // Load user's notification preferences
  React.useEffect(() => {
    const loadNotificationPreferences = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("notification_settings, notifications_enabled")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading notification preferences:", error);
          return;
        }

        if (data && data.notification_settings) {
          setNotificationSettings(data.notification_settings);
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      }
    };

    loadNotificationPreferences();
  }, [user?.id]);

  React.useEffect(() => {
    const initializeSuperwall = async () => {
      try {
        const apiKey = "pk_62d74e42465ff893d4306f3f41f6fd62858dcdcc06124485";
        Superwall.configure({
          apiKey: apiKey,
        });
        
        // Set debug level for more detailed logging
        await Superwall.shared.setLogLevel(LogLevel.Debug);
        console.log('Superwall configured with debug logging in settings');
      } catch (error) {
        console.error('Failed to configure Superwall in settings:', error);
      }
    };
    
    initializeSuperwall();
  }, [])

  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [colors.text]);

  return (
   
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 32 },
              ]}
            >
              Account
            </Text>
            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() => setShowPasswordModal(true)}
            >
              <View style={styles.settingContent}>
                <Ionicons name="key-outline" size={22} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Change Password
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.secondaryText}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() => {
                Superwall.shared.register({
                  placement: 'subscription_onPress',
                });
              }}
            >
              <View style={styles.settingContent}>
                <Ionicons name="key-outline" size={22} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Manage Subscription
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Preferences
            </Text>

            {/* Coffee Chat Requests */}
            <View style={[styles.settingItem, { borderColor: colors.border }]}>
              <View style={styles.settingContent}>
                <Ionicons
                  name="cafe-outline"
                  size={22}
                  color={colors.text}
                />
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    Coffee Chat Requests
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.secondaryText }]}>
                    When someone wants to meet you
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.coffee_requests}
                onValueChange={(value) => handleNotificationToggle('coffee_requests', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={colors.border}
              />
            </View>

            {/* Coffee Chat Updates */}
            <View style={[styles.settingItem, { borderColor: colors.border }]}>
              <View style={styles.settingContent}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={colors.text}
                />
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    Coffee Chat Updates
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.secondaryText }]}>
                    Confirmations and cancellations
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.coffee_updates}
                onValueChange={(value) => handleNotificationToggle('coffee_updates', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={colors.border}
              />
            </View>

            {/* Messages */}
            <View style={[styles.settingItem, { borderColor: colors.border }]}>
              <View style={styles.settingContent}>
                <Ionicons
                  name="chatbubble-outline"
                  size={22}
                  color={colors.text}
                />
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    Messages
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.secondaryText }]}>
                    New chat messages
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.messages}
                onValueChange={(value) => handleNotificationToggle('messages', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={colors.border}
              />
            </View>

            {/* System Updates */}
            <View style={[styles.settingItem, { borderColor: colors.border }]}>
              <View style={styles.settingContent}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={colors.text}
                />
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    System Updates
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.secondaryText }]}>
                    Important app announcements
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.system_updates}
                onValueChange={(value) => handleNotificationToggle('system_updates', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={colors.border}
              />
            </View>

            {/* Dark mode - future implementation */}
            {/* <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Ionicons name="moon-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                darkMode
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.border },
              ]}
              onPress={handleDarkModeToggle}
            >
              <View
                style={[
                  styles.toggleKnob,
                  darkMode ? { right: 2 } : { left: 2 },
                  { backgroundColor: "white" },
                ]}
              />
            </TouchableOpacity>
          </View> */}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Support
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() =>
                openBrowserAsync("https://www.cupcircle.co/support")
              }
            >
              <View style={styles.settingContent}>
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Help Center
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.secondaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() =>
                openBrowserAsync("https://www.cupcircle.co/terms-of-service")
              }
            >
              <View style={styles.settingContent}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Terms of Service
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.secondaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() =>
                openBrowserAsync("https://www.cupcircle.co/privacy-policy")
              }
            >
              <View style={styles.settingContent}>
                <Ionicons name="shield-outline" size={22} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Privacy Policy
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.secondaryText}
              />
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

        {/* Password Change Modal */}
        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowPasswordModal(false);
            resetPasswordModal();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Change Password
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPasswordModal(false);
                    resetPasswordModal();
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Current Password
                  </Text>
                  <View style={[styles.passwordInputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      placeholder="Enter current password"
                      placeholderTextColor={colors.secondaryText}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showCurrentPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colors.secondaryText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    New Password
                  </Text>
                  <View style={[styles.passwordInputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.secondaryText}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showNewPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colors.secondaryText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm New Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Confirm New Password
                  </Text>
                  <View style={[styles.passwordInputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      placeholder="Confirm new password"
                      placeholderTextColor={colors.secondaryText}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colors.secondaryText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowPasswordModal(false);
                      resetPasswordModal();
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.updateButton, { backgroundColor: colors.primary }]}
                    onPress={handlePasswordChange}
                  >
                    <Text style={styles.updateButtonText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "K2D-SemiBold",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    width: "100%",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: "K2D-Regular",
  },
  notificationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingSubtext: {
    fontSize: 13,
    fontFamily: "K2D-Regular",
    marginTop: 2,
  },
  
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontFamily: "K2D-SemiBold",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "K2D-SemiBold",
  },
  modalBody: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "K2D-Regular",
  },
  eyeButton: {
    padding: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  updateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
});
