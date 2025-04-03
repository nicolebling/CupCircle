
import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LogoAnimation() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const rotation1 = React.useRef(new Animated.Value(0)).current;
  const rotation2 = React.useRef(new Animated.Value(180)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.loop(
          Animated.timing(rotation1, {
            toValue: 360,
            duration: 10000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(rotation2, {
            toValue: 540,
            duration: 10000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();
    };

    animate();
  }, []);

  const getCircleStyle = (rotation: Animated.Value) => ({
    transform: [
      {
        translateY: -16,
      },
      {
        rotate: rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { borderColor: colors.primary }]}>
        <Animated.View style={[styles.circle, { backgroundColor: colors.primary }, getCircleStyle(rotation1)]} />
        <Animated.View style={[styles.circle, { backgroundColor: colors.primary }, getCircleStyle(rotation2)]} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>CupCircle</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Where every cup connects</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderRadius: 24,
    marginBottom: 8,
    position: 'relative',
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -4,
    marginTop: -4,
  },
  title: {
    fontSize: 32,
    fontFamily: 'K2D-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    marginTop: 5,
  },
});
