import React, { useState, useEffect } from "react";
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
import { router } from "expo-router";

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
  };
  unreadCount: number;
}

export default function ChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConfirmedChats();
    }
  }, [user]);

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
        setLoading(false);
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
      const mappedConversations = matchesData.map((match) => {
        const partnerId =
          match.user1_id === user.id ? match.user2_id : match.user1_id;
        const partnerProfile = profileMap[partnerId] || {};

        return {
          id: match.id,
          match_id: match.match_id || match.id,
          user: {
            id: partnerId,
            name: partnerProfile.name || "User",
            photo:
              partnerProfile.photo_url || "https://via.placeholder.com/100",
            occupation: partnerProfile.occupation || "Professional",
          },
          lastMessage: {
            text: match.initial_message || "Let's meet for coffee!",
            timestamp: formatDate(match.created_at || new Date().toISOString()),
            isRead: true,
          },
          unreadCount: 0,
        };
      });

      setConversations(mappedConversations);
    } catch (error) {
      console.error("Error in fetchConfirmedChats:", error);
    } finally {
      setLoading(false);
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
        {item.unreadCount > 0 && (
          <View
            style={[styles.badgeContainer, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.user.name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.secondaryText }]}>
            {item.lastMessage.timestamp}
          </Text>
        </View>

        <View style={styles.messagePreviewContainer}>
          <Text
            style={[
              styles.messagePreview,
              {
                color:
                  item.unreadCount > 0 ? colors.text : colors.secondaryText,
              },
              item.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage.text}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={64}
        color={colors.secondaryText}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {loading ? "Loading chats..." : "No confirmed chats yet"}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
        {loading
          ? "Please wait while we load your chats"
          : searchQuery
            ? "No matches found for your search"
            : "Confirm matches in Circle Chats to start conversations"}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
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
        </View>

        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.match_id || item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={
            filteredConversations.length === 0 ? { flex: 1 } : null
          }
          ListEmptyComponent={EmptyListComponent}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomWidth: 1,
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
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
    fontFamily: "K2D-Medium",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontFamily: "K2D-SemiBold",
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
    textAlign: "center",
  },
});
