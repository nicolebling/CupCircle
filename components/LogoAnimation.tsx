import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LogoAnimationProps {
  showText?: boolean;
  size?: number;
  showSubtitle?: boolean;
}

export default function LogoAnimation({ showText = false, size = 96, showSubtitle = false }: LogoAnimationProps) {
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
      rotateAnim1.removeAllListeners();
      rotateAnim2.removeAllListeners();
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
      { translateY: -(size/6) },
    ],
  };

  const circle2Style = {
    transform: [
      { rotate: rotateAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '540deg']
        })
      },
      { translateY: -(size/6) },
    ],
  };

  const dynamicStyles = {
    circleContainer: {
      width: size,
      height: size,
    },
    mainCircle: {
      width: size/2,
      height: size/2,
      borderRadius: size/4,
    },
    smallCircle: {
      width: size/12,
      height: size/12,
      borderRadius: size/24,
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, dynamicStyles.circleContainer]}>
        <View style={[styles.mainCircle, dynamicStyles.mainCircle]} />
        <Animated.View style={[styles.smallCircle, dynamicStyles.smallCircle, circle1Style]} />
        <Animated.View style={[styles.smallCircle, dynamicStyles.smallCircle, circle2Style]} />
      </View>
      {showText && (
        <>
          <Text style={[styles.title, { color: colors.primary }]}>CupCircle</Text>
          {showSubtitle && (
            <Text style={[styles.subtitle, { color: colors.primary }]}>Where every cup connects</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCircle: {
    borderWidth: 2,
    borderColor: '#F97415',
    position: 'absolute',
  },
  smallCircle: {
    backgroundColor: '#F97415',
    position: 'absolute',
  },
  title: {
    fontSize: 32,
    fontFamily: 'K2D-Bold',
   
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});