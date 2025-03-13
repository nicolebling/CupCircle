
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
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
  duration = 3000
}: ToastProps) {
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
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
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  if (!visible) return null;
  
  // Set colors based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'info': return '#2196f3';
      default: return '#2196f3';
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
      <View style={styles.content}>
        <Ionicons name={getIcon()} size={24} color="white" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
      
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'K2D-Regular',
    flex: 1,
  },
  closeButton: {
    paddingLeft: 10,
  },
});
