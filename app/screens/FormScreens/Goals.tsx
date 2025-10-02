import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Goals({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  const scrollViewRef = useRef(null);
  
  const [goals, setGoals] = useState({
    goal1: '',
    goal2: '',
    goal3: '',
  });
  
  const [obstacle, setObstacle] = useState('');

  const handleGoalChange = (goalKey, value) => {
    setGoals({
      ...goals,
      [goalKey]: value
    });
  };

  const handleNext = () => {
    navigation.navigate('OtherExercise', {
      ...previousParams,
      goals,
      obstacle
    });
  };
  
  const handleFocus = (inputName) => {
    // Just handle scrolling without active input styling
    setTimeout(() => {
      if (scrollViewRef.current && (inputName === 'obstacle' || inputName === 'goal3')) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.7} barHeight={8} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.mainTitle}>What are your top 3 Goals?</Text>
            
            <View style={styles.goalsContainer}>
              <TextInput
                style={styles.input}
                value={goals.goal1}
                onChangeText={(value) => handleGoalChange('goal1', value)}
                placeholder="Goal 1"
                placeholderTextColor="#8496A6"
                onFocus={() => handleFocus('goal1')}
              />
              
              <TextInput
                style={styles.input}
                value={goals.goal2}
                onChangeText={(value) => handleGoalChange('goal2', value)}
                placeholder="Goal 2"
                placeholderTextColor="#8496A6"
                onFocus={() => handleFocus('goal2')}
              />
              
              <TextInput
                style={styles.input}
                value={goals.goal3}
                onChangeText={(value) => handleGoalChange('goal3', value)}
                placeholder="Goal 3"
                placeholderTextColor="#8496A6"
                onFocus={() => handleFocus('goal3')}
              />
            </View>
            
            <Text style={styles.obstacleTitle}>What is you number one obstacle?</Text>
            
            <TextInput
              style={styles.input}
              value={obstacle}
              onChangeText={setObstacle}
              multiline
              onFocus={() => handleFocus('obstacle')}
            />
            
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
    paddingHorizontal: screenWidth * 0.07,
    marginTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.1, // Add extra padding at bottom for keyboard
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.06,
    fontWeight: '700',
    marginBottom: screenHeight * 0.05,
  },
  goalsContainer: {
    marginBottom: screenHeight * 0.06,
  },
  obstacleTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    marginBottom: screenHeight * 0.02,
  },
  input: {
    width: '100%',
    borderBottomWidth: 0.5,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.040,
    paddingVertical: 12,
    marginBottom: screenHeight * 0.025,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.06,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});