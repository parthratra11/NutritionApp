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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
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
      if (!user?.email) return;

      try {
        const docRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(data);
          setExerciseData({
            benchPress: {
              weight: data.benchPressWeight || '',
              reps: data.benchPressReps || '',
            },
            backSquat: {
              weight: data.squatWeight || '',
              reps: data.squatReps || '',
            },
            chinUp: {
              weight: data.chinUpWeight || '',
              reps: data.chinUpReps || '',
            },
            deadlift: {
              weight: data.deadliftWeight || '',
              reps: data.deadliftReps || '',
            },
            overheadPress: {
              weight: data.overheadPressWeight || '',
              reps: data.overheadPressReps || '',
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
  }, [user?.email]);

  const saveFormData = async (data: any) => {
    if (!user?.email) return;

    try {
      await setDoc(
        doc(db, 'intakeForms', user.email.toLowerCase()),
        {
          ...formData,
          ...data,
          email: user.email.toLowerCase(),
          lastUpdated: new Date(),
        },
        { merge: true }
      );
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
      benchPressWeight: exerciseData.benchPress.weight,
      benchPressReps: exerciseData.benchPress.reps,
      squatWeight: exerciseData.backSquat.weight,
      squatReps: exerciseData.backSquat.reps,
      chinUpWeight: exerciseData.chinUp.weight,
      chinUpReps: exerciseData.chinUp.reps,
      deadliftWeight: exerciseData.deadlift.weight,
      deadliftReps: exerciseData.deadlift.reps,
      overheadPressWeight: exerciseData.overheadPress.weight,
      overheadPressReps: exerciseData.overheadPress.reps,
      strength2Completed: true,
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
