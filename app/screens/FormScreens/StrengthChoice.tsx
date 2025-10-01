import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StrengthChoice({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const handleSelect = (hasExperience) => {
    if (hasExperience) {
      navigation.navigate('Strength1', {
        ...previousParams,
        strengthExperience: hasExperience
      });
    } else {
      // Navigate to the next screen for beginners
      navigation.navigate('Goals', {
        ...previousParams,
        strengthExperience: hasExperience
      });
    }
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.4} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>Experience in Strength{'\n'}Training?</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.choiceButton}
            onPress={() => handleSelect(true)}
          >
            <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.choiceButton}
            onPress={() => handleSelect(false)}
          >
            <Text style={styles.buttonText}>No</Text>
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
    gap: screenWidth * 0.08,
    marginBottom: 32,
  },
  choiceButton: {
    width: screenWidth * 0.40,
    height: screenHeight * 0.053,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
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