import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Occupation({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  const scrollViewRef = useRef(null);

  const [occupation, setOccupation] = useState('');
  const [diet, setDiet] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');

  const handleNext = () => {
    navigation.navigate('TrainingTime', {
      ...previousParams,
      occupation,
      diet,
      medicalConditions,
    });
  };

  const handleFocus = (inputName) => {
    setTimeout(() => {
      if (scrollViewRef.current && (inputName === 'medicalConditions' || inputName === 'diet')) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.58} barHeight={8} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.question}>What is your occupation?</Text>
              <Text style={styles.description}>
                The aim is to understand your circadian rhythm (physiological impact of your daily
                routine), stress and activity level.
              </Text>
              <TextInput
                style={styles.input}
                value={occupation}
                onChangeText={setOccupation}
                onFocus={() => handleFocus('occupation')}
                placeholderTextColor="#8496A6"
              />
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.question}>
                Do you currently follow any special diet, or wish to follow any special diet as part
                of this coaching program?
              </Text>
              <Text style={styles.description}>e.g. ketogenic, vegan</Text>
              <TextInput
                style={styles.input}
                value={diet}
                onChangeText={setDiet}
                onFocus={() => handleFocus('diet')}
                placeholderTextColor="#8496A6"
              />
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.question}>Please list any medical conditions or injuries.</Text>
              <Text style={styles.description}>
                Including disabilities, allergies, illnesses, syndromes, disorders, etc.) you have
                or have had historically.
              </Text>
              <TextInput
                style={styles.input}
                value={medicalConditions}
                onChangeText={setMedicalConditions}
                onFocus={() => handleFocus('medicalConditions')}
                placeholderTextColor="#8496A6"
                multiline
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
    paddingTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.15, // Increased bottom padding
    minHeight: screenHeight * 0.9,
  },
  sectionContainer: {
    marginBottom: screenHeight * 0.04,
  },
  question: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.043,
    fontWeight: '700',
    marginBottom: screenHeight * 0.01,
  },
  description: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.034,
    opacity: 0.8,
    marginBottom: screenHeight * 0.02,
    lineHeight: screenWidth * 0.05,
  },
  input: {
    width: '100%',
    borderBottomWidth: 0.5,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: 8,
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
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});
