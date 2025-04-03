
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LogoAnimation() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate1 = Animated.loop(
      Animated.timing(rotateAnim1, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const rotate2 = Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotate1.start();
    rotate2.start();
  }, [rotateAnim1, rotateAnim2]);

  const circle1Style = {
    transform: [
      { rotate: rotateAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        })
      },
      { translateY: -16 },
    ],
  };

  const circle2Style = {
    transform: [
      { rotate: rotateAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '540deg']
        })
      },
      { translateY: -16 },
    ],
  };

  return (
  <View style={styles.container}>
    <View style={styles.circleContainer}>
      <View style={styles.mainCircle} />
      <Animated.View style={[styles.smallCircle, circle1Style]} />
      <Animated.View style={[styles.smallCircle, circle2Style]} />
    </View>
    <Text style={[styles.title, { color: colors.text }]}>CupCircle</Text>
    <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Where every cup connects</Text>
  </View>
)
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F97415',
    position: 'absolute',
  },
  smallCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97415',
    position: 'absolute',
  },
  title: {
    fontSize: 32,
    fontFamily: 'K2D-Bold',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});
