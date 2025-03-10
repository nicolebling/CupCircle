import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Expo on Replit!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Mock data
  const upcomingMeetings = [
    {
      id: '1',
      name: 'Sarah Johnson',
      occupation: 'UX Designer',
      date: 'Today, 3:00 PM',
      location: 'Starbucks, Downtown',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: '2',
      name: 'David Chen',
      occupation: 'Product Manager',
      date: 'Tomorrow, 10:00 AM',
      location: 'Coffee Bean, Tech Park',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
  ];

  const pendingRequests = [
    {
      id: '3',
      name: 'Michael Rodriguez',
      occupation: 'Software Engineer',
      photo: 'https://randomuser.me/api/portraits/men/67.jpg',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Good morning, {user?.name?.split(' ')[0] || 'User'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Start connecting over coffee today
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profileCompletionHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Complete Your Profile</Text>
          <Text style={[styles.completionPercentage, { color: colors.primary }]}>60%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { backgroundColor: colors.border }
            ]}
          >
            <View 
              style={[
                styles.progressFill, 
                { backgroundColor: colors.primary, width: '60%' }
              ]} 
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.completionItem, { borderColor: colors.border }]}
        >
          <View style={[styles.checkCircle, { borderColor: colors.border }]}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.completionText, { color: colors.secondaryText }]}>
            Add profile picture
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.completionItem, { borderColor: colors.border }]}
        >
          <View style={[styles.checkCircle, { borderColor: colors.primary, backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.completionText, { color: colors.text }]}>
            Add work experience
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.completionItem}>
          <View style={[styles.checkCircle, { borderColor: colors.primary, backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.completionText, { color: colors.text }]}>
            Set your availability
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Coffee Chats</Text>
        
        {upcomingMeetings.length > 0 ? (
          upcomingMeetings.map(meeting => (
            <View 
              key={meeting.id}
              style={[styles.meetingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Image source={{ uri: meeting.photo }} style={styles.avatar} />
              
              <View style={styles.meetingInfo}>
                <Text style={[styles.meetingName, { color: colors.text }]}>{meeting.name}</Text>
                <Text style={[styles.meetingOccupation, { color: colors.secondaryText }]}>
                  {meeting.occupation}
                </Text>
                
                <View style={styles.meetingDetails}>
                  <View style={styles.meetingDetailItem}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={[styles.meetingDetailText, { color: colors.secondaryText }]}>
                      {meeting.date}
                    </Text>
                  </View>
                  
                  <View style={styles.meetingDetailItem}>
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                    <Text style={[styles.meetingDetailText, { color: colors.secondaryText }]}>
                      {meeting.location}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity style={styles.meetingAction}>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No upcoming meetings. Start matching with professionals!
          </Text>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Requests</Text>
        
        {pendingRequests.length > 0 ? (
          pendingRequests.map(request => (
            <View 
              key={request.id}
              style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Image source={{ uri: request.photo }} style={styles.avatar} />
              
              <View style={styles.requestInfo}>
                <Text style={[styles.requestName, { color: colors.text }]}>{request.name}</Text>
                <Text style={[styles.requestOccupation, { color: colors.secondaryText }]}>
                  {request.occupation}
                </Text>
              </View>
              
              <View style={styles.requestActions}>
                <TouchableOpacity 
                  style={[
                    styles.requestButton, 
                    styles.declineButton, 
                    { borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.declineButtonText, { color: colors.secondaryText }]}>
                    Decline
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.requestButton, 
                    styles.acceptButton, 
                    { backgroundColor: colors.primary }
                  ]}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No pending requests at the moment.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  profileCompletionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
  },
  completionPercentage: {
    fontFamily: 'K2D-Bold',
    fontSize: 18,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completionText: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  meetingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  meetingName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  meetingOccupation: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  meetingDetails: {
    flexDirection: 'column',
  },
  meetingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  meetingDetailText: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
    marginLeft: 4,
  },
  meetingAction: {
    padding: 8,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
  requestOccupation: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {
  },
  declineButtonText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
  },
  acceptButtonText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});
