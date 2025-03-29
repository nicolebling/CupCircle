
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const getCoffeeColor = (level: string): string => {
  switch (level) {
    case 'Student': return '#E6C8A0'; // Warm milk
    case 'Internship': return '#D2B48C'; // Latte
    case 'Entry': return '#C19A6B'; // Light roast
    case 'Junior': return '#A67B5B'; // Medium roast
    case 'Senior': return '#654321'; // Dark roast
    case 'Director': return '#483C32'; // Nitro cold brew
    case 'Executive': return '#301E1E'; // Espresso
    default: return '#F97415';
  }
};

type Props = {
  photoUrl?: string;
  experienceLevel?: string;
  size?: number;
};

export default function AnimatedProfilePhoto({ photoUrl, experienceLevel, size = 120 }: Props) {
  const rotation = new Animated.Value(0);

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: 360,
            duration: 8000,
            useNativeDriver: true,
          })
        ])
      ).start();
    };
    animate();
  }, []);

  const borderColor = getCoffeeColor(experienceLevel || '');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.rotatingBorder,
          {
            width: size,
            height: size,
            borderColor,
            transform: [{
              rotate: rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })
            }]
          }
        ]}
      />
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={[styles.image, { width: size - 8, height: size - 8 }]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size - 8, height: size - 8 }]}>
          <Ionicons name="person" size={size/2} color="#ffffff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatingBorder: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  image: {
    borderRadius: 1000,
  },
  placeholder: {
    backgroundColor: '#1A1A1A',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
