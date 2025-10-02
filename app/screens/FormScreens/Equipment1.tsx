import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Equipment1({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [fitnessTech, setFitnessTech] = useState('');
  const [skinfoldCalipers, setSkinfoldCalipers] = useState('');
  const [hasMeasuringTape, setHasMeasuringTape] = useState(null);

  const handleNext = () => {
    navigation.navigate('Equipment2', {
      ...previousParams,
      fitnessTech,
      skinfoldCalipers,
      hasMeasuringTape
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.80} barHeight={8} />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.questionContainer}>
            {/* First question section */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Do you wear any fitness technology ?
              </Text>
              <Text style={styles.descriptionText}>
                (Apple Watch, FitBit, Oura Ring, HR Chest Strap, etc)
              </Text>
              
              <TextInput
                style={styles.input}
                value={fitnessTech}
                onChangeText={setFitnessTech}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>
            
            {/* Second question section */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Do you have skinfold calipers and if so, which one(s)?
              </Text>
              
              <TextInput
                style={styles.input}
                value={skinfoldCalipers}
                onChangeText={setSkinfoldCalipers}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>
            
            {/* Third question section */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Do you have a MyoTape (for taking circumference measurements)?
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.optionButton,
                    hasMeasuringTape === true && styles.selectedButton
                  ]}
                  onPress={() => setHasMeasuringTape(true)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    hasMeasuringTape === true && styles.selectedButtonText
                  ]}>Yes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.optionButton,
                    hasMeasuringTape === false && styles.selectedButton
                  ]}
                  onPress={() => setHasMeasuringTape(false)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    hasMeasuringTape === false && styles.selectedButtonText
                  ]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>&gt;</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.03,
    paddingTop: screenHeight * 0.12,
    paddingBottom: screenHeight * 0.05,
  },
  questionContainer: {
    flex: 1,
  },
  questionSection: {
    marginBottom: screenHeight * 0.08, // Add significant space between question sections
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.044,
    fontWeight: '600',
    marginBottom: screenHeight * 0.01,
    lineHeight: screenWidth * 0.06,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.03,
    opacity: 0.8,
    marginBottom: screenHeight * 0.02,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: screenHeight * 0.03,
    width: '100%',
    maxWidth: screenWidth * 0.7,
  },
  optionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.09,
    minWidth: screenWidth * 0.25,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#C7312B',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
  },
  selectedButtonText: {
    color: 'white', // Dark blue color when button is selected
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: screenHeight * 0.05,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    textAlign: 'center',
  },
});