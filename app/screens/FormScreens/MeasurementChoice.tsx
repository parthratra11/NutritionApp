import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MeasurementChoice() {
  const navigation = useNavigation();

  const handleSelect = (system: 'imperial' | 'metric') => {
    navigation.navigate('WeightHeight', { measurementSystem: system });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.2} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>Preferred Measurement{'\n'} System</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.measurementButton}
            onPress={() => handleSelect('imperial')}
          >
            <Text style={styles.buttonText}>Imperial</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.measurementButton}
            onPress={() => handleSelect('metric')}
          >
            <Text style={styles.buttonText}>Metric</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.07,
    marginTop: -screenHeight * 0.05,
  },
  mainTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.064,
    fontWeight: '700',
    lineHeight: screenWidth * 0.09,
    marginBottom: screenHeight * 0.08,
    maxWidth: '95%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: screenWidth * 0.15,
    marginBottom: 32,
  },
  measurementButton: {
    width: screenWidth * 0.36,
    height: screenHeight * 0.053,
    borderRadius: 17.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(217, 217, 217, 0.00)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: screenWidth * 0.036,
    fontWeight: '600',
    lineHeight: screenWidth * 0.041,
  },
});
