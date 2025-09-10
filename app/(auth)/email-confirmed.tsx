
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
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
import * as Linking from 'expo-linking';

export default function EmailConfirmedScreen() {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  useEffect(() => {
    handleEmailConfirmation();
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      // Get the current URL to check for confirmation tokens
      const url = await Linking.getInitialURL();
      
      if (url) {
        console.log('Email confirmation URL:', url);
        
        // Parse the URL to get tokens
        const urlParts = url.split('#')[1] || url.split('?')[1];
        if (urlParts) {
          const params = new URLSearchParams(urlParts);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          if (accessToken && refreshToken && type === 'signup') {
            // Set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              setError('Failed to confirm email. Please try again.');
            } else if (data.user) {
              console.log('Email confirmed successfully for user:', data.user.id);
              
              // Create profile for the confirmed user
              try {
                const { data: existingProfile, error: checkError } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', data.user.id)
                  .single();

                if (checkError && checkError.code !== 'PGRST116') {
                  console.error("Error checking for existing profile:", checkError);
                }

                if (!existingProfile) {
                  const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                      { 
                        id: data.user.id,
                        avatar_url: null,
                      }
                    ]);

                  if (profileError) {
                    console.error("Profile creation error:", profileError);
                  }
                }
              } catch (profileCreationError) {
                console.error("Exception during profile creation:", profileCreationError);
              }

              setConfirmed(true);
            }
          } else {
            setError('Invalid confirmation link.');
          }
        } else {
          setError('No confirmation data found.');
        }
      } else {
        setError('No confirmation link found.');
      }
    } catch (error) {
      console.error('Error handling email confirmation:', error);
      setError('An error occurred while confirming your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(auth)/onboarding');
  };

  const handleRetry = () => {
    router.replace('/(auth)/register');
  };

  if (loading) {
    return (
      <ThemeProvider value={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Confirming your email...
            </Text>
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
        <View style={styles.content}>
          {/* Logo & Branding */}
          <View style={styles.header}>
            <LogoAnimation showText={true} showSubtitle={false} />
          </View>

          {/* Main Content */}
          <View style={styles.messageContainer}>
            <View style={[
              styles.iconContainer, 
              { backgroundColor: (confirmed ? colors.primary : '#ff4444') + '20' }
            ]}>
              <Ionicons 
                name={confirmed ? "checkmark-circle" : "close-circle"} 
                size={48} 
                color={confirmed ? colors.primary : '#ff4444'} 
              />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {confirmed ? "Email Confirmed!" : "Confirmation Failed"}
            </Text>
            
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {confirmed 
                ? "Your email has been successfully confirmed. You can now complete your profile setup."
                : error || "There was an issue confirming your email. Please try again."
              }
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={confirmed ? handleContinue : handleRetry}
            >
              <Text style={styles.buttonText}>
                {confirmed ? "Continue to Setup" : "Try Again"}
              </Text>
            </TouchableOpacity>

            {!confirmed && (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
  },
  messageContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "K2D-Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  secondaryButton: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
});
