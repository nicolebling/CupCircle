
import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, FlatList, Image, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Types for our chat data
interface Chat {
  id: string;
  name: string;
  photo: string;
  occupation: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isOnline: boolean;
}

// Types for our messages
interface Message {
  id: string;
  text: string;
  sent: boolean;
  timestamp: string;
}

export default function ChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      photo: 'https://randomuser.me/api/portraits/women/32.jpg',
      occupation: 'UX Designer',
      lastMessage: 'Looking forward to our coffee chat tomorrow!',
      timestamp: '10:30 AM',
      unread: 2,
      isOnline: true,
    },
    {
      id: '2',
      name: 'David Chen',
      photo: 'https://randomuser.me/api/portraits/men/44.jpg',
      occupation: 'Software Engineer',
      lastMessage: 'That cafe you recommended was great. We should meet there again.',
      timestamp: 'Yesterday',
      unread: 0,
      isOnline: false,
    },
    {
      id: '3',
      name: 'Olivia Rodriguez',
      photo: 'https://randomuser.me/api/portraits/women/67.jpg',
      occupation: 'Marketing Specialist',
      lastMessage: 'I sent you the marketing plan we discussed during our coffee chat.',
      timestamp: 'Yesterday',
      unread: 1,
      isOnline: true,
    },
    {
      id: '4',
      name: 'Michael Taylor',
      photo: 'https://randomuser.me/api/portraits/men/29.jpg',
      occupation: 'Product Manager',
      lastMessage: 'Can we reschedule our coffee chat to next week?',
      timestamp: 'Monday',
      unread: 0,
      isOnline: false,
    },
    {
      id: '5',
      name: 'Emily Wilson',
      photo: 'https://randomuser.me/api/portraits/women/94.jpg',
      occupation: 'Data Scientist',
      lastMessage: 'Thanks for the insights during our chat. Very helpful!',
      timestamp: 'Aug 15',
      unread: 0,
      isOnline: false,
    },
    {
      id: '6',
      name: 'James Brown',
      photo: 'https://randomuser.me/api/portraits/men/63.jpg',
      occupation: 'Startup Founder',
      lastMessage: 'Let me know when you're free for another coffee chat!',
      timestamp: 'Aug 10',
      unread: 0,
      isOnline: true,
    },
  ]);
  
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<{[key: string]: Message[]}>({
    '1': [
      { id: '1-1', text: 'Hi Sarah, looking forward to our coffee chat tomorrow!', sent: true, timestamp: '10:30 AM' },
      { id: '1-2', text: 'Me too! Should we meet at Coffee House downtown?', sent: false, timestamp: '10:35 AM' },
      { id: '1-3', text: 'Perfect! See you there at 2 PM.', sent: true, timestamp: '10:36 AM' },
      { id: '1-4', text: 'Great! Looking forward to discussing UX trends.', sent: false, timestamp: '10:40 AM' },
    ],
    '2': [
      { id: '2-1', text: 'Hey David, have you tried that new cafe on Main Street?', sent: true, timestamp: 'Yesterday 2:15 PM' },
      { id: '2-2', text: 'Yes, I went there last week. The cold brew is amazing!', sent: false, timestamp: 'Yesterday 2:30 PM' },
      { id: '2-3', text: 'We should meet there next time!', sent: true, timestamp: 'Yesterday 2:32 PM' },
    ],
    '3': [
      { id: '3-1', text: 'I just emailed you the marketing plan. Let me know what you think!', sent: false, timestamp: 'Yesterday 4:20 PM' },
      { id: '3-2', text: 'Thanks, Olivia! I\'ll take a look at it tonight.', sent: true, timestamp: 'Yesterday 4:45 PM' },
    ],
  });
  
  const [newMessage, setNewMessage] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const handleChatPress = (chatId: string) => {
    setActiveChat(chatId);
    
    // Mark messages as read when opening a chat
    setChats(prev => 
      prev.map(chat => {
        if (chat.id === chatId) {
          return {...chat, unread: 0};
        }
        return chat;
      })
    );
  };
  
  const handleBackToList = () => {
    setActiveChat(null);
  };
  
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !activeChat) return;
    
    const messageId = `${activeChat}-${Date.now()}`;
    const timestamp = 'Just now';
    
    // Add new message to current chat
    setMessages(prev => ({
      ...prev,
      [activeChat]: [
        ...(prev[activeChat] || []),
        {
          id: messageId,
          text: newMessage,
          sent: true,
          timestamp
        }
      ]
    }));
    
    // Update last message in chat list
    setChats(prev => 
      prev.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            lastMessage: newMessage,
            timestamp
          };
        }
        return chat;
      })
    );
    
    // Clear input
    setNewMessage('');
    
    // Simulate response (for demo purposes)
    if (Math.random() > 0.3) {
      setTimeout(() => {
        const responseText = [
          "Thanks for your message! I'll get back to you soon.",
          "That sounds great!",
          "I appreciate your input on this.",
          "When would be a good time to meet again?",
          "Let me check my calendar and get back to you.",
        ][Math.floor(Math.random() * 5)];
        
        setMessages(prev => ({
          ...prev,
          [activeChat]: [
            ...(prev[activeChat] || []),
            {
              id: `${activeChat}-${Date.now()}`,
              text: responseText,
              sent: false,
              timestamp: 'Just now'
            }
          ]
        }));
        
        setChats(prev => 
          prev.map(chat => {
            if (chat.id === activeChat) {
              return {
                ...chat,
                lastMessage: responseText,
                timestamp: 'Just now',
              };
            }
            return chat;
          })
        );
      }, 1500 + Math.random() * 1500);
    }
  };
  
  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={[
        styles.chatItem,
        { backgroundColor: item.unread > 0 ? colors.highlight : colors.card }
      ]}
      onPress={() => handleChatPress(item.id)}
    >
      <View style={styles.photoContainer}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.secondaryText }]}>
            {item.timestamp}
          </Text>
        </View>
        
        <Text style={[styles.occupation, { color: colors.secondaryText }]} numberOfLines={1}>
          {item.occupation}
        </Text>
        
        <View style={styles.lastMessageContainer}>
          <Text style={[styles.lastMessage, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles" size={60} color={colors.secondaryText} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
      <Text style={[styles.emptyMessage, { color: colors.secondaryText }]}>
        Match with professionals to start chatting
      </Text>
      <TouchableOpacity 
        style={[styles.matchButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.matchButtonText}>Find Matches</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {!activeChat ? (
        // Chat list view
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
          </View>
          
          <View style={[styles.searchContainer, { 
            backgroundColor: colors.card,
            borderColor: isSearchFocused ? colors.primary : colors.border
          }]}>
            <Ionicons name="search" size={20} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search messages..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>
          
          {filteredChats.length > 0 ? (
            <FlatList
              data={filteredChats}
              renderItem={renderChatItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatList}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: colors.secondaryText }]}>
                No chats found matching "{searchQuery}"
              </Text>
            </View>
          )}
        </>
      ) : (
        // Individual chat view
        <>
          <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToList}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            
            {chats.filter(chat => chat.id === activeChat).map(chat => (
              <View key={chat.id} style={styles.activeChatInfo}>
                <View style={styles.photoNameContainer}>
                  <Image source={{ uri: chat.photo }} style={styles.activeChatAvatar} />
                  <View style={styles.activeChatTextContainer}>
                    <Text style={[styles.activeChatName, { color: colors.text }]}>
                      {chat.name}
                    </Text>
                    <Text style={[styles.activeChatStatus, { color: colors.secondaryText }]}>
                      {chat.isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.infoButton}>
                  <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {messages[activeChat]?.map(message => (
              <View 
                key={message.id} 
                style={[
                  styles.messageContainer,
                  message.sent ? styles.sentMessageContainer : styles.receivedMessageContainer
                ]}
              >
                <View 
                  style={[
                    styles.messageBubble,
                    message.sent 
                      ? [styles.sentMessageBubble, { backgroundColor: colors.primary }]
                      : [styles.receivedMessageBubble, { backgroundColor: colors.card, borderColor: colors.border }]
                  ]}
                >
                  <Text 
                    style={[
                      styles.messageText, 
                      { color: message.sent ? 'white' : colors.text }
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
                <Text 
                  style={[
                    styles.messageTimestamp, 
                    { color: colors.secondaryText }
                  ]}
                >
                  {message.timestamp}
                </Text>
              </View>
            ))}
            
            {!messages[activeChat]?.length && (
              <View style={styles.noMessagesContainer}>
                <Text style={[styles.noMessagesText, { color: colors.secondaryText }]}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            )}
          </ScrollView>
          
          <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.messageInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.secondaryText}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSendMessage}
              disabled={newMessage.trim() === ''}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
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
    fontSize: 28,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 40,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  chatList: {
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chatName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  timestamp: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
  },
  occupation: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'K2D-SemiBold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noResultsText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    textAlign: 'center',
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
  },
  emptyMessage: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  matchButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  matchButtonText: {
    color: 'white',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  backButton: {
    padding: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  activeChatInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeChatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  activeChatTextContainer: {
    justifyContent: 'center',
  },
  activeChatName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  activeChatStatus: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
  },
  infoButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sentMessageBubble: {
    borderBottomRightRadius: 4,
  },
  receivedMessageBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  messageTimestamp: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  noMessagesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noMessagesText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
