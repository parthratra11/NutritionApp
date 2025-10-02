import React from 'react';
import { View, StatusBar, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BackgroundWrapper({ children, style }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#081A2F" translucent={false} />
      <LinearGradient
        colors={['#081A2F', '#28384A', '#FFFF']}
        locations={[0.1838, 1.2287, 1.7841]}
        style={[styles.gradientContainer, style]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#081A2F',
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.06,
    height: screenHeight,
  },
});