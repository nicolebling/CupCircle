import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoadingLogoAnimation() {
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

    return () => {
      rotate1.stop();
      rotate2.stop();
      rotateAnim1.setValue(0);
      rotateAnim2.setValue(0);
    };
  }, [rotateAnim1, rotateAnim2]);

  const circle1Style = {
    transform: [
      { rotate: rotateAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        })
      },
      { translateY: -9 },
    ],
  };

  const circle2Style = {
    transform: [
      { rotate: rotateAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '540deg']
        })
      },
      { translateY: -9 },
    ],
  };

  return (
    <View style={styles.circleContainer}>
      <View style={styles.mainCircle} />
      <Animated.View style={[styles.smallCircle, circle1Style]} />
      <Animated.View style={[styles.smallCircle, circle2Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  circleContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F97415',
    position: 'absolute',
  },
  smallCircle: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#F97415',
    position: 'absolute',
  },
});