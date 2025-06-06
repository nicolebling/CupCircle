import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabase } from "@/lib/supabase";
import { router, useRouter, useNavigation } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from "react-native-reanimated";
import SkeletonLoader from "@/components/SkeletonLoader";

interface Conversation {
  id: string;
  match_id: string;
  user: {
    id: string;
    name: string;
    photo: string;
    occupation: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isRead: boolean;
    isRead: boolean;
  };
  unreadCount: number;
}

const MessageBadge = ({ count }: { count: number }) => {
  const colors = Colors[useColorScheme()];
  if (count === 0) return null;

  return (
    <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
};

export default function ChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    if (user) {
      fetchConfirmedChats();
    }
  }, [user]);

  // Add focus event listener to refresh chats when returning to the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (user) {
        fetchConfirmedChats();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  useEffect(() => {
    // Filter conversations based on search query
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((conv) =>
        conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const fetchConfirmedChats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Fetch all confirmed matches with the current user
      const { data: matchesData, error: matchesError } = await supabase
        .from("matching")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "confirmed");

      if (matchesError) {
        console.error("Error fetching confirmed matches:", matchesError);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        setLoading(false);
        // Trigger animation even when empty
        opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
        translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
        return;
      }

      // Get all user IDs that we need profile data for
      const userIds = new Set<string>();
      matchesData.forEach((match) => {
        if (match.user1_id === user.id) {
          userIds.add(match.user2_id);
        } else {
          userIds.add(match.user1_id);
        }
      });

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // Map profiles to a dictionary for easy lookup
      const profileMap: Record<string, any> = {};
      profilesData.forEach((profile) => {
        profileMap[profile.id] = profile;
      });

      // Build conversation objects

      const mappedConversations = await Promise.all(
        matchesData.map(async (match) => {
          const partnerId =
            match.user1_id === user.id ? match.user2_id : match.user1_id;
          const partnerProfile = profileMap[partnerId] || {};

          // Fetch last message for this chat
          const { data: lastMessageData } = await supabase
            .from("message")
            .select("*")
            .or(
              `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
            )
            .order("created_at", { ascending: false })
            .limit(1);

          // Count unread messages for this conversation
          const { data: unreadMessages, error: unreadError } = await supabase
            .from("message")
            .select("chat_id")
            .eq("receiver_id", user.id)
            .eq("sender_id", partnerId)
            .eq("read", false);

          const unreadCount = unreadMessages?.length || 0;

          if (unreadError) {
            console.error("Error fetching unread count:", unreadError);
          }

          const lastMessage = lastMessageData?.[0];

          return {
            id: match.id,
            match_id: match.match_id || match.id,
            user: {
              id: partnerId,
              name: partnerProfile.name || "User",
              photo:
                partnerProfile.photo_url ||
                "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
              occupation: partnerProfile.occupation || "Professional",
            },
            lastMessage: {
              text: lastMessage ? lastMessage.content : match.initial_message,
              timestamp:
                (lastMessage ? lastMessage.created_at : match.created_at) ||
                new Date().toISOString(),
              displayTimestamp: formatDate(
                (lastMessage ? lastMessage.created_at : match.created_at) ||
                  new Date().toISOString(),
              ),
              isRead: lastMessage ? lastMessage.read : true,
              receiverId: lastMessage ? lastMessage.receiver_id : null,
            },
            unreadCount: unreadCount,
          };
        }),
      );

      // Sort conversations by latest message timestamp
      const sortedConversations = mappedConversations.sort((a, b) => {
        const timestampA = new Date(a.lastMessage.timestamp).getTime();
        const timestampB = new Date(b.lastMessage.timestamp).getTime();
        return timestampB - timestampA; // Most recent first
      });

      // Update global unread count
      const totalUnread = sortedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      global.unreadMessageCount = totalUnread;

      setConversations(sortedConversations);

      // Trigger smooth fade-in animation
      opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    } catch (error) {
      console.error("Error in fetchConfirmedChats:", error);
      setConversations([]);
      setFilteredConversations([]);
      setLoading(false);
      // Still show animation even on error
      opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    } finally {
      // Small delay to ensure smooth transition
      setTimeout(() => setLoading(false), 200);
    }
  };

  // Format ISO date to a more readable format
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();

    // If it's today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If it's this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    // Otherwise show full date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/messages/${item.match_id}`)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.user.photo }} style={styles.avatar} />
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.user.name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.secondaryText }]}>
            {item.lastMessage.displayTimestamp}
          </Text>
        </View>

        <View style={styles.messagePreviewContainer}>
          <View style={styles.messageContainer}>
            <Text
              style={[
                styles.messagePreview,
                {
                  color:
                    item.unreadCount > 0 ? colors.text : colors.secondaryText,
                  // Only use bold font when message is unread AND user is the receiver
                  fontFamily: 
                    !item.lastMessage.isRead && user?.id === item.lastMessage.receiverId
                      ? "K2D-Bold"
                      : "K2D-Regular",
                },
              ]}
              numberOfLines={1}
            >
              {item.lastMessage.text}
            </Text>
            {item.unreadCount > 0 && (
              <MessageBadge count={item.unreadCount} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const SkeletonChatItem = () => (
    <View style={[styles.conversationItem, { borderBottomColor: colors.border }]} >
      <View style={styles.avatarContainer}>
        <SkeletonLoader width={54} height={54} borderRadius={27} />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width={60} height={12} />
        </View>
        <View style={styles.messagePreviewContainer}>
          <SkeletonLoader width="80%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color={colors.secondaryText}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
        {searchQuery
          ? "No matches found for your search"
          : "Confirm a Coffee Chat in Circle Chats to begin chatting"}
      </Text>
    </View>
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Search conversations implementation - Future implementation */}

        {/* <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.secondaryText}
              />
            </TouchableOpacity>
          )}
        </View> */}

        {loading ? (
          <View style={{ flex: 1 }}>
            {/* Show 3-4 skeleton chat items while loading */}
            <SkeletonChatItem />
            <SkeletonChatItem />
            <SkeletonChatItem />
            <SkeletonChatItem />
          </View>
        ) : (
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.match_id || item.id}
              renderItem={renderConversationItem}
              contentContainerStyle={
                filteredConversations.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : { paddingBottom: 20 }
              }
              ListEmptyComponent={EmptyListComponent}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timestampContainer: {
    alignItems: "center",
  },
  badgeContainer: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginTop: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontFamily: "K2D-Bold",
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "K2D-Bold",
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: "K2D-Regular",
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 0.5,

  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  badgeContainer: {
    position: "absolute",
    top: 0,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontFamily: "K2D-Bold",
  },
  conversationContent: {
    flex: 1,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontFamily: "K2D-SemiBold",
    fontSize: 16,
  },
  timestamp: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
  },
  messagePreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  messagePreview: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontFamily: "K2D-Bold",
    fontWeight: "900",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontFamily: "K2D-SemiBold",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});