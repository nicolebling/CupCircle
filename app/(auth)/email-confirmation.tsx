
import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from "expo-router";
import LogoAnimation from "@/components/LogoAnimation";
import Colors from '@/constants/Colors';
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import Toast from "@/components/ui/Toast";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { supabase } from '@/lib/supabase';

export default function EmailConfirmationScreen() {
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const resendConfirmation = async () => {
    // Note: We would need to store the email somehow to resend
    // For now, redirect back to register
    Alert.alert(
      "Resend Confirmation",
      "To resend the confirmation email, please register again with the same email address.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Go to Register", onPress: () => router.replace('/(auth)/register') }
      ]
    );
  };

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
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="mail" size={48} color={colors.primary} />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Check Your Email
            </Text>
            
            <Text style={[styles.description, { color: theme.colors.text }]}>
              We've sent a confirmation link to your email address. Please click the link to verify your account and complete your registration.
            </Text>

            <View style={styles.bulletPoints}>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.bulletText, { color: theme.colors.text }]}>
                  Check your inbox and spam folder
                </Text>
              </View>
              
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.bulletText, { color: theme.colors.text }]}>
                  Click the confirmation link in the email
                </Text>
              </View>
              
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.bulletText, { color: theme.colors.text }]}>
                  Return to the app to continue
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.resendButton, { borderColor: colors.primary }]}
              onPress={resendConfirmation}
              disabled={loading}
            >
              <Text style={[styles.resendButtonText, { color: colors.primary }]}>
                Didn't receive email?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.primary }]}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.backButtonText}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type="info"
          onHide={() => setToastVisible(false)}
        />
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
  bulletPoints: {
    alignSelf: "stretch",
    maxWidth: 300,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  bulletText: {
    fontSize: 14,
    fontFamily: "K2D-Regular",
    flex: 1,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  resendButton: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resendButtonText: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  backButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
});
