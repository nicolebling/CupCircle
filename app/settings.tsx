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
  Switch,
  ActivityIndicator
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

  const [notifications, setNotifications] = React.useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleNotificationsToggle = async () => {
    const newNotificationState = !notifications;

    try {
      if (!user?.id) {
        Alert.alert("Error", "User not found. Please try again.");
        return;
      }

      let pushToken = null;

      // If enabling notifications, register for push notifications
      if (newNotificationState) {
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

      // Update the notification preference and push token in the database
      const updateData: any = {
        notifications_enabled: newNotificationState
      };

      if (pushToken) {
        updateData.push_token = pushToken;
      } else if (!newNotificationState) {
        // Clear push token when disabling notifications
        updateData.push_token = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating notification preference:", error);
        Alert.alert("Error", "Failed to update notification settings. Please try again.");
        return;
      }

      // Update local state
      setNotifications(newNotificationState);

      // Show success alert
      const statusMessage = newNotificationState ? "enabled" : "disabled";
      Alert.alert(
        "Notifications Updated",
        `Push notifications have been ${statusMessage}.`,
        [{ text: "OK" }]
      );

      console.log(`Notifications ${statusMessage} for user ${user.id}`);

    } catch (error) {
      console.error("Error toggling notifications:", error);
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

  const deleteAccount = async () => {
    setDeleteLoading(true);

    try {
      if (!user?.id) {
        Alert.alert("Error", "User not found. Please try again.");
        setDeleteLoading(false);
        return;
      }

      // Get the current session to get the access token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert("Error", "Authentication required. Please log in again.");
        setDeleteLoading(false);
        return;
      }

      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error("Failed to delete account. Please try again.");
      }

      if (data?.error) {
        console.error("Account deletion failed:", data.error);
        throw new Error(data.error);
      }

      // Success - close modal and sign out
      setShowDeleteModal(false);
      setDeleteLoading(false);

      Alert.alert(
        "Account Deleted",
        "Your account has been successfully deleted.",
        [
          {
            text: "OK",
            onPress: async () => {
              await signOut();
            }
          }
        ]
      );

    } catch (error) {
      setDeleteLoading(false);
      console.error("Account deletion error:", error);

      Alert.alert(
        "Deletion Failed",
        error.message || "An error occurred while deleting your account. Please try again or contact support.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry",
            onPress: () => deleteAccount()
          }
        ]
      );
    }
  };

  // Load user's notification preference
  React.useEffect(() => {
    const loadNotificationPreference = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("notifications_enabled")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading notification preference:", error);
          return;
        }

        if (data && typeof data.notifications_enabled === 'boolean') {
          setNotifications(data.notifications_enabled);
        }
      } catch (error) {
        console.error("Error fetching notification preference:", error);
      }
    };

    loadNotificationPreference();
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
                <Ionicons name="cube-outline" size={22} color={colors.text} />
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
              Cafes
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() =>
                openBrowserAsync("https://cupcircle.co/cafes")
              }
            >
              <View style={styles.settingContent}>
                <Ionicons
                  name="cafe-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Cafe Spotlight
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

            <View style={[styles.settingItem, { borderColor: colors.border }]}>
              <View style={styles.settingContent}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Notifications
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={colors.border}
              />
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={async () => {
                if (!user?.id) {
                  Alert.alert("Error", "User not found");
                  return;
                }
                
                Alert.alert("Testing", "Creating test notification...");
                
                // Create a test notification
                const created = await notificationService.createTestNotification(user.id);
                
                if (!created) {
                  Alert.alert("Error", "Failed to create test notification");
                  return;
                }
                
                // Wait a moment then trigger the processor
                setTimeout(async () => {
                  const result = await notificationService.testScheduledNotifications();
                  Alert.alert(
                    "Test Complete",
                    result ? `Processed: ${result.processed || 0} notifications` : "Test failed",
                    [{ text: "OK" }]
                  );
                }, 1000);
              }}
            >
              <View style={styles.settingContent}>
                <Ionicons
                  name="flask-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Test Notifications
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
              Support
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() =>
                openBrowserAsync("https://cupcircle.co/contact-us")
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
                openBrowserAsync("https://cupcircle.co/faq")
              }
            >
              <View style={styles.settingContent}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={[styles.settingText, { color: colors.text }]}>
                  FAQ
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
                openBrowserAsync("https://cupcircle.co/terms-of-service")
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
                openBrowserAsync("https://cupcircle.co/privacy-policy")
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

          <TouchableOpacity
            style={[styles.deleteAccountButton, {  borderColor: colors.border }]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
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

        {/* Delete Account Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.deleteModalContent, { backgroundColor: colors.background }]}>
              <View style={styles.deleteModalHeader}>
                <Ionicons name="warning" size={48} color="#FF3B30" />
                <Text style={[styles.deleteModalTitle, { color: colors.text }]}>
                  Delete Account
                </Text>
                <Text style={[styles.deleteModalSubtitle, { color: colors.secondaryText }]}>
                  Are you sure you want to delete your account?
                </Text>
              </View>

              <View style={styles.deleteModalBody}>
                <Text style={[styles.deleteWarningText, { color: colors.text }]}>
                  This action cannot be undone. All of your data including:
                </Text>
                <View style={styles.deleteWarningList}>
                  <Text style={[styles.deleteWarningItem, { color: colors.secondaryText }]}>
                    • Profile information
                  </Text>
                  <Text style={[styles.deleteWarningItem, { color: colors.secondaryText }]}>
                    • Coffee Chat history
                  </Text>
                  <Text style={[styles.deleteWarningItem, { color: colors.secondaryText }]}>
                    • Availability settings
                  </Text>
                  <Text style={[styles.deleteWarningItem, { color: colors.secondaryText }]}>
                    • All conversations
                  </Text>
                </View>
                <Text style={[styles.deleteWarningText, { color: colors.text }]}>
                  will be permanently deleted.
                </Text>
              </View>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[styles.deleteCancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  <Text style={[styles.deleteCancelButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteConfirmButton, { backgroundColor: "#FF3B30" }]}
                  onPress={deleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.deleteConfirmButtonText}>Delete Account</Text>
                  )}
                </TouchableOpacity>
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
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginVertical: 8,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteAccountText: {
    color: "#FF3B30",
    fontSize: 16,
    fontFamily: "K2D-SemiBold",
    marginLeft: 8,
  },
  deleteModalContent: {
    width: "90%",
    borderRadius: 16,
    padding: 24,
    maxHeight: "80%",
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  deleteModalTitle: {
    fontSize: 24,
    fontFamily: "K2D-SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalSubtitle: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    textAlign: "center",
  },
  deleteModalBody: {
    marginBottom: 24,
  },
  deleteWarningText: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    lineHeight: 24,
    marginBottom: 12,
  },
  deleteWarningList: {
    marginVertical: 12,
    paddingLeft: 8,
  },
  deleteWarningItem: {
    fontSize: 14,
    fontFamily: "K2D-Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
});