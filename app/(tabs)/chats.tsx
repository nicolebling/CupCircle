import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Dummy message interface
interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
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
      lastMessage: 'Looking forward to our coffee chat tomorrow!',
      timestamp: '10:30 AM',
      unread: true,
    },
    {
      id: '2',
      sender: {
        id: 'user2',
        name: 'Sophia Wang',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      lastMessage: 'That cafe on Main St sounds perfect. See you at 2pm?',
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
      lastMessage: 'Thanks for the advice on that project!',
      timestamp: 'Yesterday',
      unread: false,
    },
    {
      id: '4',
      sender: {
        id: 'user4',
        name: 'Jasmine Rodriguez',
        avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
      },
      lastMessage: 'I can share some insights about digital marketing over coffee',
      timestamp: 'Mon',
      unread: true,
    },
    {
      id: '5',
      sender: {
        id: 'user5',
        name: 'David Chen',
        avatar: 'https://randomuser.me/api/portraits/men/94.jpg',
      },
      lastMessage: 'Let me know if you want to discuss data science further',
      timestamp: 'Sun',
      unread: false,
    },
  ]);

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      style={[styles.messageItem, { borderBottomColor: colors.border }]}
      onPress={() => console.log('Message pressed:', item.id)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
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
            { color: item.unread ? colors.text : colors.secondaryText, fontFamily: item.unread ? 'K2D-Medium' : 'K2D-Regular' },
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
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
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
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
  },
  newMessageButton: {
    padding: 8,
  },
  subtitle: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  messagesList: {
    paddingBottom: 20,
  },
  messageItem: {
    flexDirection: 'row',
    paddingVertical: 16,
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
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  timestamp: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
  },
  messageText: {
    fontFamily: 'K2D-Regular',
    fontSize: 15,
  },
  unreadText: {
    fontFamily: 'K2D-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});