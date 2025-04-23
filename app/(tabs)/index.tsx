
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Switch } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for testing
const MOCK_CHATS = [
  {
    id: '1',
    partner: {
      name: 'Alex Thompson',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      occupation: 'Software Engineer'
    },
    status: 'confirmed',
    meetingDate: '2024-03-25',
    meetingTime: '10:00 AM',
    location: 'Blue Bottle Coffee, Downtown',
    initialMessage: "Hi! I'd love to discuss tech innovations over coffee.",
  },
  {
    id: '2',
    partner: {
      name: 'Sarah Chen',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      occupation: 'Product Manager'
    },
    status: 'pending_acceptance',
    meetingDate: '2024-03-26',
    meetingTime: '2:00 PM',
    location: 'Starbucks Reserve, Financial District',
    initialMessage: "Would love to chat about product management practices!",
  },
  {
    id: '3',
    partner: {
      name: 'Mike Rogers',
      photo: 'https://randomuser.me/api/portraits/men/67.jpg',
      occupation: 'UX Designer'
    },
    status: 'pending',
    meetingDate: '2024-03-27',
    meetingTime: '3:30 PM',
    location: 'Philz Coffee, Mission District',
    initialMessage: "Let's discuss design systems and coffee!",
  }
];

export default function CircleChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [showPastChats, setShowPastChats] = useState(false);

  const handleAction = (chatId: string, action: 'accept' | 'cancel' | 'message') => {
    console.log(`${action} chat ${chatId}`);
    // Implement action handlers
  };

  const renderChatCard = (chat: typeof MOCK_CHATS[0]) => {
    const isExpired = new Date(chat.meetingDate) < new Date();
    if (isExpired && !showPastChats) return null;

    return (
      <View key={chat.id} style={[styles.chatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chatHeader}>
          <View style={styles.profileSection}>
            <Image source={{ uri: chat.partner.photo }} style={styles.profilePhoto} />
            <View style={styles.profileInfo}>
              <Text style={[styles.partnerName, { color: colors.text }]}>{chat.partner.name}</Text>
              <Text style={[styles.occupation, { color: colors.secondaryText }]}>{chat.partner.occupation}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getBadgeColor(chat.status, colors) }]}>
            <Text style={styles.statusText}>{getStatusText(chat.status)}</Text>
          </View>
        </View>

        <View style={styles.meetingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={colors.secondaryText} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {chat.meetingDate} at {chat.meetingTime}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={colors.secondaryText} />
            <Text style={[styles.detailText, { color: colors.text }]}>{chat.location}</Text>
          </View>
        </View>

        {chat.initialMessage && (
          <Text style={[styles.message, { color: colors.secondaryText }]}>
            "{chat.initialMessage}"
          </Text>
        )}

        <View style={styles.actions}>
          {chat.status === 'pending_acceptance' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAction(chat.id, 'accept')}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleAction(chat.id, 'cancel')}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          {chat.status === 'confirmed' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAction(chat.id, 'message')}
              >
                <Text style={styles.actionButtonText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleAction(chat.id, 'cancel')}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const filterChatsByStatus = (status: string) => 
    MOCK_CHATS.filter(chat => chat.status === status);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Circle Chats</Text>
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>Show Past Chats</Text>
          <Switch
            value={showPastChats}
            onValueChange={setShowPastChats}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Confirmed Chats</Text>
        {filterChatsByStatus('confirmed').map(renderChatCard)}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Acceptance</Text>
        {filterChatsByStatus('pending_acceptance').map(renderChatCard)}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Chats</Text>
        {filterChatsByStatus('pending').map(renderChatCard)}
      </View>
    </ScrollView>
  );
}

const getBadgeColor = (status: string, colors: any) => {
  switch (status) {
    case 'confirmed': return colors.primary + '40';
    case 'pending': return colors.secondaryText + '40';
    case 'pending_acceptance': return '#F97415' + '40';
    default: return colors.border;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Confirmed';
    case 'pending': return 'Pending';
    case 'pending_acceptance': return 'Action Needed';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 8,
    fontFamily: 'K2D-Regular',
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  chatCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileInfo: {
    marginLeft: 12,
  },
  partnerName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  occupation: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
    color: '#000000',
  },
  meetingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    marginLeft: 8,
  },
  message: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
});
