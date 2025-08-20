
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Image,
  PanGestureHandler,
  State,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface OnboardingData {
  id: number;
  headline: string;
  subheadline: string;
  description: string;
  image: any;
}

const onboardingData: OnboardingData[] = [
  {
    id: 1,
    headline: "What is CupCircle?",
    subheadline: "Your local coffee club",
    description: "Connect with local professionals for real, in person conversations, right in your neighborhood.",
    image: require('@/assets/images/onboarding-1.png'),
  },
  {
    id: 2,
    headline: "How does it work?",
    subheadline: "Meet in 3 easy brews",
    description: "Build your profile, pick your favorite cafes, share when you're available, and we'll do the rest.",
    image: require('@/assets/images/onboarding-2.png'),
  },
  {
    id: 3,
    headline: "The Circle awaits.",
    subheadline: "Grow. Learn. Latte.",
    description: "Swap stories, learn something new, explore your neighborhood, one cup at a time.",
    image: require('@/assets/images/onboarding-3.png'),
  },
];

interface OnboardingScreensProps {
  onComplete: () => void;
}

export default function OnboardingScreens({ onComplete }: OnboardingScreensProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const colors = Colors.light;

  useEffect(() => {
    // Animate in content when screen changes
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Reset animations for next screen
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Reset animations for previous screen
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
    }
  };

  const currentScreen = onboardingData[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.secondaryText }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Image Container */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <Image 
            source={currentScreen.image} 
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Container */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.headline, { color: colors.text }]}>
            {currentScreen.headline}
          </Text>
          <Text style={[styles.subheadline, { color: colors.primary }]}>
            {currentScreen.subheadline}
          </Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {currentScreen.description}
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {/* Page Indicators */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  width: index === currentIndex ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity 
              style={[styles.backButton, { borderColor: colors.border }]} 
              onPress={handlePrevious}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>
                Back
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.nextButton, 
              { 
                backgroundColor: colors.primary,
                flex: currentIndex === 0 ? 1 : 0.6,
              }
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentIndex === onboardingData.length - 1 ? "rocket" : "chevron-forward"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: width * 0.7,
    height: width * 0.5,
    maxWidth: 300,
    maxHeight: 220,
  },
  textContainer: {
    flex: 0.4,
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
    marginBottom: 16,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: 'all 0.3s ease',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
    flex: 0.4,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    color: 'white',
  },
});
