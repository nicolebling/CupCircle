
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FontTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.regular}>K2D Regular</Text>
      <Text style={styles.medium}>K2D Medium</Text>
      <Text style={styles.semiBold}>K2D SemiBold</Text>
      <Text style={styles.bold}>K2D Bold</Text>
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
    fontFamily: 'K2D-Regular',
    fontSize: 18,
    marginBottom: 10,
  },
  medium: {
    fontFamily: 'K2D-Medium',
    fontSize: 18,
    marginBottom: 10,
  },
  semiBold: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    marginBottom: 10,
  },
  bold: {
    fontFamily: 'K2D-Bold',
    fontSize: 18,
  }
});
