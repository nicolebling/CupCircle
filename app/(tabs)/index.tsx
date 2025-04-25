import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function CircleChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const router = useRouter();

  const [showPastChats, setShowPastChats] = useState(false);
  const [chats, setChats] = useState([]);
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matching")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchesError) throw matchesError;

      const userIds = new Set();
      matchesData.forEach((match) => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      if (profilesError) throw profilesError;

      const profileMap = {};
      profilesData.forEach((profile) => {
        profileMap[profile.id] = profile;
      });

      setProfiles(profileMap);
      setChats(matchesData);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const handleAction = async (chatId, action) => {
    try {
      if (action === "confirmed") {
        await supabase
          .from("matching")
          .update({ status: "confirmed" })
          .eq("match_id", chatId);

        // Refresh chats after update
        fetchChats();
      } else if (action === "cancel") {
        Alert.alert(
          "Cancel Chat",
          "Are you sure you want to cancel this chat?",
          [
            {
              text: "No",
              style: "cancel"
            },
            {
              text: "Yes",
              style: "destructive",
              onPress: async () => {
                // Immediately remove the chat from UI
                setChats((prevChats) =>
                  prevChats.filter((chat) => chat.match_id !== chatId),
                );

                // Then update the database
                await supabase
                  .from("matching")
                  .update({ status: "cancelled" })
                  .eq("match_id", chatId);
              }
            }
          ]
        );
      } else if (action === "pending_acceptance") {
        await supabase
          .from("matching")
          .update({ status: "pending_acceptance" })
          .eq("match_id", chatId);

        // Refresh chats after update
        fetchChats();
      } else if (action === "pending") {
        await supabase
          .from("matching")
          .update({ status: "pending" })
          .eq("match_id", chatId);

        // Refresh chats after update
        fetchChats();
      } else if (action === "message") {
        router.push(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      console.error("Error details:", JSON.stringify(error));

      // If there was an error, refresh to ensure UI is in sync with database
      fetchChats();
    }
  };

  const getPartnerProfile = (chat) => {
    const partnerId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
    return profiles[partnerId] || {};
  };

  const renderChatCard = (chat) => {
    const isExpired = new Date(chat.meeting_date) < new Date();

    // When showing past chats, only show expired confirmed chats
    if (showPastChats) {
      if (!isExpired || chat.status !== "confirmed") return null;
    }
    // When showing current chats, don't show expired chats
    else {
      if (isExpired) return null;
    }

    const partnerProfile = getPartnerProfile(chat);

    return (
      <View
        key={chat.match_id}
        style={[
          styles.chatCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: showPastChats ? 0.5 : 1,
          },
        ]}
      >
        <View style={styles.chatHeader}>
          <View style={styles.profileSection}>
            <Image
              source={{
                uri:
                  partnerProfile.photo_url ||
                  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
              }}
              style={styles.profilePhoto}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.partnerName, { color: colors.text }]}>
                {partnerProfile.name || "Unknown"}
              </Text>
              <Text
                style={[styles.occupation, { color: colors.secondaryText }]}
              >
                {partnerProfile.occupation || "No occupation listed"}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getBadgeColor(chat.status, colors) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(chat.status)}</Text>
          </View>
        </View>

        <View style={styles.meetingDetails}>
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.secondaryText}
              style={styles.detailIcon}
            />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {chat.meeting_date}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.secondaryText}
              style={styles.detailIcon}
            />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {chat.start_time.split(":")[0]}:{chat.start_time.split(":")[1]} -{" "}
              {chat.end_time.split(":")[0]}:{chat.end_time.split(":")[1]}
            </Text>
          </View>

          <View style={[styles.detailRow, { alignItems: "flex-start" }]}>
            <Ionicons
              name="location-outline"
              size={20}
              color={colors.secondaryText}
              style={[styles.detailIcon, { marginTop: 2 }]} // tweak marginTop as needed
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailTextBold, { color: colors.primary }]}>
                {chat.meeting_location.split("|||")[0] || "Location not set"}
              </Text>
              <Text
                style={[styles.detailText, { color: colors.secondaryText }]}
              >
                {chat.meeting_location.split("|||")[1] || "Location not set"}
              </Text>
            </View>
          </View>
        </View>

        {chat.initial_message?.length > 0 && (
          <>
            <Text>Initial Message:</Text>
            <Text style={[styles.message, { color: colors.secondaryText }]}>
              "{chat.initial_message}"
            </Text>
          </>
        )}

        <View style={styles.actions}>
          {chat.status === "pending" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                handleAction(chat.match_id, "cancel");
              }}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          {chat.status === "confirmed" && !showPastChats && (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => handleAction(chat.match_id, "message")}
              >
                <Text style={styles.actionButtonText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleAction(chat.match_id, "cancel")}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
          {chat.status === "pending_acceptance" && (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => handleAction(chat.match_id, "confirmed")}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleAction(chat.match_id, "cancel")}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const filterChatsByStatus = (status) =>
    chats.filter((chat) => {
      if (status === "pending") {
        if (chat.user1_id === user.id) {
          return chat.status === "pending";
        } else {
          return chat.status === "pending_acceptance";
        }
      }
      return chat.status === status;
    });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Circle Chats</Text>
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>
            Show Past Chats
          </Text>
          <Switch
            value={showPastChats}
            onValueChange={setShowPastChats}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {filterChatsByStatus("confirmed").filter((chat) => {
        if (showPastChats) {
          // For past chats, only show confirmed chats where the date has passed
          return new Date(chat.meeting_date) < new Date();
        } else {
          // For current chats, only show confirmed chats where the date hasn't passed
          return new Date(chat.meeting_date) >= new Date();
        }
      }).length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Confirmed Chats
          </Text>
          {filterChatsByStatus("confirmed")
            .filter((chat) => {
              if (showPastChats) {
                return new Date(chat.meeting_date) < new Date();
              } else {
                return new Date(chat.meeting_date) >= new Date();
              }
            })
            .map(renderChatCard)}
        </View>
      )}

      {!showPastChats && (
        <>
          {filterChatsByStatus("pending_acceptance").filter(
            (chat) => chat.user2_id === user.id,
          ).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Pending Acceptance
              </Text>
              {filterChatsByStatus("pending_acceptance")
                .filter((chat) => chat.user2_id === user.id)
                .map(renderChatCard)}
            </View>
          )}

          {filterChatsByStatus("pending").filter(
            (chat) => chat.user1_id === user.id,
          ).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Pending
              </Text>
              {filterChatsByStatus("pending")
                .filter((chat) => chat.user1_id === user.id)
                .map(renderChatCard)}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const getBadgeColor = (status, colors) => {
  switch (status) {
    case "confirmed":
      return colors.primary + "40";
    case "pending":
      return colors.secondaryText + "40";
    case "cancelled":
      return "#FF0000" + "40";
    default:
      return colors.border;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "pending_acceptance":
      return "Pending Acceptance";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return status;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontFamily: "K2D-Bold", fontSize: 24 },
  toggleContainer: { flexDirection: "row", alignItems: "center" },
  toggleLabel: { marginRight: 8, fontFamily: "K2D-Regular", fontSize: 14 },
  section: { padding: 16 },
  sectionTitle: { fontFamily: "K2D-SemiBold", fontSize: 18, marginBottom: 12 },
  chatCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  profileSection: { flexDirection: "row", alignItems: "center" },
  profilePhoto: { width: 48, height: 48, borderRadius: 24 },
  profileInfo: { marginLeft: 12 },
  partnerName: { fontFamily: "K2D-SemiBold", fontSize: 16 },
  occupation: { fontFamily: "K2D-Regular", fontSize: 14 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontFamily: "K2D-Medium", fontSize: 12, color: "#000000" },
  meetingDetails: { marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  detailText: { fontFamily: "K2D-Regular", fontSize: 14, marginLeft: 8 },
  detailTextBold: { fontFamily: "K2D-Bold", fontSize: 14, marginLeft: 8 },
  detailIcon: { marginRight: 8 },
  message: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 12,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontFamily: "K2D-Medium",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#666",
  },
});
