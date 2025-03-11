
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface MessageSender {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  id: string;
  sender: MessageSender;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export default function ChatsScreen() {
  const colors = Colors.light;
  
  // Dummy messages data
  const [messages] = useState<Message[]>([
    {
      id: '1',
      sender: {
        id: 'user1',
        name: 'Alex Thompson',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
      lastMessage: 'Great meeting you yesterday! Looking forward to our next coffee chat.',
      timestamp: '2:30 PM',
      unread: true,
    },
    {
      id: '2',
      sender: {
        id: 'user2',
        name: 'Sophia Wang',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      lastMessage: 'Let me know if Monday works for you. Coffee Bean on 5th Ave?',
      timestamp: 'Yesterday',
      unread: false,
    },
    {
      id: '3',
      sender: {
        id: 'user3',
        name: 'Marcus Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      },
      lastMessage: 'Thanks for the design feedback! Would love to discuss more.',
      timestamp: 'Yesterday',
      unread: true,
    },
    {
      id: '4',
      sender: {
        id: 'user4',
        name: 'Jasmine Rodriguez',
        avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
      },
      lastMessage: 'I just sent you the marketing materials we discussed.',
      timestamp: 'Monday',
      unread: false,
    },
    {
      id: '5',
      sender: {
        id: 'user5',
        name: 'David Chen',
        avatar: 'https://randomuser.me/api/portraits/men/94.jpg',
      },
      lastMessage: 'Are we still on for Wednesday at The Roastery?',
      timestamp: 'Last week',
      unread: false,
    },
  ]);

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      style={[styles.messageItem, { borderBottomColor: colors.border }]}
      onPress={() => console.log("Message pressed:", item.id)}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: item.sender.avatar }} 
          style={styles.avatar}
        />
        {item.unread && <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />}
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.senderName, { color: colors.text, fontFamily: 'K2D-SemiBold' }]}>{item.sender.name}</Text>
          <Text style={[styles.timestamp, { color: colors.secondaryText, fontFamily: 'K2D-Regular' }]}>{item.timestamp}</Text>
        </View>
        <Text 
          style={[
            styles.messageText, 
            { 
              color: item.unread ? colors.text : colors.secondaryText, 
              fontFamily: item.unread ? 'K2D-Medium' : 'K2D-Regular'
            },
            item.unread && styles.unreadText
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'K2D-Bold' }]}>Messages</Text>
          <TouchableOpacity style={styles.newMessageButton}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.secondaryText, fontFamily: 'K2D-Regular' }]}>
          Connect with your coffee chat partners
        </Text>
      </View>
      
      {messages.length > 0 ? (
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.text, fontFamily: 'K2D-SemiBold' }]}>No messages yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.secondaryText, fontFamily: 'K2D-Regular' }]}>
            Start matching with professionals to begin conversations
          </Text>
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
    padding: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
  },
  newMessageButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    right: 0,
    top: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
