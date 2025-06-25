import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChartFallback = ({ message = 'Chart could not be displayed' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default ChartFallback;
