
import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LogoAnimation() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const circle1Animation = React.useRef(new Animated.Value(0)).current;
  const circle2Animation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.loop(
          Animated.timing(circle1Animation, {
            toValue: 1,
            duration: 10000,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ),
        Animated.loop(
          Animated.timing(circle2Animation, {
            toValue: 1,
            duration: 10000,
            easing: Easing.linear,
            useNativeDriver: true
          })
        )
      ]).start();
    };

    animate();
  }, []);

  const circle1Style = {
    transform: [
      {
        translateY: -20
      },
      {
        rotate: circle1Animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        })
      }
    ]
  };

  const circle2Style = {
    transform: [
      {
        translateY: -20
      },
      {
        rotate: circle2Animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '540deg']
        })
      }
    ]
  };

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { borderColor: colors.primary }]}>
        <Animated.View style={[styles.circle, { backgroundColor: colors.primary }, circle1Style]} />
        <Animated.View style={[styles.circle, { backgroundColor: colors.primary }, circle2Style]} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>CupCircle</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Where every cup connects</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
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
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    marginTop: 4,
  },
});
