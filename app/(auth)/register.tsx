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
  Image,
} from "react-native";
import { Link } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";

// Add console debugging
console.log('Register page loaded');
console.log('API_URL:', process.env.EXPO_PUBLIC_API_URL);

import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

// Prevent splash screen from hiding until assets are loaded
SplashScreen.preventAutoHideAsync();

export default function SignUpScreen() {
  const [name, setName] = useState(""); // Full Name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Hide splash screen when fonts are ready
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Handle Sign Up
  const handleSignUp = async () => {
    setError("");

    // Basic validation
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (err: any) {
      setError(err.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider value={theme}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            {/* Logo & Branding */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                CupCircle
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                Where every cup connects
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                Create Account
              </Text>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

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
                  placeholder="Password"
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
                  placeholder="Confirm Password"
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

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Signing up..." : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Already Have an Account? */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.text }]}>
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text
                    style={[
                      styles.registerLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Log In
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

// Styles
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
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: "K2D-Bold",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    marginTop: 5,
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
    marginBottom: 20,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: "#c62828",
    fontFamily: "K2D-Regular",
    textAlign: "center",
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
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  forgotPasswordButton: {
    alignSelf: "center",
    marginTop: 15,
    padding: 5,
  },
  forgotPasswordText: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
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
  registerLink: {
    fontSize: 14,
    fontFamily: "K2D-SemiBold",
  },
});
