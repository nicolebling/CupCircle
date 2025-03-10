
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, FlatList, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

type Chat = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
};

export default function ChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      lastMessage: 'Looking forward to our coffee meetup tomorrow!',
      time: '10:30 AM',
      unread: 2,
    },
    {
      id: '2',
      name: 'Michael Chang',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      lastMessage: 'Thanks for the advice on transitioning to product management.',
      time: 'Yesterday',
      unread: 0,
    },
    {
      id: '3',
      name: 'Emily Williams',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      lastMessage: 'I'll bring my portfolio to discuss during our meeting.',
      time: 'Yesterday',
      unread: 0,
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      avatar: 'https://randomuser.me/api/portraits/men/62.jpg',
      lastMessage: 'Do you prefer Blue Bottle or Philz Coffee?',
      time: 'May 12',
      unread: 0,
    },
    {
      id: '5',
      name: 'Jessica Chen',
      avatar: 'https://randomuser.me/api/portraits/women/11.jpg',
      lastMessage: 'I'm sending over those UX resources we discussed.',
      time: 'May 10',
      unread: 0,
    },
  ]);

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity style={[styles.chatItem, { borderBottomColor: colors.border }]}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.unread > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.unread}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.time, { color: colors.secondaryText }]}>{item.time}</Text>
        </View>
        
        <Text 
          style={[
            styles.message, 
            { color: item.unread > 0 ? colors.text : colors.secondaryText },
            item.unread > 0 && styles.unreadMessage
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search messages"
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>
      
      {filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            {searchQuery.length > 0 
              ? 'No chats match your search'
              : 'No messages yet'
            }
          </Text>
          {searchQuery.length === 0 && (
            <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.startButtonText}>Find Coffee Partners</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  chatList: {
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'K2D-Bold',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  time: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  message: {
    fontSize: 15,
    fontFamily: 'K2D-Regular',
  },
  unreadMessage: {
    fontFamily: 'K2D-SemiBold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
});
