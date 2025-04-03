import React, { useState } from "react";
import {
  Alert,
  View,
  AppState,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import LogoAnimation from "@/components/LogoAnimation";
import { useColorScheme } from "@/hooks/useColorScheme";
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
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';



// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

// Prevent splash screen from hiding until assets are loaded
SplashScreen.preventAutoHideAsync();

// Toast Component
const Toast = ({ visible, message }) => {
  if (!visible) return null;
  return (
    <View style={styles.toastContainer}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  async function signInWithEmail() {
    setLoading(true);
    setError("");
    setToastMessage("");
    setToastVisible(false);

    if (!email || !password) {
      setError("Email and password are required");
      setToastMessage("Email and password are required");
      setToastVisible(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Login error:", error.message);
      setError(error.message);
      setToastMessage(error.message);
      setToastVisible(true);
    } else {
      console.log("Login successful:", data);
      console.log("User session:", data.session);
      console.log("User data:", data.user);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error checking profile:", profileError);
        }

        if (!profileData) {
          Alert.alert('Welcome back!', 'Please complete your profile to continue.');
          router.replace('/(auth)/profile-setup');
        } else {
          router.replace('/(tabs)/matching');
        }
      } catch (checkError) {
        console.error("Error in profile check:", checkError);
        router.replace('/(auth)/profile-setup');
      }
    }
    setLoading(false);
  }


  // Hide splash screen when fonts are ready
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

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
              <LogoAnimation />
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                Welcome Back
              </Text>

              {/* Error messages are now handled by toast notifications */}

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

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => signInWithEmail()}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </TouchableOpacity>

              {/* Error Message */}
              {error ? (
                <Text style={styles.errorMessage}>{error}</Text>
              ) : null}

              {/* Forgot Password */}
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text
                    style={[
                      styles.forgotPasswordText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Register Redirect */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.text }]}>
                Don't have an account?
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text
                    style={[
                      styles.registerLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Register
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
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
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
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: '#c62828',
    fontFamily: "K2D-Regular",
    flex: 1,
    fontSize: 14,
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
  toastContainer: {
    backgroundColor: '#f44336', // Red background
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
  },
  errorMessage: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    fontFamily: "K2D-Regular",
  },
});