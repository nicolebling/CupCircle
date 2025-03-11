import { Image, StyleSheet, Platform, SafeAreaView } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>Hello, {user?.displayName || 'Guest'}</Text>
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedScroll}>
            {[1, 2, 3, 4].map(id => (
              <View key={id} style={[styles.suggestedCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Image 
                  source={{ uri: `https://randomuser.me/api/portraits/${id % 2 === 0 ? 'women' : 'men'}/${id * 10}.jpg` }} 
                  style={styles.suggestedImage} 
                />
                <Text style={[styles.suggestedName, { color: colors.text }]}>Jane Doe</Text>
                <Text style={[styles.suggestedPosition, { color: colors.secondaryText }]}>Product Manager</Text>
                <Text style={[styles.suggestedCompany, { color: colors.secondaryText }]}>Tech Inc.</Text>
                <TouchableOpacity style={[styles.connectButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.connectText}>Connect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
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
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
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
    fontFamily: 'Arial, sans-serif',
    fontWeight: '600',
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
    fontFamily: 'Arial, sans-serif',
    fontWeight: '600',
    marginBottom: 4,
  },
  position: {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
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
    fontFamily: 'Arial, sans-serif',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
  },
  rescheduleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  rescheduleText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 16,
  },
  findButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  findButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    fontWeight: '600',
  },
  suggestedSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  suggestedScroll: {
    paddingVertical: 8,
  },
  suggestedCard: {
    width: 160,
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  suggestedImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  suggestedName: {
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  suggestedPosition: {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },
  suggestedCompany: {
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    marginBottom: 12,
    textAlign: 'center',
  },
  connectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  connectText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
  },
});
