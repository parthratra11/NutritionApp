import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import Slider from '@react-native-community/slider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Strength1({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [competencyLevel, setCompetencyLevel] = useState(0.5); // Default to middle (Intermediate)
  const [comments, setComments] = useState('');

  const handleNext = () => {
    navigation.navigate('Strength2', {
      ...previousParams,
      competencyLevel,
      trainingComments: comments
    });
  };

  // Function to get label text based on slider value
  const getCompetencyText = () => {
    if (competencyLevel < 0.33) return 'Novice';
    if (competencyLevel < 0.67) return 'Intermediate';
    return 'Advanced';
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.5} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>How would you rate your competency on the mentioned exercises?</Text>
        
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={competencyLevel}
            onValueChange={setCompetencyLevel}
            minimumTrackTintColor="#C7312B"
            maximumTrackTintColor="#FFFFFF"
            thumbTintColor="#C7312B"
          />
          
          <View style={styles.labelsContainer}>
            <Text style={styles.labelText}>Novice{'\n'}(Questionable{'\n'}Technique)</Text>
            <Text style={styles.labelText}>Intermediate{'\n'}(Reasonably{'\n'}Competent but could{'\n'}Improve)</Text>
            <Text style={styles.labelText}>Advanced (Highly{'\n'}competent, with{'\n'}months/years of{'\n'}consistent{'\n'}application)</Text>
          </View>
        </View>

        <View style={styles.commentsContainer}>
          <Text style={styles.commentsLabel}>Comments? (Add any context to your training history)</Text>
          <TextInput
            style={styles.commentsInput}
            value={comments}
            onChangeText={setComments}
           
            
            multiline
          />
        </View>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>&gt;</Text>
        </TouchableOpacity>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.02, // Reduced horizontal padding
    marginTop: screenHeight * 0.15,
  },
  mainTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.055,
    fontWeight: '700',
    lineHeight: screenWidth * 0.075,
    marginBottom: screenHeight * 0.05,
    maxWidth: '95%',
  },
  sliderContainer: {
    width: '100%',
    marginBottom: screenHeight * 0.05,
    paddingHorizontal: screenWidth * 0.01, // Add slight padding to slider container
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.028,
    textAlign: 'center',
    opacity: 0.8,
    width: '33%',
  },
  commentsContainer: {
    width: '100%',
    marginBottom: screenHeight * 0.04,
    marginTop: screenHeight * 0.03,
  },
  commentsLabel: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.034,
    fontWeight: '600',
    marginBottom: 10,
  },
  commentsInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.036,
    paddingVertical: 6,
    fontFamily: 'Texta',
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.28,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.04,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});