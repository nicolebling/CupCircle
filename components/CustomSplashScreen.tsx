
import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // Show splash for 3 seconds then disappear immediately
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: '#ffffff' }
      ]}
    >
      <Text style={[styles.title, { color: colors.primary }]}>CupCircle</Text>
    </View>
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
