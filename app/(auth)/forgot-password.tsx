
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
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP and new password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  async function sendOTP() {
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
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Don't create new user if email doesn't exist
        }
      });

      if (error) {
        console.error("OTP send error:", error.message);
        Alert.alert("Error", "Unable to send verification code. Please try again.");
      } else {
        console.log("OTP sent successfully");
        setStep(2);
        Alert.alert(
          "Code Sent", 
          "A verification code has been sent to your email. Please check your inbox and spam folder."
        );
      }
    } catch (error) {
      console.error("OTP send error:", error);
      Alert.alert("Error", "Unable to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setLoading(true);

    if (!otp) {
      Alert.alert("Error", "Please enter the verification code");
      setLoading(false);
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in both password fields");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Verify OTP and update password
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email'
      });

      if (error) {
        console.error("OTP verification error:", error.message);
        Alert.alert("Error", "Invalid verification code. Please try again.");
        setLoading(false);
        return;
      }

      // Update password after successful OTP verification
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordError) {
        console.error("Password update error:", passwordError.message);
        Alert.alert("Error", "Unable to update password. Please try again.");
      } else {
        console.log("Password reset successful");
        Alert.alert(
          "Success",
          "Your password has been reset successfully. You can now log in with your new password.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login")
            }
          ]
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("Error", "Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <Text style={[styles.formTitle, { color: theme.colors.text }]}>
        Reset Password
      </Text>
      <Text style={[styles.formSubtitle, { color: theme.colors.text }]}>
        Enter your email address and we'll send you a verification code to reset your password.
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

      {/* Send Code Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
        ]}
        onPress={sendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Send Verification Code"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <Text style={[styles.formTitle, { color: theme.colors.text }]}>
        Enter Verification Code
      </Text>
      <Text style={[styles.formSubtitle, { color: theme.colors.text }]}>
        Enter the verification code sent to {email} and your new password.
      </Text>

      {/* OTP Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Verification Code"
          placeholderTextColor={theme.colors.text}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      {/* New Password Input */}
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
          value={newPassword}
          onChangeText={setNewPassword}
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

      {/* Reset Password Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
        ]}
        onPress={resetPassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Resetting..." : "Reset Password"}
        </Text>
      </TouchableOpacity>

      {/* Resend Code Button */}
      <TouchableOpacity
        style={[styles.resendButton]}
        onPress={() => setStep(1)}
        disabled={loading}
      >
        <Text style={[styles.resendText, { color: colors.primary }]}>
          Didn't receive code? Send again
        </Text>
      </TouchableOpacity>
    </View>
  );

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
                onPress={() => {
                  if (step === 2) {
                    setStep(1);
                  } else {
                    router.back();
                  }
                }}
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
            {step === 1 ? renderStep1() : renderStep2()}

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
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  resendButton: {
    marginTop: 15,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    fontFamily: "K2D-Medium",
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
