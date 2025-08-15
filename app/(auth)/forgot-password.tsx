
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

  async function resetPassword() {
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
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app-domain.com/reset-password', // You can customize this
      });

      if (error) {
        console.error("Password reset error:", error.message);
        Alert.alert("Error", "Unable to send reset email. Please try again.");
      } else {
        console.log("Password reset email sent:", data);
        setEmailSent(true);
        Alert.alert(
          "Email Sent", 
          "If an account with this email exists, you will receive password reset instructions.",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("Error", "Unable to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
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
              <LogoAnimation showText={true} showSubtitle={false} />
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                Reset Password
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.colors.text }]}>
                Enter your email address and we'll send you instructions to reset your password.
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
                  editable={!emailSent}
                />
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { 
                    backgroundColor: emailSent ? theme.colors.border : colors.primary,
                    opacity: emailSent ? 0.6 : 1 
                  },
                ]}
                onPress={resetPassword}
                disabled={loading || emailSent}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending..." : emailSent ? "Email Sent" : "Send Reset Email"}
                </Text>
              </TouchableOpacity>

              {emailSent && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  <Text style={[styles.successText, { color: theme.colors.text }]}>
                    Check your email for reset instructions
                  </Text>
                </View>
              )}
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  successText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: "K2D-Regular",
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
