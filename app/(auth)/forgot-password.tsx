import React, { useState } from "react";
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
import { Link, router } from "expo-router";
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  async function sendResetEmail() {
    setLoading(true);

    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'cupcircle://reset'
      });

      if (error) {
        console.error("Password reset error:", error.message, error);
        if (error.message.includes("Email not confirmed")) {
          Alert.alert("Error", "Please verify your email address first before resetting your password.");
        } else if (error.message.includes("Invalid redirect URL")) {
          Alert.alert("Error", "App configuration error. Please contact support@cupcircle.co.");
          console.error("Redirect URL not configured in Supabase dashboard");
        } else if (error.message.includes("Unable to validate email address")) {
          Alert.alert("Error", "Please enter a valid email address.");
        } else {
          Alert.alert("Error", `Unable to send reset email: ${error.message}`);
        }
      } else {
        console.log("Password reset email sent successfully");
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("Error", "Unable to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <ThemeProvider value={theme}>
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.successPageContent}>
            <View style={styles.centeredSuccessContainer}>
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={80}
                  color={colors.primary}
                  style={styles.successIcon}
                />
                <Text style={[styles.successTitle, { color: theme.colors.text }]}>
                  Check Your Email
                </Text>
                <Text style={[styles.successMessage, { color: theme.colors.text }]}>
                  We've sent a password reset link to{"\n"}
                  <Text style={{ fontFamily: "K2D-SemiBold" }}>{email}</Text>
                </Text>
                <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                  Tap the link in the email to reset your password. Please also check your spam folder if you don't see it in your inbox.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.sendAnotherButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                <Text style={styles.buttonText}>Send Another Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.text }]}>
                Remember your password?
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.loginLink, { color: colors.primary }]}>
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
          <StatusBar style="auto" />
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 20}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            {/* Header with back button */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              {/* <LogoAnimation showText={true} showSubtitle={false} /> */}
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                Reset Password
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.colors.text }]}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Email"
                  placeholderTextColor={theme.colors.text}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Send Reset Email Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                ]}
                onPress={sendResetEmail}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.text }]}>
                Remember your password?
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text
                    style={[
                      styles.loginLink,
                      { color: colors.primary },
                    ]}
                  >
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </Link>
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
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 20,
    padding: 10,
    zIndex: 1,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
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
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: "K2D-Regular",
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  sendAnotherButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    minWidth: 200,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  successPageContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  centeredSuccessContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "K2D-SemiBold",
    marginBottom: 15,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: "K2D-Regular",
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    fontSize: 14,
    fontFamily: "K2D-SemiBold",
  },
});