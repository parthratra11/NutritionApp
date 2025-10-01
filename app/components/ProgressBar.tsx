import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProgressBar({ progress = 0.1, barHeight = 8, backgroundColor = '#E9E9E9', fillColor = '#C7312B', style }) {
  return (
    <View style={[styles.progressContainer, { height: barHeight }, style]}>
      <View style={[styles.progressBackground, { backgroundColor, height: barHeight }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, height: barHeight, backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    marginTop: screenHeight * 0.07,
    marginHorizontal: screenWidth * 0.02,
    width: '100%',
  },
  progressBackground: {
    flex: 1,
    borderRadius: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 100,
  },
});