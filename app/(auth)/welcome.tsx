
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { PagerView } from 'react-native-pager-view';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    headline: "What is CupCircle?",
    subheadline: "Your local coffee club",
    description: "Connect with local professionals for real, in person conversations, right in your neighborhood.",
    image: require('@/assets/images/onboarding/onboarding-1.png'),
  },
  {
    id: 2,
    headline: "How does it work?",
    subheadline: "Meet in 3 easy brews",
    description: "Build your profile, pick your favorite cafes, share when you're available, and we'll do the rest.",
    image: require('@/assets/images/onboarding/onboarding-2.png'),
  },
  {
    id: 3,
    headline: "The Circle awaits.",
    subheadline: "Grow. Learn. Latte.",
    description: "Swap stories, learn something new, explore your neighborhood, one cup at a time.",
    image: require('@/assets/images/onboarding/onboarding-3.png'),
  },
];

export default function WelcomeScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const colors = Colors.light;

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      pagerRef.current?.setPage(nextPage);
      setCurrentPage(nextPage);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/auth');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(auth)/auth');
    }
  };

  const handlePageChange = (event: any) => {
    setCurrentPage(event.nativeEvent.position);
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentPage ? colors.primary : '#E0E0E0',
                width: index === currentPage ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderOnboardingItem = ({ item }: { item: typeof onboardingData[0] }) => (
    <View style={styles.onboardingItem}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.onboardingImage} resizeMode="contain" />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.headline, { color: colors.text }]}>{item.headline}</Text>
        <Text style={[styles.subheadline, { color: colors.primary }]}>{item.subheadline}</Text>
        <Text style={[styles.description, { color: colors.secondaryText }]}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Skip Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.secondaryText }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* PagerView for onboarding screens */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {onboardingData.map((item) => (
          <View key={item.id} style={styles.page}>
            {renderOnboardingItem({ item })}
          </View>
        ))}
      </PagerView>

      {/* Pagination Dots */}
      {renderPaginationDots()}

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons 
            name={currentPage === onboardingData.length - 1 ? 'arrow-forward' : 'chevron-forward'} 
            size={20} 
            color="white" 
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  onboardingItem: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  onboardingImage: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
  textContainer: {
    flex: 0.4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'K2D-Bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 38,
  },
  subheadline: {
    fontSize: 20,
    fontFamily: 'K2D-SemiBold',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },
  description: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
  },
  nextButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
    color: 'white',
  },
  buttonIcon: {
    marginLeft: 4,
  },
});
