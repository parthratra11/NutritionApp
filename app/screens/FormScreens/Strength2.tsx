import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';

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
      if (!user?.id) return;

      try {
        const response = await fetch(`http://localhost:8000/intake_forms/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(data);
          setExerciseData({
            benchPress: {
              weight: data.bench_press_weight || '',
              reps: data.bench_press_reps || '',
            },
            backSquat: {
              weight: data.squat_weight || '',
              reps: data.squat_reps || '',
            },
            chinUp: {
              weight: data.chin_up_weight || '',
              reps: data.chin_up_reps || '',
            },
            deadlift: {
              weight: data.deadlift_weight || '',
              reps: data.deadlift_reps || '',
            },
            overheadPress: {
              weight: data.overhead_press_weight || '',
              reps: data.overhead_press_reps || '',
            },
          });
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.id]);

  const saveFormData = async (data: any) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:8000/intake_forms/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          ...formData,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save form data');
      }
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

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
    // Convert exercise data to individual fields for database
    const dataToSave = {
      bench_press_weight: exerciseData.benchPress.weight,
      bench_press_reps: exerciseData.benchPress.reps,
      squat_weight: exerciseData.backSquat.weight,
      squat_reps: exerciseData.backSquat.reps,
      chin_up_weight: exerciseData.chinUp.weight,
      chin_up_reps: exerciseData.chinUp.reps,
      deadlift_weight: exerciseData.deadlift.weight,
      deadlift_reps: exerciseData.deadlift.reps,
      overhead_press_weight: exerciseData.overheadPress.weight,
      overhead_press_reps: exerciseData.overheadPress.reps,
      strength2_completed: true,
    };

    await saveFormData(dataToSave);

    navigation.navigate('Goals', {
      ...previousParams,
      exerciseData,
    });
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
