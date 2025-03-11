
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FontTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.regular}>Arial Regular</Text>
      <Text style={styles.medium}>Arial Medium</Text>
      <Text style={styles.semiBold}>Arial SemiBold</Text>
      <Text style={styles.bold}>Arial Bold</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  regular: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 18,
    marginBottom: 10,
  },
  medium: {
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
    fontSize: 18,
    marginBottom: 10,
  },
  semiBold: {
    fontFamily: 'Arial, sans-serif',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 10,
  },
  bold: {
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fontSize: 18,
  }
});
