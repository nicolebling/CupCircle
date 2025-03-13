
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastProps = {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  duration?: number; // in milliseconds
};

export default function Toast({ 
  visible, 
  message, 
  type = 'info', 
  onDismiss,
  duration = 2000 // Shorter display time for less disruption
}: ToastProps) {
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }).start();
      
      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const hideToast = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
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
        }
      ]}
    >
      <Ionicons name={getIcon()} size={16} color="white" style={styles.icon} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={hideToast} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
        <Ionicons name="close" size={16} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    paddingVertical: 8,
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
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 999,
    maxHeight: 40,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: 'white',
    fontSize: 13,
    flex: 1,
  },
});
