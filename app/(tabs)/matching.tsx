
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import ProfileCard from '@/components/ProfileCard';

export default function MatchingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Mock profiles data
  const [profiles] = useState([
    {
      id: '1',
      name: 'Alex Thompson',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      occupation: 'Software Engineer',
      experience: '5 years at Google, 2 years at StartupXYZ',
      bio: 'Passionate about building scalable web applications and mentoring junior developers. Looking to expand my network in the tech community.',
      interests: ['React', 'Node.js', 'Cloud Architecture', 'Mentoring'],
    },
    {
      id: '2',
      name: 'Sophia Wang',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      occupation: 'UX/UI Designer',
      experience: '4 years at Design Studio, 3 years freelancing',
      bio: 'Creative designer with a strong focus on user-centered design. I enjoy collaborating with developers and product teams to create intuitive experiences.',
      interests: ['User Research', 'Wireframing', 'Figma', 'Design Systems'],
    },
    {
      id: '3',
      name: 'Marcus Johnson',
      photo: 'https://randomuser.me/api/portraits/men/67.jpg',
      occupation: 'Product Manager',
      experience: '7 years in product management across fintech and e-commerce',
      bio: 'Strategic product manager with experience taking products from concept to market. Looking to connect with engineers and designers.',
      interests: ['Agile', 'Product Strategy', 'Market Research', 'FinTech'],
    },
  ]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleLike = () => {
    // Here you would typically send a like request to your backend
    console.log(`Liked ${profiles[currentIndex].name}`);
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleSkip = () => {
    console.log(`Skipped ${profiles[currentIndex].name}`);
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Find Connections</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Discover professionals for your next coffee chat
        </Text>
      </View>
      
      <View style={styles.cardsContainer}>
        {currentIndex < profiles.length ? (
          <ProfileCard
            profile={profiles[currentIndex]}
            onLike={handleLike}
            onSkip={handleSkip}
          />
        ) : (
          <View style={[styles.noMoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noMoreText, { color: colors.text }]}>
              No more profiles to show at the moment.
            </Text>
            <Text style={[styles.checkBackText, { color: colors.secondaryText }]}>
              Check back later for more connections!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMoreCard: {
    width: '90%',
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noMoreText: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  checkBackText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
