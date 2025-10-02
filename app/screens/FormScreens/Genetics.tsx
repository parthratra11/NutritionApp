import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Genetics({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [wristCircumference, setWristCircumference] = useState('');
  const [ankleCircumference, setAnkleCircumference] = useState('');

  const handleNext = () => {
    navigation.navigate('CurrentProgram', {
      ...previousParams,
      genetics: {
        wristCircumference,
        ankleCircumference
      }
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.98} barHeight={8} />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.labelText}>
              Wrist circumference (smallest point)
            </Text>
            
            <TextInput
              style={styles.inputField}
              value={wristCircumference}
              onChangeText={setWristCircumference}
              placeholder=""
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="numeric"
            />
          </View>
          
          {/* Added spacing view to create more distance between questions */}
          <View style={styles.spacer} />
          
          <View style={styles.inputContainer}>
            <Text style={styles.labelText}>
              Ankle circumference (smallest point)
            </Text>
            
            <TextInput
              style={styles.inputField}
              value={ankleCircumference}
              onChangeText={setAnkleCircumference}
              placeholder=""
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.3,
    paddingBottom: screenHeight * 0.05,
  },
  inputContainer: {
    marginBottom: screenHeight * 0.02, // Reduced from 0.04 since we're adding a spacer
  },
  spacer: {
    height: screenHeight * 0.08, // Adds significant space between the questions
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '500',
    marginBottom: screenHeight * 0.01,
  },
  inputField: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: screenHeight * 0.1,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.2,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    textAlign: 'center',
  },
});