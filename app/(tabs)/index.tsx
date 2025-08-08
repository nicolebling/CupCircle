import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Switch,
  Alert,
} from "react-native";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificationService";
import { useRouter, useNavigation } from "expo-router";
import ProfileCard from "@/components/ProfileCard";
import { format, addDays, isPast, isToday, parseISO } from "date-fns";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import FeedbackModal from "@/components/FeedbackModal";
import {
  feedbackService,
  FeedbackEligibleMatch,
} from "@/services/feedbackService";

export default function CircleChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [showPastChats, setShowPastChats] = useState(false);
  const [chats, setChats] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [isExpired, setIsExpired] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentFeedbackMatch, setCurrentFeedbackMatch] =
    useState<FeedbackEligibleMatch | null>(null);
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackEligibleMatch[]>(
    [],
  );
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const fetchChats = async () => {
    if (!user) return;
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matching")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchesError) {
        console.warn("Error fetching matches:", matchesError.message);
        setChats([]);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setChats([]);
        setProfiles({});
        return;
      }

      const userIds = new Set();
      matchesData.forEach((match) => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });

      if (userIds.size === 0) {
        setChats([]);
        setProfiles({});
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      if (profilesError) {
        console.warn("Error fetching profiles:", profilesError.message);
        // Still set the chats but with empty profiles
        setChats(matchesData);
        setProfiles({});
        return;
      }

      const profileMap = {};
      profilesData?.forEach((profile) => {
        profileMap[profile.id] = profile;
      });

      setProfiles(profileMap);
      setChats(matchesData);

      // Check feedback status for past confirmed chats
      const pastConfirmedChats = matchesData.filter(
        (match) =>
          match.status === "confirmed" &&
          new Date(match.meeting_date) < new Date(),
      );
      if (pastConfirmedChats.length > 0) {
        checkFeedbackStatus(pastConfirmedChats.map((chat) => chat.match_id));
      }
    } catch (error) {
      console.warn(
        "Unexpected error in fetchChats:",
        error instanceof Error ? error.message : String(error),
      );
      // Set empty states but don't crash
      setChats([]);
      setProfiles({});
    } finally {
      if (!initialFetchDone) {
        setIsLoading(false);
        setInitialFetchDone(true);
      }
    }
  };

  // UI Testing - VS Toggle for past chats
  // React.useEffect(() => {
  //   navigation.setOptions({
  //     headerRight: () => (
  //       <View style={{ flexDirection: "row" }}>
  //         <TouchableOpacity
  //           onPress={() => setShowPastChats(!showPastChats)}
  //           style={{ marginRight: 23 }}
  //         >
  //           <Ionicons
  //             name="time-outline"
  //             size={24}
  //             color={showPastChats ? colors.primary : colors.text}
  //           />
  //         </TouchableOpacity>
  //       </View>
  //     ),
  //   });
  // }, [colors.text, showPastChats]);

  // Make refreshData function available globally
  useEffect(() => {
    if (user) {
      fetchChats();

      // Set up polling every 3 seconds for more responsive updates
      const pollInterval = setInterval(fetchChats, 3000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [user]);

  const handleAction = async (chatId, action) => {
    try {
      if (action === "confirmed") {
        // Get the chat details for notification
        const chat = chats.find((c) => c.match_id === chatId);
        const partnerProfile = getPartnerProfile(chat);
        
        await supabase
          .from("matching")
          .update({ status: "confirmed" })
          .eq("match_id", chatId);

        // Send confirmation notification to the other user
        if (chat && partnerProfile) {
          // Get the correct recipient ID (the other user in the chat)
          const recipientUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          
          try {
            await notificationService.sendCoffeeConfirmationNotification(
              recipientUserId,
              user.id,
              chat.meeting_location.split("|||")[0] || "the café"
            );
          } catch (notifError) {
            console.error('Error sending coffee confirmation notification:', notifError);
          }
        }

        // Refresh chats after update
        fetchChats();
      } else if (action === "cancel") {
        // Get the chat details for notification before showing alert
        const chat = chats.find((c) => c.match_id === chatId);
        const partnerProfile = getPartnerProfile(chat);
        
        // Immediately remove the chat from UI
        Alert.alert(
          "Cancel Chat",
          "Are you sure you want to cancel this chat?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Yes, Cancel",
              style: "destructive",
              onPress: async () => {
                setChats((prevChats) =>
                  prevChats.filter((chat) => chat.match_id !== chatId),
                );

                // Send cancellation notification to the other user
                if (chat && partnerProfile) {
                  const partnerId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
                  try {
                    await notificationService.sendCoffeeCancellationNotification(
                      partnerId,
                      user.id
                    );
                  } catch (notifError) {
                    console.error('Error sending coffee cancellation notification:', notifError);
                  }
                }

                // Update the database
                await supabase
                  .from("matching")
                  .update({ status: "cancelled" })
                  .eq("match_id", chatId);
              },
            },
          ],
          { cancelable: true },
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

  const checkFeedbackStatus = async (matchIds: string[]) => {
    try {
      const { data: existingFeedback, error } = await supabase
        .from("feedback")
        .select("match_id, user1_id, user_rating, cafe_rating, feedback_text")
        .in("match_id", matchIds)
        .eq("user1_id", user.id);

      if (error) throw error;

      // Only consider feedback as "given" if it has actual ratings (not NULL)
      const feedbackGivenSet = new Set(
        existingFeedback?.filter(f => f.user_rating !== null && f.cafe_rating !== null).map((f) => f.match_id) || [],
      );
      setFeedbackGiven(feedbackGivenSet);
    } catch (error) {
      console.error("Error checking feedback status:", error);
    }
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
            <TouchableOpacity
              onPress={() => {
                setSelectedProfile(partnerProfile);
                setShowProfileModal(true);
              }}
            >
              <Image
                source={{
                  uri:
                    partnerProfile.photo_url ||
                    "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
                }}
                style={styles.profilePhoto}
              />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={[styles.partnerName, { color: colors.text }]}>
                {partnerProfile.name || " "}
              </Text>
              <Text
                style={[styles.occupation, { color: colors.secondaryText }]}
              >
                {(partnerProfile.occupation || " ").length > 30
                  ? `${partnerProfile.occupation.substring(0, 30)}...`
                  : partnerProfile.occupation || " "}
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
              {(() => {
                const [year, month, day] = chat.meeting_date
                  .split("-")
                  .map(Number);
                const date = new Date(year, month - 1, day); // month is 0-indexed
                return format(date, "EEEE, MMMM d");
              })()}
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
              {`${chat.start_time.split(":")[0]}:${chat.start_time.split(":")[1]} - ${chat.end_time.split(":")[0]}:${chat.end_time.split(":")[1]}`}
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
            <Text>Message:</Text>
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
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleAction(chat.match_id, "cancel")}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push(`/messages/${chat.match_id}`)}
              >
                <Text style={styles.actionButtonText}>Message</Text>
              </TouchableOpacity>
            </>
          )}
          {chat.status === "confirmed" && showPastChats && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                feedbackGiven.has(chat.match_id)
                  ? { backgroundColor: colors.secondaryText }
                  : { backgroundColor: colors.primary },
              ]}
              onPress={async () => {
                // If we already know feedback was given, don't allow click
                if (feedbackGiven.has(chat.match_id)) {
                  Alert.alert(
                    "Feedback Already Given",
                    "You have already submitted feedback for this coffee chat.",
                  );
                  return;
                }

                // Check if there's existing feedback with NULL values - if so, allow upsert
                console.log("🔍 Checking for existing feedback record:", {
                  match_id: chat.match_id,
                  user1_id: user.id
                });

                const { data: existingFeedback, error } = await supabase
                  .from("feedback")
                  .select("match_id, user_rating, cafe_rating")
                  .eq("match_id", chat.match_id)
                  .eq("user1_id", user.id)
                  .single();

                console.log("📊 Existing feedback check result:", {
                  existingFeedback,
                  error: error?.code,
                  hasExistingRecord: !!existingFeedback,
                  userRatingIsNull: existingFeedback?.user_rating === null,
                  cafeRatingIsNull: existingFeedback?.cafe_rating === null
                });

                const partnerProfile = getPartnerProfile(chat);
                const isUpsert = existingFeedback && existingFeedback.user_rating === null && existingFeedback.cafe_rating === null;

                console.log("🎯 Upsert decision:", {
                  isUpsert,
                  reason: isUpsert ? "Found existing record with NULL ratings" : "No existing NULL record found"
                });

                setCurrentFeedbackMatch({
                  match_id: chat.match_id,
                  partner_name: partnerProfile.name || "Unknown",
                  coffeePlace: chat.meeting_location.split("|||")[0],
                  meeting_date: chat.meeting_date,
                  start_time: chat.start_time,
                  isUpsert: isUpsert,
                });
                setShowFeedbackModal(true);
              }}
              disabled={feedbackGiven.has(chat.match_id)}
            >
              <Text style={styles.actionButtonText}>
                {feedbackGiven.has(chat.match_id)
                  ? "Feedback Given"
                  : "Give Feedback"}
              </Text>
            </TouchableOpacity>
          )}
          {chat.user2_id === user.id && chat.status === "pending" && (
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
            </>
          )}
        </View>
      </View>
    );
  };

  const filterChatsByStatus = (status) => {
    return chats.filter((chat) => {
      if (status === "pending") {
        return chat.user1_id === user.id && chat.status === "pending";
      } else if (status === "pending_acceptance") {
        return chat.user2_id === user.id && chat.status === "pending";
      }
      return chat.status === status;
    });
  };

  const renderEmptyState = (title, description = null) => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="cafe-outline" size={64} color={colors.secondaryText} />
      <Text style={[styles.emptyStateText, { color: colors.text }]}>
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.emptyStateDescription,
            { color: colors.secondaryText },
          ]}
        >
          {description}
        </Text>
      )}
    </View>
  );

  useEffect(() => {
    if (initialFetchDone && chats.length === 0) {
      const delay = setTimeout(() => setIsExpired(true), 2000);
      return () => clearTimeout(delay);
    } else {
      setIsExpired(false);
    }
  }, [chats, initialFetchDone]);

  // Pre-filtered chat groups
  const confirmedChats = filterChatsByStatus("confirmed");
  const pastConfirmed = confirmedChats.filter(
    (chat) => new Date(chat.meeting_date) < new Date(),
  );
  const upcomingConfirmed = confirmedChats.filter(
    (chat) => new Date(chat.meeting_date) >= new Date(),
  );

  const pendingAcceptance = filterChatsByStatus("pending_acceptance").filter(
    (chat) => new Date(chat.meeting_date) >= new Date(),
  );

  const pending = filterChatsByStatus("pending").filter(
    (chat) => new Date(chat.meeting_date) >= new Date(),
  );

  const showEmptyState =
    (!showPastChats &&
      upcomingConfirmed.length === 0 &&
      pendingAcceptance.length === 0 &&
      pending.length === 0) ||
    (showPastChats && pastConfirmed.length === 0);

  useEffect(() => {
    if (user) {
      fetchChats();
      checkForFeedbackEligibility();
    }
  }, [user]);

  const checkForFeedbackEligibility = async () => {
    if (!user?.id) return;

    try {
      const eligibleMatches =
        await feedbackService.getEligibleMatchesForFeedback(user.id);

      if (eligibleMatches.length > 0) {
        // Filter out matches that we've already requested feedback for
        const newMatches = [];
        for (const match of eligibleMatches) {
          const alreadyRequested =
            await feedbackService.isFeedbackAlreadyRequested(match.match_id);
          if (!alreadyRequested) {
            newMatches.push(match);
          }
        }

        if (newMatches.length > 0) {
          setFeedbackQueue(newMatches);
          // Show feedback modal for the first match
          setCurrentFeedbackMatch(newMatches[0]);
          setShowFeedbackModal(true);
        }
      }
    } catch (error) {
      console.error("Error checking feedback eligibility:", error);
    }
  };

  const handleFeedbackSubmitSuccess = () => {
    // Add the current match to feedback given set
    if (currentFeedbackMatch) {
      setFeedbackGiven(
        (prev) => new Set([...prev, currentFeedbackMatch.match_id]),
      );
    }

    // Remove current match from queue
    const updatedQueue = feedbackQueue.slice(1);
    setFeedbackQueue(updatedQueue);

    // Show next feedback modal if there are more matches
    if (updatedQueue.length > 0) {
      setTimeout(() => {
        setCurrentFeedbackMatch(updatedQueue[0]);
        setShowFeedbackModal(true);
      }, 1000);
    } else {
      setCurrentFeedbackMatch(null);
    }
  };

  const handleFeedbackModalClose = () => {
    setShowFeedbackModal(false);

    // Show next feedback modal if there are more matches in queue
    const remainingQueue = feedbackQueue.slice(1);
    if (remainingQueue.length > 0) {
      setTimeout(() => {
        setCurrentFeedbackMatch(remainingQueue[0]);
        setShowFeedbackModal(true);

      }, 500);
    } else {
      setCurrentFeedbackMatch(null);
    }

    setFeedbackQueue(remainingQueue);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={styles.floatingCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedProfile && (
              <ScrollView style={{ flex: 1 }}>
                <View style={{ alignItems: "center" }}>
                  <ProfileCard
                    profile={{
                      ...selectedProfile,
                      photo: selectedProfile.photo_url,
                    }}
                    userId={selectedProfile.id}
                    isNewUser={false}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Toggle - UI TESTING */}

      <View style={styles.header}>
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>
            Past Chats
          </Text>
          <Switch
            value={showPastChats}
            onValueChange={setShowPastChats}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Empty states */}
      {initialFetchDone && !isLoading && showEmptyState
        ? renderEmptyState(
            showPastChats && pastConfirmed.length === 0
              ? "No past chats"
              : !showPastChats &&
                  upcomingConfirmed.length === 0 &&
                  pendingAcceptance.length === 0 &&
                  pending.length === 0
                ? "Chat's taking a coffee break"
                : null,
            showPastChats
              ? "Your past conversations will appear here"
              : "Start connecting to begin new coffee chats",
          )
        : null}

      {/* Confirmed chats */}
      {(showPastChats ? pastConfirmed : upcomingConfirmed).length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Confirmed Chats
          </Text>
          {(showPastChats ? pastConfirmed : upcomingConfirmed).map(
            renderChatCard,
          )}
        </View>
      )}

      {/* Pending Acceptance */}
      {!showPastChats && pendingAcceptance.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pending Acceptance
          </Text>
          {pendingAcceptance.map(renderChatCard)}
        </View>
      )}

      {/* Pending */}
      {!showPastChats && pending.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pending
          </Text>
          {pending.map(renderChatCard)}
        </View>
      )}

      {/* Feedback Modal */}
      {currentFeedbackMatch && (
        <FeedbackModal
          visible={showFeedbackModal}
          onClose={handleFeedbackModalClose}
          matchId={currentFeedbackMatch.match_id}
          partnerName={currentFeedbackMatch.partner_name}
          coffeePlace={currentFeedbackMatch.coffeePlace}
          onSubmitSuccess={handleFeedbackSubmitSuccess}
          isUpsert={currentFeedbackMatch.isUpsert}
        />
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateText: {
    fontFamily: "K2D-SemiBold",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    textAlign: "center",
  },
  container: { flex: 1 },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontFamily: "K2D-Bold", fontSize: 24 },
  toggleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: 16,
    overflow: "hidden",
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
  },
  closeButton: {
    padding: 8,
  },
  floatingCloseButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
});