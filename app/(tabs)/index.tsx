
import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [upcomingMeetings, setUpcomingMeetings] = useState([
    { id: 1, name: 'Sarah Johnson', position: 'UX Designer', company: 'Design Co', date: 'Today, 2:00 PM', location: 'Coffee Bean', distance: '0.5 miles' },
    { id: 2, name: 'Michael Chang', position: 'Software Engineer', company: 'Tech Solutions', date: 'Tomorrow, 10:00 AM', location: 'Starbucks', distance: '1.2 miles' },
  ]);

  const suggestedConnections = [
    { id: 1, name: 'Emily Williams', position: 'Product Manager', company: 'InnoTech', mutualConnections: 3, photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 2, name: 'David Lee', position: 'Frontend Developer', company: 'WebCore', mutualConnections: 2, photo: 'https://randomuser.me/api/portraits/men/42.jpg' },
    { id: 3, name: 'Jessica Chen', position: 'UI/UX Designer', company: 'Creative Minds', mutualConnections: 1, photo: 'https://randomuser.me/api/portraits/women/11.jpg' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>Hello, {user?.name || 'Guest'}</Text>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </View>
        </View>

        <View style={[styles.upcomingSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Coffee Meetings</Text>

          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(meeting => (
              <View key={meeting.id} style={[styles.meetingCard, { borderColor: colors.border }]}>
                <View style={styles.meetingHeader}>
                  <Image 
                    source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                    style={styles.profileImage} 
                  />
                  <View style={styles.meetingInfo}>
                    <Text style={[styles.personName, { color: colors.text }]}>{meeting.name}</Text>
                    <Text style={[styles.position, { color: colors.secondaryText }]}>{meeting.position} at {meeting.company}</Text>
                  </View>
                </View>

                <View style={styles.meetingDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.secondaryText }]}>{meeting.date}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.secondaryText }]}>{meeting.location} ({meeting.distance})</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.messageButton}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                    <Text style={[styles.buttonText, { color: colors.primary }]}>Message</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.rescheduleButton, { backgroundColor: colors.primary }]}>
                    <Text style={styles.rescheduleText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.secondaryText} />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No upcoming meetings</Text>
              <TouchableOpacity style={[styles.findButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.findButtonText}>Find Coffee Partners</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.suggestedSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Connections</Text>
          
          {suggestedConnections.map(connection => (
            <View key={connection.id} style={[styles.connectionCard, { borderColor: colors.border }]}>
              <Image 
                source={{ uri: connection.photo }} 
                style={styles.profileImage} 
              />
              <View style={styles.connectionInfo}>
                <Text style={[styles.personName, { color: colors.text }]}>{connection.name}</Text>
                <Text style={[styles.position, { color: colors.secondaryText }]}>{connection.position} at {connection.company}</Text>
                <Text style={[styles.mutualConnections, { color: colors.secondaryText }]}>
                  {connection.mutualConnections} mutual connection{connection.mutualConnections !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity style={[styles.connectButton, { borderColor: colors.primary }]}>
                <Text style={[styles.connectText, { color: colors.primary }]}>Connect</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={[styles.viewMoreText, { color: colors.primary }]}>View More</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.tipsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Networking Tips</Text>
          
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={24} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Prepare 2-3 specific questions for your upcoming coffee meeting with Sarah Johnson.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Arrive 5 minutes early to secure a good spot and settle in before your meeting.
            </Text>
          </View>
          
          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={[styles.viewMoreText, { color: colors.primary }]}>More Tips</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 16,
  },
  meetingCard: {
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  meetingHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  meetingInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  personName: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 4,
  },
  position: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  meetingDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  buttonText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  rescheduleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rescheduleText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'K2D-Medium',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginTop: 12,
    marginBottom: 24,
  },
  findButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findButtonText: {
    color: 'white',
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  suggestedSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mutualConnections: {
    fontSize: 12,
    fontFamily: 'K2D-Regular',
    marginTop: 4,
  },
  connectButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  connectText: {
    fontSize: 14,
    fontFamily: 'K2D-Medium',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  tipsSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'K2D-Regular',
    lineHeight: 20,
  },
});
