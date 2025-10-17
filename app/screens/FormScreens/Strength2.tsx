import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Strength2({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const [formData, setFormData] = useState<any>({});
  const [exerciseData, setExerciseData] = useState({
    benchPress: { weight: '', reps: '' },
    backSquat: { weight: '', reps: '' },
    chinUp: { weight: '', reps: '' },
    deadlift: { weight: '', reps: '' },
    overheadPress: { weight: '', reps: '' },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) return;

      try {
        // Get intake form data from SQL backend
        const data = await intakeFormApi.getIntakeForm(user.email.toLowerCase());
        
        if (data) {
          setFormData(data);
          
          // Check if we have strength measurements
          if (data.strength_measurements && data.strength_measurements.length > 0) {
            const strengthData = data.strength_measurements[0];
            setExerciseData({
              benchPress: {
                weight: strengthData.bench_press_weight || '',
                reps: strengthData.bench_press_reps || '',
              },
              backSquat: {
                weight: strengthData.squat_weight || '',
                reps: strengthData.squat_reps || '',
              },
              chinUp: {
                weight: strengthData.chin_up_weight || '',
                reps: strengthData.chin_up_reps || '',
              },
              deadlift: {
                weight: strengthData.deadlift_weight || '',
                reps: strengthData.deadlift_reps || '',
              },
              overheadPress: {
                weight: strengthData.overhead_press_weight || '',
                reps: strengthData.overhead_press_reps || '',
              },
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        // Don't show error for 404 (form not found)
        if (!(error instanceof Error && error.message.includes('404'))) {
          Alert.alert('Error', 'Could not load your data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email]);

  // Handle input change
  const handleInputChange = (exercise, field, value) => {
    setExerciseData({
      ...exerciseData,
      [exercise]: {
        ...exerciseData[exercise],
        [field]: value,
      },
    });
  };

  // Handle next button press
  const handleNext = async () => {
    if (!user?.email) return;

    try {
      // Update the strength2_completed flag in intake_forms table
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), {
        strength2_completed: true,
        last_updated: new Date().toISOString(),
      });
      
      // Save strength measurements to the strength_measurements table
      await intakeFormApi.saveStrengthMeasurements(user.email.toLowerCase(), {
        squat_weight: exerciseData.backSquat.weight,
        squat_reps: exerciseData.backSquat.reps,
        bench_press_weight: exerciseData.benchPress.weight,
        bench_press_reps: exerciseData.benchPress.reps,
        deadlift_weight: exerciseData.deadlift.weight,
        deadlift_reps: exerciseData.deadlift.reps,
        overhead_press_weight: exerciseData.overheadPress.weight,
        overhead_press_reps: exerciseData.overheadPress.reps,
        chin_up_weight: exerciseData.chinUp.weight,
        chin_up_reps: exerciseData.chinUp.reps,
        strength2_completed: true,
        last_updated: new Date().toISOString(),
      });

      navigation.navigate('Goals', {
        ...previousParams,
        exerciseData,
      });
    } catch (error) {
      console.error('Error saving strength measurements:', error);
      Alert.alert('Error', 'Could not save your measurements. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <BackgroundWrapper>
        <ProgressBar progress={0.24} barHeight={8} />
        <View style={styles.mainContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.24} barHeight={8} />
      <View style={styles.mainContainer}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.contentContainer}>
            {/* Barbell Bench Press */}
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseTitle}>Barbell Bench Press</Text>
              <TextInput
                style={styles.input}
                value={exerciseData.benchPress.weight}
                onChangeText={(value) => handleInputChange('benchPress', 'weight', value)}
                placeholder="Weight"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={exerciseData.benchPress.reps}
                onChangeText={(value) => handleInputChange('benchPress', 'reps', value)}
                placeholder="Reps"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
            </View>

            {/* Back Squat */}
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseTitle}>Back Squat</Text>
              <TextInput
                style={styles.input}
                value={exerciseData.backSquat.weight}
                onChangeText={(value) => handleInputChange('backSquat', 'weight', value)}
                placeholder="Weight"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={exerciseData.backSquat.reps}
                onChangeText={(value) => handleInputChange('backSquat', 'reps', value)}
                placeholder="Reps"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
            </View>

            {/* Chin Up */}
            <View style={styles.exerciseContainer}>
              <View style={styles.exerciseTitleRow}>
                <Text style={styles.exerciseTitle}>Chin Up</Text>
              </View>
              <TextInput
                style={styles.input}
                value={exerciseData.chinUp.weight}
                onChangeText={(value) => handleInputChange('chinUp', 'weight', value)}
                placeholder="Weight(addition to bodyweight)"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={exerciseData.chinUp.reps}
                onChangeText={(value) => handleInputChange('chinUp', 'reps', value)}
                placeholder="Reps"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
            </View>

            {/* Deadlift */}
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseTitle}>Deadlift</Text>
              <TextInput
                style={styles.input}
                value={exerciseData.deadlift.weight}
                onChangeText={(value) => handleInputChange('deadlift', 'weight', value)}
                placeholder="Weight"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={exerciseData.deadlift.reps}
                onChangeText={(value) => handleInputChange('deadlift', 'reps', value)}
                placeholder="Reps"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
            </View>

            {/* Barbell Overhead Press */}
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseTitle}>Barbell Overhead Press</Text>
              <TextInput
                style={styles.input}
                value={exerciseData.overheadPress.weight}
                onChangeText={(value) => handleInputChange('overheadPress', 'weight', value)}
                placeholder="Weight"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={exerciseData.overheadPress.reps}
                onChangeText={(value) => handleInputChange('overheadPress', 'reps', value)}
                placeholder="Reps"
                placeholderTextColor="#8496A6"
                keyboardType="numeric"
              />
            </View>

            {/* Next Button */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: screenHeight * 0.05,
    paddingBottom: screenHeight * 0.05,
    paddingHorizontal: screenWidth * 0.06,
  },
  exerciseContainer: {
    marginBottom: screenHeight * 0.04,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.042,
    fontWeight: '600',
    marginBottom: screenHeight * 0.01,
  },
  input: {
    width: '80%', // Make the lines significantly shorter
    alignSelf: 'flex-start',
    borderBottomWidth: 0.5,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: 8,
    marginVertical: 4,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.18,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.03,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.05,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: screenHeight * 0.3,
  },
});
