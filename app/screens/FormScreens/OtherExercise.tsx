import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OtherExercise({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  const scrollViewRef = useRef(null);
  
  const [otherExercise, setOtherExercise] = useState('');

  const handleNext = () => {
    navigation.navigate('DedicationLevel', {
      ...previousParams,
      otherExercise
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.8} barHeight={8} />
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
            <Text style={styles.mainTitle}>
              Will you be performing any other form of exercise alongside strength training (e.g. running, football, yoga)?*
            </Text>
            
            <TextInput
              style={styles.input}
              value={otherExercise}
              onChangeText={setOtherExercise}
              multiline
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
    marginTop: screenHeight * 0.25,
    paddingBottom: screenHeight * 0.1,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.048,
    fontWeight: '600',
    marginBottom: screenHeight * 0.05,
    lineHeight: screenWidth * 0.065,
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
    marginTop: screenHeight * 0.08,
    marginBottom: screenHeight * 0.02,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});