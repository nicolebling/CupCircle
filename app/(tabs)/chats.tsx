import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, SafeAreaView,  KeyboardAvoidingView, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

// Mock conversation data
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    user: {
      id: '101',
      name: 'Alex Thompson',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      occupation: 'Software Engineer'
    },
    lastMessage: {
      text: 'Looking forward to our coffee chat tomorrow!',
      timestamp: '09:45 AM',
      isRead: true
    },
    unreadCount: 0
  },
  {
    id: '2',
    user: {
      id: '102',
      name: 'Sophia Wang',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      occupation: 'UX/UI Designer'
    },
    lastMessage: {
      text: 'Do you have any recommendations for cafes downtown?',
      timestamp: 'Yesterday',
      isRead: false
    },
    unreadCount: 2
  },
  {
    id: '3',
    user: {
      id: '103',
      name: 'Marcus Johnson',
      photo: 'https://randomuser.me/api/portraits/men/67.jpg',
      occupation: 'Product Manager'
    },
    lastMessage: {
      text: 'Thanks for the advice! It was really helpful.',
      timestamp: 'Apr 12',
      isRead: true
    },
    unreadCount: 0
  },
];

export default function ChatsScreen() {
  const colors = Colors.light;
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [filteredConversations, setFilteredConversations] = useState(conversations);

  useEffect(() => {
    // Filter conversations based on search query
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv => 
        conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const renderConversationItem = ({ item }: { item: typeof MOCK_CONVERSATIONS[0] }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, { borderBottomColor: colors.border }]}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.user.photo }} style={styles.avatar} />
        {item.unreadCount > 0 && (
          <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.user.name}</Text>
          <Text style={[styles.timestamp, { color: colors.secondaryText }]}>
            {item.lastMessage.timestamp}
          </Text>
        </View>

        <View style={styles.messagePreviewContainer}>
          <Text 
            style={[
              styles.messagePreview, 
              { color: item.unreadCount > 0 ? colors.text : colors.secondaryText },
              item.unreadCount > 0 && styles.unreadMessage
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
      <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.secondaryText} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
        {searchQuery ? 'No matches found for your search' : 'Start matching with professionals to begin chatting'}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={item => item.id}
        renderItem={renderConversationItem}
        contentContainerStyle={filteredConversations.length === 0 ? { flex: 1 } : null}
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
    fontFamily: 'K2D-Bold',
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'K2D-Bold',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  timestamp: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagePreview: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontFamily: 'K2D-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});