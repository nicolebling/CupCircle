import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from "expo-router";
import LogoAnimation from "@/components/LogoAnimation";
import Colors from '@/constants/Colors';
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from 'expo-apple-authentication';
import Toast from "@/components/ui/Toast";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { supabase } from '@/lib/supabase'


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
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
   const insets = useSafeAreaInsets();

  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  //supabase signupwithEmail
  async function signUpWithEmail() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (error) {
        console.error("Signup error:", error.message)
        // Convert technical error messages to user-friendly ones
        if (error.message.includes("User already registered")) {
          setError("An account with this email already exists");
        } else if (error.message.includes("Password should be")) {
          setError("Password must be at least 6 characters long");
        } else if (error.message.includes("valid email")) {
          setError("Please enter a valid email address");
        } else {
          setError("Please enter a valid email address.");
        }
      } else {
        // console.log("Signup successful:", data)
        // console.log("User created:", data.user)
        // console.log("Session created:", data.session)
        // console.log("User metadata:", data.user?.user_metadata)
        // console.log("Authentication method:", data.user?.app_metadata)

        // Create profile for the new user
        if (data.user) {
          try {
            // Check if profile already exists
            const { data: existingProfile, error: checkError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', data.user.id)
              .single();

            if (checkError && checkError.code !== 'PGRST116') {
              // PGRST116 means not found, which is expected
              console.error("Error checking for existing profile:", checkError);
            }

            // Only create profile if it doesn't exist
            if (!existingProfile) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .insert([
                  { 
                    id: data.user.id,
                    avatar_url: null,
                  }
                ])
                .select();

              if (profileError) {
                console.error("Profile creation error:", profileError);
                console.error("Profile error details:", JSON.stringify(profileError));
                // Don't sign out - just continue to profile setup
                console.log("Continuing to profile setup despite profile creation error");
              }
            } else {
              console.log("Profile already exists, continuing to profile setup");
            }
          } catch (profileCreationError) {
            console.error("Exception during profile creation:", profileCreationError);
            // Don't sign out - just continue to profile setup
            console.log("Continuing to profile setup despite exception");
          }
        }

        router.replace('/(auth)/onboarding');
      }
    } catch (e) {
      console.error("Signup exception:", e)
      setToastMessage('An unexpected error occurred. Please try again.');
      setToastVisible(true);
    }
    setLoading(false)
  }

  async function signUpWithApple() {
    if (Platform.OS !== 'ios') return;
    
    setLoading(true);
    setError("");
    setToastMessage("");
    setToastVisible(false);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          console.error("Apple Sign Up error:", error.message);
          setError("Apple Sign Up failed. Please try again.");
          setToastMessage("Apple Sign Up failed. Please try again.");
          setToastVisible(true);
        } else {
          console.log("Apple Sign Up successful:", data);

          // Create profile for the new user
          if (data.user) {
            try {
              // Check if profile already exists
              const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', data.user.id)
                .single();

              if (checkError && checkError.code !== 'PGRST116') {
                console.error("Error checking for existing profile:", checkError);
              }

              // Only create profile if it doesn't exist
              if (!existingProfile) {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .insert([
                    { 
                      id: data.user.id,
                      avatar_url: null,
                    }
                  ])
                  .select();

                if (profileError) {
                  console.error("Profile creation error:", profileError);
                }
              }
            } catch (profileCreationError) {
              console.error("Exception during profile creation:", profileCreationError);
            }
          }

          router.replace('/(auth)/onboarding');
        }
      } else {
        throw new Error('No identityToken received from Apple.');
      }
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow
        console.log("Apple Sign Up canceled by user");
      } else {
        console.error("Apple Sign Up error:", e);
        setError("Apple Sign Up failed. Please try again.");
        setToastMessage("Apple Sign Up failed. Please try again.");
        setToastVisible(true);
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

  // Handle Sign Up
  const handleSignUp = async () => {
    setError("");

    // Basic validation
    if (!email || !password || !confirmPassword) {
      const errorMsg = "All fields are required";
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastVisible(true);
      return;
    }
    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastVisible(true);
      return;
    }
    if (password.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastVisible(true);
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (err: any) {
      const errorMsg = err.message || "Sign-up failed";
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastVisible(true);
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
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 200 : 20}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            
            {/* Logo & Branding */}
            <View style={styles.header}>
              <LogoAnimation showText={true} showSubtitle={true} />
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                Create Account
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
                  { backgroundColor: colors.primary },
                ]}
                onPress={signUpWithEmail}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Signing up..." : "Sign Up"}
                </Text>
              </TouchableOpacity>

              {/* Apple Sign Up Button */}
              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={10}
                  style={styles.appleButton}
                  onPress={signUpWithApple}
                />
              )}

              {/* Error Message */}
              {error ? (
                <Text style={styles.errorMessage}>{error}</Text>
              ) : null}
              
            </View>

           

            {/* Already Have an Account? */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.text }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text
                  style={[
                    styles.registerLink,
                    { color: colors.primary },
                  ]}
                >
                  Log In
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
     marginBottom: 10,
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
  errorMessage: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    fontFamily: "K2D-Regular",
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginTop: 15,
  },
});