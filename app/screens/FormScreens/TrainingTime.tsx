import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TrainingTime({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [trainingTimePreference, setTrainingTimePreference] = useState('');

  const handleNext = () => {
    navigation.navigate('Occupation', {
      ...previousParams,
      trainingTimePreference,
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.90} barHeight={8} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.contentContainer}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                Are there any times of day at which you are unable or unwilling to train, and outside of that, do you have a strong preference to train at a particular time of day?
              </Text>
              
              <Text style={styles.descriptionText}>
                This includes when you're at work. If you don't answer this question accurately with detailed times, you may get a program you can't follow(!)
              </Text>
              
              <TextInput
                style={styles.input}
                value={trainingTimePreference}
                onChangeText={setTrainingTimePreference}
                multiline
                placeholderTextColor="#8496A6"
              />
            </View>
            
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.2,
    paddingBottom: screenHeight * 0.1,
    justifyContent: 'space-between',
  },
  questionContainer: {
    flex: 1,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.043,
    fontWeight: '600',
    marginBottom: screenHeight * 0.02,
    lineHeight: screenWidth * 0.06,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.034,
    opacity: 0.8,
    marginBottom: screenHeight * 0.03,
    lineHeight: screenWidth * 0.045,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.040,
    padding: 0,  // Remove padding
    paddingBottom: 8, // Add some padding only at bottom
    textAlignVertical: 'bottom', // Align text at bottom
    height: 40, // Fixed height instead of minHeight
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
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
    textAlign: 'center',
  },
});