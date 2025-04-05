
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function NetworkStatusBar() {
  const { isConnected, lastSync } = useNetwork();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  if (isConnected) return null;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.warning }]}>
      <Text style={styles.text}>
        You're offline. Using cached data.
        {lastSync && ` Last synced: ${lastSync.toLocaleTimeString()}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});
