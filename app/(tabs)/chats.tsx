import React, { useState } from 'react';
import { Text, View, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  sender: string;
  time: string;
  unread: boolean;
}

interface Conversation {
  id: string;
  person: {
    id: string;
    name: string;
    photo: string;
    occupation: string;
  };
  lastMessage: Message;
  matched: boolean;
}

export default function ChatsScreen() {
  const colors = Colors.light;

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      person: {
        id: '1',
        name: 'Alex Thompson',
        photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        occupation: 'Software Engineer',
      },
      lastMessage: {
        id: '101',
        text: 'Great meeting you today! Looking forward to our next coffee chat.',
        sender: 'Alex',
        time: '10:30 AM',
        unread: true,
      },
      matched: true,
    },
    {
      id: '2',
      person: {
        id: '2',
        name: 'Sophia Wang',
        photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        occupation: 'UX/UI Designer',
      },
      lastMessage: {
        id: '102',
        text: 'I\'d love to hear more about your experience at Design Studio.',
        sender: 'You',
        time: 'Yesterday',
        unread: false,
      },
      matched: true,
    },
    {
      id: '3',
      person: {
        id: '3',
        name: 'Marcus Johnson',
        photo: 'https://randomuser.me/api/portraits/men/67.jpg',
        occupation: 'Product Manager',
      },
      lastMessage: {
        id: '103',
        text: 'Would Thursday at 3pm at Coffee House work for you?',
        sender: 'Marcus',
        time: '2 days ago',
        unread: true,
      },
      matched: true,
    },
    {
      id: '4',
      person: {
        id: '4',
        name: 'Jasmine Rodriguez',
        photo: 'https://randomuser.me/api/portraits/women/29.jpg',
        occupation: 'Marketing Specialist',
      },
      lastMessage: {
        id: '104',
        text: 'Just sent you the marketing resources we discussed. Hope they help!',
        sender: 'Jasmine',
        time: '1 week ago',
        unread: false,
      },
      matched: true,
    },
    {
      id: '5',
      person: {
        id: '5',
        name: 'David Chen',
        photo: 'https://randomuser.me/api/portraits/men/94.jpg',
        occupation: 'Data Scientist',
      },
      lastMessage: {
        id: '105',
        text: 'You: Thanks for the coffee chat! I learned a lot about machine learning applications.',
        sender: 'You',
        time: '2 weeks ago',
        unread: false,
      },
      matched: true,
    },
  ]);

  const handleMessagePress = (id: string) => {
    console.log('Message pressed:', id);

    // Mark as read
    setConversations(
      conversations.map(conv => 
        conv.id === id && conv.lastMessage.unread 
          ? { ...conv, lastMessage: { ...conv.lastMessage, unread: false } } 
          : conv
      )
    );
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        { borderBottomColor: colors.border }
      ]}
      onPress={() => handleMessagePress(item.id)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.person.photo }} style={styles.avatar} />
        {item.lastMessage.unread && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.personName, { color: colors.text, fontFamily: 'K2D-SemiBold' }]}>
            {item.person.name}
          </Text>
          <Text style={[styles.messageTime, { color: colors.secondaryText, fontFamily: 'K2D-Regular' }]}>
            {item.lastMessage.time}
          </Text>
        </View>

        <Text style={[styles.occupation, { color: colors.secondaryText, fontFamily: 'K2D-Regular' }]}>
          {item.person.occupation}
        </Text>

        <Text 
          style={[
            styles.messagePreview, 
            { 
              color: item.lastMessage.unread ? colors.text : colors.secondaryText,
              fontFamily: item.lastMessage.unread ? 'K2D-Medium' : 'K2D-Regular'
            }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.lastMessage.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'K2D-Bold' }]}>Messages</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.secondaryText, fontFamily: 'K2D-Regular' }]}>
          Connect with your professional network
        </Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
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
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  filterButton: {
    padding: 8,
  },
  conversationItem: {
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
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
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
  personName: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
  },
  occupation: {
    fontSize: 14,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
  },
});