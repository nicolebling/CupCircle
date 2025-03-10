import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

//This HomeScreen is removed because it is a duplicate and the edited code provides a replacement.
//export default function HomeScreen() {
//  return (
//    <ParallaxScrollView
//      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//      headerImage={
//        <Image
//          source={require('@/assets/images/partial-react-logo.png')}
//          style={styles.reactLogo}
//        />
//      }>
//      <ThemedView style={styles.titleContainer}>
//        <ThemedText type="title">Welcome to Expo on Replit!</ThemedText>
//        <HelloWave />
//      </ThemedView>
//      <ThemedView style={styles.stepContainer}>
//        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//        <ThemedText>
//          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
//          Press{' '}
//          <ThemedText type="defaultSemiBold">
//            {Platform.select({
//              ios: 'cmd + d',
//              android: 'cmd + m',
//              web: 'F12'
//            })}
//          </ThemedText>{' '}
//          to open developer tools.
//        </ThemedText>
//      </ThemedView>
//      <ThemedView style={styles.stepContainer}>
//        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//        <ThemedText>
//          Tap the Explore tab to learn more about what's included in this starter app.
//        </ThemedText>
//      </ThemedView>
//      <ThemedView style={styles.stepContainer}>
//        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//        <ThemedText>
//          When you're ready, run{' '}
//          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
//          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
//          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//        </ThemedText>
//      </ThemedView>
//    </ParallaxScrollView>
//  );
//}

//This HomeScreen is removed because it is a duplicate and the edited code provides a replacement.
//const styles = StyleSheet.create({
//  titleContainer: {
//    flexDirection: 'row',
//    alignItems: 'center',
//    gap: 8,
//  },
//  stepContainer: {
//    gap: 8,
//    marginBottom: 8,
//  },
//  reactLogo: {
//    height: 178,
//    width: 290,
//    bottom: 0,
//    left: 0,
//    position: 'absolute',
//  },
//});

import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
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
    <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <Text style={[styles.welcomeText, {color: colors.text}]}>
          Welcome back, {user ? user.displayName || 'User' : 'Guest'}
        </Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Upcoming Meetings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>Upcoming Coffee Chats</Text>
        {upcomingMeetings.length > 0 ? (
          upcomingMeetings.map(meeting => (
            <View key={meeting.id} style={[styles.meetingCard, {backgroundColor: colors.card}]}>
              <Image source={{uri: meeting.photo}} style={styles.profileImage} />
              <View style={styles.meetingInfo}>
                <Text style={[styles.name, {color: colors.text}]}>{meeting.name}</Text>
                <Text style={[styles.occupation, {color: colors.text}]}>{meeting.occupation}</Text>
                <View style={styles.meetingDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[styles.detailText, {color: colors.text}]}>{meeting.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={colors.primary} />
                    <Text style={[styles.detailText, {color: colors.text}]}>{meeting.location}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, {color: colors.textDim}]}>No upcoming meetings</Text>
        )}
      </View>

      {/* Pending Requests Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>Pending Requests</Text>
        {pendingRequests.length > 0 ? (
          pendingRequests.map(request => (
            <View key={request.id} style={[styles.requestCard, {backgroundColor: colors.card}]}>
              <Image source={{uri: request.photo}} style={styles.profileImage} />
              <View style={styles.requestInfo}>
                <Text style={[styles.name, {color: colors.text}]}>{request.name}</Text>
                <Text style={[styles.occupation, {color: colors.text}]}>{request.occupation}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.acceptButton]}>
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.declineButton]}>
                  <Text style={[styles.actionButtonText, {color: colors.text}]}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, {color: colors.textDim}]}>No pending requests</Text>
        )}
      </View>

      {/* Find New Connections Section */}
      <TouchableOpacity 
        style={[styles.findConnectionsButton, {backgroundColor: colors.primary}]}
        onPress={() => {/* Navigate to matching screen */}}
      >
        <Text style={styles.findConnectionsText}>Find New Connections</Text>
        <Ionicons name="people" size={20} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 22,
    fontFamily: 'K2D-SemiBold',
  },
  notificationButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 12,
  },
  meetingCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  meetingInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  occupation: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'K2D-Regular',
  },
  meetingDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  requestInfo: {
    marginLeft: 16,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'K2D-Medium',
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  findConnectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  findConnectionsText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
});