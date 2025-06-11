import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
  Stack,
  useNavigation,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { Image } from "react-native";
import ProfileCard from "@/components/ProfileCard";
import { cacheService } from "@/services/cacheService";
import LogoAnimation from "@/components/LogoAnimation";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
};

type Profile = {
  id: string;
  name?: string;
  photo_url?: string;
};

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partner, setPartner] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  //const [activeTab, setActiveTab] = useState("messages"); // 'messages' or 'profile' - Removed

  const flatListRef = useRef<FlatList>(null);

  // Fetch messages and partner info
  useEffect(() => {
    if (!user?.id || !id) return;

    fetchChatDetails();

    // Define partnerId variable in parent scope for subscription use
    let partnerId: string | null = null;

    // Get partner ID from matching table
    const getPartnerId = async () => {
      try {
        const { data, error } = await supabase
          .from("matching")
          .select("user1_id, user2_id")
          .eq("match_id", id)
          .single();

        if (error) throw error;

        partnerId = data.user1_id === user?.id ? data.user2_id : data.user1_id;
        console.log(
          "Subscribing to messages between",
          user.id,
          "and",
          partnerId,
        );

        // Set up subscription after we have partner ID
        setupMessageSubscription(partnerId);
      } catch (error) {
        console.error("Error getting partner ID:", error);
      }
    };

    getPartnerId();

    // Setup message subscription function
    const setupMessageSubscription = (partnerUserId: string) => {
      // Use unique channel name for each conversation
      const channelName = `messages_${user.id}_${partnerUserId}_${id}`;

      const messageSubscription = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message",
          },
          (payload) => {
            const newMsg = payload.new as Message;

            // Only add message if it belongs to this conversation
            if (
              (newMsg.sender_id === user.id &&
                newMsg.receiver_id === partnerUserId) ||
              (newMsg.sender_id === partnerUserId &&
                newMsg.receiver_id === user.id)
            ) {
              console.log("New message received:", newMsg);

              // Use functional update to ensure we don't miss any messages
              setMessages((prev) => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some((msg) => msg.id === newMsg.id);
                if (exists) return prev;
                return [...prev, newMsg];
              });

              // We don't automatically mark messages as read anymore
              // Messages will be marked as read when user views the chat

              // Scroll to bottom when new message arrives
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
            }
          },
        )
        .subscribe();

      // Store subscription for cleanup
      subscription = messageSubscription;
      return messageSubscription;
    };

    // Store subscription for cleanup
    let subscription: any = null;

    // Return cleanup function
    return () => {
      if (subscription) {
        console.log("Cleaning up subscription");
        supabase.removeChannel(subscription);
        subscription = null;
      }
    };
  }, [user, id]);

  const fetchChatDetails = async () => {
    try {
      setLoading(true);

      // Try to get cached messages first
      const cachedMessages = await cacheService.getCachedMessages(user?.id, id);
      if (cachedMessages) {
        setMessages(cachedMessages);
        setLoading(false);
      }

      // Fetch the partner profile from the matching table
      const { data: matchingData, error: matchingError } = await supabase
        .from("matching")
        .select("user1_id, user2_id, initial_message")
        .eq("match_id", id)
        .single();

      if (matchingError) throw matchingError;

      // Determine the partner ID (the other user in the chat)
      const partnerId =
        matchingData.user1_id === user?.id
          ? matchingData.user2_id
          : matchingData.user1_id;

      // Fetch basic partner profile info
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, photo_url")
        .eq("id", partnerId)
        .single();

      if (profileError) throw profileError;

      setPartner(profileData);

      // Fetch complete profile data for the partner
      const { data: fullProfileData, error: fullProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", partnerId)
        .single();

      if (fullProfileError) {
        console.error("Error fetching full profile:", fullProfileError);
      } else if (fullProfileData) {
        setPartnerProfile(fullProfileData);
      }

      // Fetch messages - first check if chat_id exists in table columns
      const { data: messagesData, error: messagesError } = await supabase
        .from("message")
        .select("*")
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Filter messages that belong to this conversation (between these two users)
      const filteredMessages =
        messagesData?.filter(
          (msg) =>
            (msg.sender_id === user?.id && msg.receiver_id === partnerId) ||
            (msg.sender_id === partnerId && msg.receiver_id === user?.id),
        ) || [];

      console.log(
        `Found ${filteredMessages.length} messages for this conversation`,
      );
      // If there's an initial message, add it to the beginning of the messages array
      const initialMessages = [...filteredMessages];
      if (matchingData.initial_message) {
        // Get the created_at timestamp from matching data
        const { data: timestampData } = await supabase
          .from("matching")
          .select("created_at")
          .eq("match_id", id)
          .single();

        initialMessages.unshift({
          id: `initial-${id}`,
          sender_id: matchingData.user1_id,
          receiver_id: matchingData.user2_id,
          content: matchingData.initial_message,
          created_at: timestampData?.created_at || new Date().toISOString(),
          read: true,
        });
      }
      setMessages(initialMessages);
      // We don't automatically mark messages as read when fetched
      // They'll be marked as read by the useEffect when viewed
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (chatId: number, setMessages: any) => {
    try {
      // First verify the message exists and needs updating
      const { data: checkData, error: checkError } = await supabase
        .from("message")
        .select("chat_id, read")
        .eq("chat_id", chatId)
        .single();

      if (checkError) {
        console.error("Error checking message status:", checkError);
        return;
      }

      if (!checkData || checkData.read) {
        // Message already read or doesn't exist
        return;
      }

      // Update the message as read
      const { data, error } = await supabase
        .from("message")
        .update({ read: true })
        .eq("chat_id", chatId)
        .select();

      if (error) {
        console.error("Error marking message as read:", error);
        return;
      }

      console.log(`Successfully marked message ${chatId} as read`, data);

      // Update local state to reflect the change
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.chat_id === chatId ? { ...msg, read: true } : msg,
        ),
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Effect to mark messages as read when they are viewed
  useEffect(() => {
    if (!user?.id || !id || !partner?.id || messages.length === 0) return;

    // Find all unread messages received by current user
    const unreadMessages = messages.filter(
      (msg) => msg.receiver_id === user.id && !msg.read,
    );

    // Mark all unread messages as read when the chat is viewed
    if (unreadMessages.length > 0) {
      console.log(`Marking ${unreadMessages.length} messages as read`);

      // Mark messages as read one by one
      const markMessagesAsRead = async () => {
        for (const msg of unreadMessages) {
          // Skip the initial message (it has a special ID format)
          if (msg.chat_id) {
            try {
              console.log(`Marking message ${msg.id} as read`);
              await markMessageAsRead(msg.chat_id, setMessages);
            } catch (error) {
              console.error(`Failed to mark message ${msg.id} as read:`, error);
            }
          }
        }
      };

      markMessagesAsRead();
    }
  }, [messages, user?.id, partner?.id]);

  // Add polling mechanism to fetch messages periodically as a fallback
  useEffect(() => {
    if (!user?.id || !id || !partner?.id) return;

    // Poll for new messages every 10 seconds as a fallback
    const pollingInterval = setInterval(() => {
      refreshMessages(partner.id);
    }, 10000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [user?.id, id, partner?.id]);

  // Function to refresh messages
  const refreshMessages = async (partnerId: string) => {
    try {
      if (!user?.id || !partnerId) return;

      // Get matching data for initial message
      const { data: matchingData } = await supabase
        .from("matching")
        .select("*")
        .eq("match_id", id)
        .single();

      const { data: messagesData, error: messagesError } = await supabase
        .from("message")
        .select("*")
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Filter messages that belong to this conversation
      const filteredMessages =
        messagesData?.filter(
          (msg) =>
            (msg.sender_id === user?.id && msg.receiver_id === partnerId) ||
            (msg.sender_id === partnerId && msg.receiver_id === user?.id),
        ) || [];

      // Add initial message if it exists
      const initialMessages = [...filteredMessages];
      if (matchingData?.initial_message) {
        initialMessages.unshift({
          id: `initial-${id}`,
          sender_id: matchingData.user1_id,
          receiver_id: matchingData.user2_id,
          content: matchingData.initial_message,
          created_at: matchingData.created_at,
          read: true,
        });
      }

      console.log(
        `Found ${initialMessages.length} messages, updating from polling`,
      );
      setMessages(initialMessages);

      // Mark unread messages as read
      filteredMessages
        .filter((msg) => msg.receiver_id === user?.id && !msg.read)
        .forEach((msg) => markMessageAsRead(msg.id));
    } catch (error) {
      console.error("Error refreshing messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !partner?.id || !id) return;

    try {
      setSending(true);

      // Create message object
      const message = {
        sender_id: user.id,
        receiver_id: partner.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false,
      };

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = { ...message, id: tempId };

      // Update UI immediately with optimistic message
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);

      // Clear input field immediately for better UX
      setNewMessage("");

      // Send the message to the database
      console.log("Sending message:", message);
      const { data, error } = await supabase
        .from("message")
        .insert([message])
        .select();

      if (error) {
        console.error("Error inserting message:", error);
        // Remove optimistic message on error
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== tempId),
        );
        throw error;
      }

      console.log("Message sent successfully:", data);

      // Replace optimistic message with actual message from server
      if (data && data.length > 0) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg.id === tempId ? data[0] : msg)),
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.sender_id === user?.id;
    const showDate =
      index === 0 ||
      formatDate(messages[index - 1].created_at) !==
        formatDate(item.created_at);

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, { color: colors.secondaryText }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isCurrentUser
              ? styles.currentUserContainer
              : styles.otherUserContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isCurrentUser
                ? [
                    styles.currentUserBubble,
                    { backgroundColor: colors.primary },
                  ]
                : [styles.otherUserBubble, { backgroundColor: colors.card }],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isCurrentUser ? "#ffffff" : colors.text },
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.timeText,
                  {
                    color: isCurrentUser
                      ? "rgba(255,255,255,0.7)"
                      : colors.secondaryText,
                  },
                ]}
              >
                {formatTime(item.created_at)}
              </Text>
              {isCurrentUser && (
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isCurrentUser
                        ? "rgba(255,255,255,0.7)"
                        : colors.secondaryText,
                    },
                  ]}
                >
                  {item.read ? "Read" : "Sent"}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          title: "",
          headerBackTitle: "Chats",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back("/(tabs)/chats")}
          style={{ marginLeft: 4 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {partner ? (
          <TouchableOpacity
            style={styles.profileInfo}
            onPress={() => {
              if (partnerProfile) {
                setShowProfileModal(true);
              }
            }}
          >
            <Image
              source={{
                uri:
                  partner.photo_url ||
                  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
              }}
              style={styles.profileImage}
            />
            <Text style={[styles.profileName, { color: colors.text }]}>
              {partner.name || "Chat Partner"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.profileInfo}>
            <View
              style={[
                styles.profileImagePlaceholder,
                { backgroundColor: colors.border },
              ]}
            />
            <View
              style={[
                styles.profileNamePlaceholder,
                { backgroundColor: colors.border },
              ]}
            />
          </View>
        )}
        {/*Removed Tab Container*/}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LogoAnimation size={120} />
          </View>
        ) : (
          <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) =>
                item.id || `msg-${item.created_at}-${item.sender_id}`
              }
              contentContainerStyle={styles.messagesList}
              initialScrollIndex={messages.length > 0 ? messages.length - 1 : 0}
              getItemLayout={(data, index) => ({
                length: 120, // Approximate height of each message
                offset: 120 * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                // Fallback to scrollToEnd if initialScrollIndex fails
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }, 100);
              }}
            />
        )}

        {/* Input Area */}
        <View style={[styles.inputArea, { borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.card },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={colors.secondaryText}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={sendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
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
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            {partnerProfile && (
              <ScrollView style={{ flex: 1 }}>
                <View style={{ alignItems: "center" }}>
                  <ProfileCard
                    profile={{
                      ...partnerProfile,
                      photo: partnerProfile.photo_url, // Map photo_url to photo for ProfileCard
                    }}
                    userId={partnerProfile.id}
                    isNewUser={false}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeButton: {
    padding: 8,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginLeft: 10,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "K2D-SemiBold",
  },
  profileNamePlaceholder: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "K2D-Regular",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  currentUserContainer: {
    alignSelf: "flex-end",
  },
  otherUserContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    minWidth: 60,
  },
  currentUserBubble: {
    borderTopRightRadius: 4,
  },
  otherUserBubble: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "K2D-Regular",
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    fontSize: 10,
    fontFamily: "K2D-Regular",
  },
  statusText: {
    fontSize: 10,
    fontFamily: "K2D-Regular",
    marginLeft: 5,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "K2D-Regular",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  //profileTab: { Removed
  //  flex: 1,
  //  padding: 20,
  //},
  profileDetails: {
    alignItems: "center",
  },
  largeProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  largeName: {
    fontSize: 22,
    fontFamily: "K2D-SemiBold",
    marginBottom: 5,
  },
  profileSection: {
    width: "100%",
    paddingTop: 15,
    marginTop: 20,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "K2D-Medium",
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    lineHeight: 22,
  },
  floatingCloseButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
});