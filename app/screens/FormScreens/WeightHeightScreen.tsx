import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
// If you use context for form data, import it here
// import { useFormContext } from '../FormScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WeightHeightScreen({ route }) {
  const navigation = useNavigation();
  // If using context, get measurementSystem from context
  // const { formData } = useFormContext();
  // const measurementSystem = formData.measurementSystem;

  // For demo, get from route params or default to 'imperial'
  const measurementSystem = route?.params?.measurementSystem || 'imperial';

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  // Units based on measurement system
  const heightUnit = measurementSystem === 'imperial' ? 'ft.inch' : 'cm';
  const weightUnit = measurementSystem === 'imperial' ? 'lbs' : 'kg';

  const handleNext = () => {
    // Save data to context or pass to next screen
    navigation.navigate('StrengthChoice', {
      height,
      weight,
      bodyFat,
      measurementSystem,
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.3} barHeight={8} />
      <View style={styles.contentContainer}>
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Height</Text>
            <Text style={styles.unit}>{heightUnit}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            
            placeholderTextColor="#BFC9D1"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Weight</Text>
            <Text style={styles.unit}>{weightUnit}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
           
            placeholderTextColor="#BFC9D1"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Body Fat Percentage (if known)</Text>
          <TextInput
            style={styles.input}
            value={bodyFat}
            onChangeText={setBodyFat}
           
            placeholderTextColor="#BFC9D1"
            keyboardType="numeric"
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.07,
    marginTop: -screenHeight * 0.05,
  },
  inputGroup: {
    width: '100%',
    marginBottom: screenHeight * 0.06,
    paddingHorizontal: screenWidth * 0.02,
    paddingVertical: screenHeight * 0.02,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    fontWeight: '700',
    fontFamily: 'Texta',
  },
  unit: {
    color: '#BFC9D1',
    fontSize: screenWidth * 0.035,
    fontWeight: '400',
    fontFamily: 'Texta',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.048,
    paddingVertical: 6,
    fontFamily: 'Texta',
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.30,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.04,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.08,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});