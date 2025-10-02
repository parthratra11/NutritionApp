import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Caffeine({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [caffeine, setCaffeine] = useState('');
  const [menstrualInfo, setMenstrualInfo] = useState('');

  const handleNext = () => {
    navigation.navigate('Equipment1', {
      ...previousParams,
      caffeine,
      menstrualInfo
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.75} barHeight={8} />
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
                How much caffeine do you consume daily on average or on a typical work day?
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter Number of Cups..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={caffeine}
                onChangeText={setCaffeine}
              />
              
              
              
              <Text style={styles.labelText}>
                [Women only]
              </Text>
              <Text style={styles.questionText}>
                Do you have a regular menstrual cycle? And are you using any form of contraception?
              </Text>
              
              <TextInput
                style={styles.input}
                value={menstrualInfo}
                onChangeText={setMenstrualInfo}
                multiline
              />
              
              <Text style={styles.disclaimerText}>
                If these questions are sensitive, feel free to ignore them, but the more information I have, the better I can help you.
              </Text>
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
    paddingBottom: screenHeight * 0.05,
  },
  questionContainer: {
    flex: 1,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    marginBottom: screenHeight * 0.02,
    lineHeight: screenWidth * 0.06,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.035,
    fontWeight: '600',
    marginTop: screenHeight * 0.1,
    marginBottom: screenHeight * 0.01,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.040,
    padding: 0,
    paddingBottom: 8,
    textAlignVertical: 'bottom',
    height: 40,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    marginTop: screenHeight * 0.04,
    marginBottom: screenHeight * 0.04,
    opacity: 0.5,
  },
  disclaimerText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.035,
    marginTop: screenHeight * 0.06,
    opacity: 0.7,
    lineHeight: screenWidth * 0.055,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.05,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    textAlign: 'center',
  },
});