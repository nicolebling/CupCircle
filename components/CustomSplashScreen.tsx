
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Show splash for 3 seconds then fade out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: colors.background, opacity: fadeAnim }
      ]}
    >
      <Text style={[styles.title, { color: colors.primary }]}>CupCircle</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  title: {
    fontSize: 38,
    fontFamily: 'K2D-Bold',
    textAlign: 'center',
  },
});
