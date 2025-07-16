import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoadingLogoAnimation() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
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

    if (isMounted.current) {
      rotate1.start();
      rotate2.start();
    }

    return () => {
      isMounted.current = false;
      rotate1.stop();
      rotate2.stop();
      
      // Clear any pending animations and reset values
      rotateAnim1.stopAnimation(() => {
        rotateAnim1.setValue(0);
      });
      rotateAnim2.stopAnimation(() => {
        rotateAnim2.setValue(0);
      });
    };
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
    <View style={styles.circleContainer}>
      <View style={styles.mainCircle} />
      <Animated.View style={[styles.smallCircle, circle1Style]} />
      <Animated.View style={[styles.smallCircle, circle2Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});