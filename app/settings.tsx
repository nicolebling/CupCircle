import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigation } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { openBrowserAsync } from "expo-web-browser";
import { SuperwallProvider } from "expo-superwall";

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { signOut } = useAuth();

  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Router navigation handled in AuthContext
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
    <SuperwallProvider
      apiKeys={{
        ios: "pk_62d74e42465ff893d4306f3f41f6fd62858dcdcc06124485",
        // android: process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY // Add if you have Android key
      }}
    >
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
            >
              <View style={styles.settingContent}>
                <Ionicons name="key-outline" size={22} color={colors.text} />
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
              <TouchableOpacity
                style={[
                  styles.toggle,
                  notifications
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.border },
                ]}
                onPress={handleNotificationsToggle}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    notifications ? { right: 2 } : { left: 2 },
                    { backgroundColor: "white" },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Dark mode - future implementation */}
            {/* <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Ionicons name="moon-outline" size={22} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                darkMode
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.border },
              ]}
              onPress={handleDarkModeToggle}
            >
              <View
                style={[
                  styles.toggleKnob,
                  darkMode ? { right: 2 } : { left: 2 },
                  { backgroundColor: "white" },
                ]}
              />
            </TouchableOpacity>
          </View> */}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Support
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: colors.border }]}
              onPress={() =>
                openBrowserAsync("https://www.cupcircle.co/support")
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
                openBrowserAsync("https://www.cupcircle.co/terms-of-service")
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
                openBrowserAsync("https://www.cupcircle.co/privacy-policy")
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
        </ScrollView>
      </SafeAreaView>
    </SuperwallProvider>
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
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
  },
  toggleKnob: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
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
});
