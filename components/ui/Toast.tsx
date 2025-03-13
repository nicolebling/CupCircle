
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastProps = {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  duration?: number;
};

export default function Toast({ 
  visible, 
  message, 
  type = 'info', 
  onDismiss,
  duration = 1500 
}: ToastProps) {
  const translateY = new Animated.Value(100);
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    if (visible) {
      // Slide in from bottom
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
      
      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  if (!visible) return null;
  
  // Set colors based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'rgba(76, 175, 80, 0.85)';
      case 'error': return 'rgba(244, 67, 54, 0.85)';
      case 'info': return 'rgba(33, 150, 243, 0.85)';
      default: return 'rgba(33, 150, 243, 0.85)';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: getBackgroundColor(),
          opacity,
          transform: [{ translateY }]
        }
      ]}
    >
      <Ionicons name={getIcon()} size={16} color="white" style={styles.icon} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={hideToast} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
        <Ionicons name="close" size={14} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16, 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 999,
    maxHeight: 34,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: 'white',
    fontSize: 12,
    flex: 1,
  },
});
