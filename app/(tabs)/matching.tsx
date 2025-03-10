
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import ProfileCard from '@/components/ProfileCard';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Define the profile type for better type checking
interface Profile {
  id: string;
  name: string;
  age?: number;
  photo: string;
  occupation: string;
  location?: string;
  experience: string;
  bio: string;
  interests: string[];
  favoriteCafes?: string[];
  neighborhoods?: string[];
  matchedCafe?: boolean;
}

export default function MatchingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Mock profiles data
  const [profiles] = useState<Profile[]>([
    {
      id: '1',
      name: 'Alex Thompson',
      age: 28,
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      occupation: 'Software Engineer',
      location: 'Downtown',
      experience: '5 years at Google, 2 years at StartupXYZ',
      bio: 'Passionate about building scalable web applications and mentoring junior developers. Looking to expand my network in the tech community.',
      interests: ['React', 'Node.js', 'Cloud Architecture', 'Mentoring'],
      favoriteCafes: ['Coffee House', 'Bean There'],
      neighborhoods: ['Downtown', 'Tech District'],
      matchedCafe: true,
    },
    {
      id: '2',
      name: 'Sophia Wang',
      age: 31,
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      occupation: 'UX/UI Designer',
      location: 'Arts District',
      experience: '4 years at Design Studio, 3 years freelancing',
      bio: 'Creative designer with a strong focus on user-centered design. I enjoy collaborating with developers and product teams to create intuitive experiences.',
      interests: ['User Research', 'Wireframing', 'Figma', 'Design Systems'],
      favoriteCafes: ['The Roastery', 'Morning Brew'],
      neighborhoods: ['Arts District', 'Midtown'],
      matchedCafe: false,
    },
    {
      id: '3',
      name: 'Marcus Johnson',
      age: 35,
      photo: 'https://randomuser.me/api/portraits/men/67.jpg',
      occupation: 'Product Manager',
      location: 'Financial District',
      experience: '7 years in product management across fintech and e-commerce',
      bio: 'Strategic product manager with experience taking products from concept to market. Looking to connect with engineers and designers.',
      interests: ['Agile', 'Product Strategy', 'Market Research', 'FinTech'],
      favoriteCafes: ['Coffee House', 'Finance Cafe'],
      neighborhoods: ['Financial District', 'Downtown'],
      matchedCafe: true,
    },
  ]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matchAnimation, setMatchAnimation] = useState(false);
  
  // Animation values
  const cardOffset = useSharedValue(0);
  const cardRotate = useSharedValue(0);
  
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: cardOffset.value },
        { rotate: `${cardRotate.value}deg` }
      ]
    };
  });
  
  const handleLike = () => {
    // Animate card off-screen to the right
    cardOffset.value = withSpring(500);
    cardRotate.value = withSpring(20);
    
    // Here you would typically send a like request to your backend
    console.log(`Liked ${profiles[currentIndex].name}`);
    
    // Show match animation randomly (simulate mutual match)
    if (Math.random() > 0.7) {
      setTimeout(() => {
        setMatchAnimation(true);
        setTimeout(() => setMatchAnimation(false), 3000);
      }, 500);
    }
    
    // Small delay before moving to next profile
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Reset animation values
        cardOffset.value = 0;
        cardRotate.value = 0;
      }
    }, 300);
  };
  
  const handleSkip = () => {
    // Animate card off-screen to the left
    cardOffset.value = withSpring(-500);
    cardRotate.value = withSpring(-20);
    
    console.log(`Skipped ${profiles[currentIndex].name}`);
    
    // Small delay before moving to next profile
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Reset animation values
        cardOffset.value = 0;
        cardRotate.value = 0;
      }
    }, 300);
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const openFilterModal = () => {
    setFilterModalVisible(true);
  };
  
  const applyFilters = () => {
    setIsLoading(true);
    setFilterModalVisible(false);
    
    // Simulate API call for new profiles based on filters
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Explore Your Circle</Text>
          <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
            <Ionicons name="options" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Discover professionals for your next coffee chat
        </Text>
      </View>
      
      <View style={styles.cardsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Finding perfect matches...</Text>
          </View>
        ) : currentIndex < profiles.length ? (
          <>
            <Animated.View style={[styles.animatedCardContainer, cardAnimatedStyle]}>
              <ProfileCard
                profile={profiles[currentIndex]}
                onLike={handleLike}
                onSkip={handleSkip}
              />
            </Animated.View>
            
            <View style={styles.navigationControls}>
              <TouchableOpacity 
                onPress={handlePrevious} 
                style={[
                  styles.navButton, 
                  { backgroundColor: colors.card, opacity: currentIndex > 0 ? 1 : 0.5 }
                ]}
                disabled={currentIndex === 0}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={[styles.navButtonText, { color: colors.primary }]}>Previous</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {}} 
                style={[styles.navButton, { backgroundColor: colors.card }]}
              >
                <Ionicons name="person" size={20} color={colors.primary} />
                <Text style={[styles.navButtonText, { color: colors.primary }]}>View Details</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={[styles.noMoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="cafe" size={48} color={colors.primary} />
            <Text style={[styles.noMoreText, { color: colors.text }]}>
              No more profiles to show
            </Text>
            <Text style={[styles.checkBackText, { color: colors.secondaryText }]}>
              Adjust your filters or check back later for more connections!
            </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={openFilterModal}
            >
              <Text style={styles.refreshButtonText}>Adjust Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Matches</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Industry</Text>
              <View style={styles.filterOptions}>
                {['Technology', 'Design', 'Finance', 'Marketing', 'Education'].map((industry) => (
                  <TouchableOpacity 
                    key={industry} 
                    style={[
                      styles.filterChip, 
                      { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                  >
                    <Text style={[styles.filterChipText, { color: colors.text }]}>{industry}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.filterLabel, { color: colors.text }]}>Experience Level</Text>
              <View style={styles.filterOptions}>
                {['Entry', 'Mid-Level', 'Senior', 'Executive'].map((level) => (
                  <TouchableOpacity 
                    key={level} 
                    style={[
                      styles.filterChip, 
                      { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                  >
                    <Text style={[styles.filterChipText, { color: colors.text }]}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.filterLabel, { color: colors.text }]}>Neighborhoods</Text>
              <View style={styles.filterOptions}>
                {['Downtown', 'Midtown', 'Financial District', 'Tech District', 'Arts District'].map((neighborhood) => (
                  <TouchableOpacity 
                    key={neighborhood} 
                    style={[
                      styles.filterChip, 
                      { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                  >
                    <Text style={[styles.filterChipText, { color: colors.text }]}>{neighborhood}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.filterLabel, { color: colors.text }]}>Favorite Cafés</Text>
              <View style={styles.filterOptions}>
                {['Coffee House', 'The Roastery', 'Bean There', 'Morning Brew', 'Finance Cafe'].map((cafe) => (
                  <TouchableOpacity 
                    key={cafe} 
                    style={[
                      styles.filterChip, 
                      { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                  >
                    <Text style={[styles.filterChipText, { color: colors.text }]}>{cafe}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.clearButton, { borderColor: colors.border }]} 
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={{ color: colors.text }}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton, { backgroundColor: colors.primary }]} 
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Match Animation Modal */}
      <Modal
        visible={matchAnimation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.matchModalOverlay}>
          <View style={styles.matchModalContent}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {currentIndex < profiles.length ? profiles[currentIndex].name : ''} have agreed to connect
            </Text>
            <TouchableOpacity 
              style={styles.sendMessageButton}
              onPress={() => setMatchAnimation(false)}
            >
              <Text style={styles.sendMessageText}>Send a Message</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => setMatchAnimation(false)}
            >
              <Text style={styles.continueText}>Continue Exploring</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterButton: {
    padding: 8,
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
  animatedCardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  navButtonText: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  noMoreCard: {
    width: '90%',
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noMoreText: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkBackText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'K2D-Bold',
    fontSize: 20,
  },
  modalBody: {
    flex: 1,
  },
  filterLabel: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  applyButton: {
    marginLeft: 8,
  },
  applyButtonText: {
    color: 'white',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  matchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
  },
  matchTitle: {
    fontFamily: 'K2D-Bold',
    fontSize: 28,
    color: '#1E1916',
    marginTop: 20,
    marginBottom: 10,
  },
  matchSubtitle: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  sendMessageButton: {
    backgroundColor: '#F97415',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  sendMessageText: {
    color: 'white',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  continueButton: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    color: '#666',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
});
