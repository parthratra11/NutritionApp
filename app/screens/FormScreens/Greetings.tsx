import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Greetings() {
  const navigation = useNavigation();

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.04} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>Let's personalize {'\n'} your plan.</Text>
        <Text style={styles.subtitle}>Fill this quick form to get started.</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('MeasurementChoice')}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.05,
    marginTop: -screenHeight * 0.1,
  },
  mainTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.09,
    fontWeight: '800',
    lineHeight: screenWidth * 0.11,
    marginBottom: screenHeight * 0.025,
    maxWidth: '95%',
  },
  subtitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.044,
    fontWeight: '300',
    lineHeight: screenWidth * 0.055,
    marginBottom: screenHeight * 0.08,
    maxWidth: '85%',
  },
  startButton: {
    minWidth: screenWidth * 0.32,
    height: screenHeight * 0.055,
    borderRadius: 9,
    backgroundColor: '#C7312B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.08,
  },
  startButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.048,
    fontWeight: '800',
    lineHeight: screenWidth * 0.055,
  },
});
