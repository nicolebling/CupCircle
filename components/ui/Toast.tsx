
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
  duration = 2000 // Reduced from 3000 to 2000 for quicker fade
}: ToastProps) {
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 0.9, // Reduced from 1 to 0.9 for more subtle appearance
        duration: 200, // Reduced from 300 to 200 for quicker appearance
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
      duration: 200, // Reduced from 300 to 200 for quicker fade
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  if (!visible) return null;
  
  // Set colors based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'rgba(76, 175, 80, 0.9)'; // More transparent success
      case 'error': return 'rgba(244, 67, 54, 0.9)'; // More transparent error
      case 'info': return 'rgba(33, 150, 243, 0.9)'; // More transparent info
      default: return 'rgba(33, 150, 243, 0.9)';
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
    bottom: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15, // Reduced shadow opacity
    shadowRadius: 3.84,
    elevation: 3, // Reduced elevation
    zIndex: 999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  }
});
