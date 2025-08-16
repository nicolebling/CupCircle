
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from "expo-router";
import LogoAnimation from "@/components/LogoAnimation";
import Colors from '@/constants/Colors';
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { supabase } from '@/lib/supabase';
import { usePasswordRecovery } from '@/hooks/usePasswordRecovery';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { readyForNewPassword, loading: recoveryLoading } = usePasswordRecovery();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  async function updatePassword() {
    if (!readyForNewPassword) {
      Alert.alert(
        "Invalid Reset Link",
        "This password reset link is invalid or has expired. Please request a new one.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/forgot-password")
          }
        ]
      );
      return;
    }

    setLoading(true);

    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in both password fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error("Password update error:", error.message);
        Alert.alert("Error", "Unable to update password. Please try again.");
      } else {
        console.log("Password updated successfully:", data);
        Alert.alert(
          "Success",
          "Your password has been updated successfully. You can now log in with your new password.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login")
            }
          ]
        );
      }
    } catch (error) {
      console.error("Password update error:", error);
      Alert.alert("Error", "Unable to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while processing recovery link
  if (recoveryLoading) {
    return (
      <ThemeProvider value={theme}>
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.loadingContainer}>
            <LogoAnimation showText={true} showSubtitle={false} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Processing recovery link...
            </Text>
          </View>
        </SafeAreaView>
      </ThemeProvider>
    );
  }

  // Show error state if recovery link is invalid
  if (!readyForNewPassword) {
    return (
      <ThemeProvider value={theme}>
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.errorContainer}>
            <LogoAnimation showText={true} showSubtitle={false} />
            <Ionicons
              name="alert-circle"
              size={80}
              color="#FF6B6B"
              style={styles.errorIcon}
            />
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
              Invalid Reset Link
            </Text>
            <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
              This password reset link is invalid or has expired. Please request a new one.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/(auth)/forgot-password")}
            >
              <Text style={styles.buttonText}>Request New Link</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 200 : 20}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <LogoAnimation showText={true} showSubtitle={false} />
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                Set New Password
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.colors.text }]}>
                Please enter your new password below.
              </Text>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="New Password"
                  placeholderTextColor={theme.colors.text}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.passwordVisibilityButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Confirm New Password"
                  placeholderTextColor={theme.colors.text}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.passwordVisibilityButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Update Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                ]}
                onPress={updatePassword}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text
                  style={[
                    styles.backToLoginLink,
                    { color: colors.primary },
                  ]}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: "K2D-Regular",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorIcon: {
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: "K2D-SemiBold",
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginVertical: 30,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: "K2D-SemiBold",
    marginBottom: 10,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 15,
    position: "relative",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: "K2D-Regular",
  },
  passwordVisibilityButton: {
    position: "absolute",
    right: 15,
    top: 13,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  backToLoginLink: {
    fontSize: 14,
    fontFamily: "K2D-SemiBold",
  },
});
