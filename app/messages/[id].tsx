
import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Image } from 'react-native';

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
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'profile'
  
  const flatListRef = useRef<FlatList>(null);

  // Fetch messages and partner info
  useEffect(() => {
    if (!user?.id || !id) return;
    
    fetchChatDetails();
    
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => [...prev, newMsg]);
        
        // Mark as read if received by this user
        if (newMsg.receiver_id === user.id) {
          markMessageAsRead(newMsg.id);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [user, id]);

  const fetchChatDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch the partner profile from the matching table
      const { data: matchingData, error: matchingError } = await supabase
        .from('matching')
        .select('user1_id, user2_id')
        .eq('id', id)
        .single();
      
      if (matchingError) throw matchingError;
      
      // Determine the partner ID (the other user in the chat)
      const partnerId = matchingData.user1_id === user?.id ? matchingData.user2_id : matchingData.user1_id;
      
      // Fetch partner profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, photo_url')
        .eq('id', partnerId)
        .single();
        
      if (profileError) throw profileError;
      
      setPartner(profileData);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      setMessages(messagesData || []);
      
      // Mark all unread messages as read
      const unreadMessages = messagesData?.filter(
        msg => msg.receiver_id === user?.id && !msg.read
      ) || [];
      
      for (const msg of unreadMessages) {
        markMessageAsRead(msg.id);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !partner?.id || !id) return;
    
    try {
      setSending(true);
      
      const message = {
        chat_id: id,
        sender_id: user.id,
        receiver_id: partner.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false
      };
      
      const { error } = await supabase
        .from('messages')
        .insert([message]);
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.sender_id === user?.id;
    const showDate = index === 0 || 
      formatDate(messages[index - 1].created_at) !== formatDate(item.created_at);
    
    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, { color: colors.secondaryText }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageContainer, 
          isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
        ]}>
          <View style={[
            styles.messageBubble, 
            isCurrentUser 
              ? [styles.currentUserBubble, { backgroundColor: colors.primary }] 
              : [styles.otherUserBubble, { backgroundColor: colors.card }]
          ]}>
            <Text style={[
              styles.messageText, 
              { color: isCurrentUser ? '#ffffff' : colors.text }
            ]}>
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[
                styles.timeText, 
                { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.secondaryText }
              ]}>
                {formatTime(item.created_at)}
              </Text>
              {isCurrentUser && (
                <Text style={[
                  styles.statusText, 
                  { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.secondaryText }
                ]}>
                  {item.read ? 'Read' : 'Sent'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: 'Chats',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }} 
      />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {partner ? (
          <View style={styles.profileInfo}>
            <Image 
              source={{ uri: partner.photo_url || 'https://via.placeholder.com/100' }} 
              style={styles.profileImage} 
            />
            <Text style={[styles.profileName, { color: colors.text }]}>{partner.name || 'Chat Partner'}</Text>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.border }]} />
            <View style={[styles.profileNamePlaceholder, { backgroundColor: colors.border }]} />
          </View>
        )}
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'messages' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'messages' ? colors.primary : colors.secondaryText }
            ]}>
              Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'profile' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'profile' ? colors.primary : colors.secondaryText }
            ]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {activeTab === 'messages' ? (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => {
                  if (messages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }}
                onLayout={() => {
                  if (messages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }}
              />
            )}
            
            {/* Input Area */}
            <View style={[styles.inputArea, { borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
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
          </>
        ) : (
          <View style={styles.profileTab}>
            {partner ? (
              <View style={styles.profileDetails}>
                <Image 
                  source={{ uri: partner.photo_url || 'https://via.placeholder.com/200' }} 
                  style={styles.largeProfileImage} 
                />
                <Text style={[styles.largeName, { color: colors.text }]}>{partner.name || 'Chat Partner'}</Text>
                
                {/* Add more profile details here as needed */}
                <View style={[styles.profileSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>About</Text>
                  <Text style={[styles.sectionContent, { color: colors.text }]}>
                    No information available
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
  },
  profileNamePlaceholder: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'K2D-Medium',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'K2D-Regular',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  currentUserContainer: {
    alignSelf: 'flex-end',
  },
  otherUserContainer: {
    alignSelf: 'flex-start',
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
    fontFamily: 'K2D-Regular',
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontFamily: 'K2D-Regular',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'K2D-Regular',
    marginLeft: 5,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'K2D-Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTab: {
    flex: 1,
    padding: 20,
  },
  profileDetails: {
    alignItems: 'center',
  },
  largeProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  largeName: {
    fontSize: 22,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 5,
  },
  profileSection: {
    width: '100%',
    paddingTop: 15,
    marginTop: 20,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'K2D-Medium',
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    lineHeight: 22,
  },
});
