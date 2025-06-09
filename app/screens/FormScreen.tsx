import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function IntakeForm() {
  const [form, setForm] = useState({
    // Personal Info
    fullName: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    age: '',
    height: '',
    weight: '',
    bodyFat: '',
    strengthTrainingExperience: '',
    // Strength
    benchPress: '',
    squat: '',
    chinUp: '',
    deadlift: '',
    overheadPress: '',
    strengthLevel: '',
    exerciseCompetency: '',
    // Goals
    goals: '',
    obstacle: '',
    otherExercises: '',
    dedicationLevel: '',
    weeklyFrequency: '',
    // Misc
    occupation: '',
    medicalConditions: '',
    specialDiet: '',
    // Lifestyle
    trainingTimePreference: '',
    activityLevel: '',
    stressLevel: '',
    sleepQuality: '',
    caffeineIntake: '',
    menstrualCycle: '',
    // Equipment
    calipers: '',
    myoTape: '',
    fitnessTech: '',
    cardioEquipment: '',
    squatRack: '',
    hyperBench: '',
    gluteHam: '',
    standingCalf: '',
    dipBelt: '',
    legCurl: '',
    gymRings: '',
    trx: '',
    resistanceBands: '',
    pullUpBar: '',
    seatedCalf: '',
    cableTower: '',
    otherEquipment: '',
    // Supplements
    supplements: '',
    // Genetics
    wristCircumference: '',
    ankleCircumference: '',
    // Current Program
    typicalDiet: '',
    currentTraining: '',
  });

  const { isDarkMode } = useTheme();
  const navigation = useNavigation();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (field: string) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // const handleSubmit = async () => {
  //   try {
  //     if (!form.fullName || !form.email || !form.age) {
  //       Alert.alert('Error', 'Please fill in all required fields');
  //       return;
  //     }

  //     const docRef = await addDoc(collection(db, 'intakeForms'), {
  //       ...form,
  //       timestamp: new Date(),
  //     });
  //     Alert.alert('Success', 'Form submitted successfully!', [
  //       { text: 'OK', onPress: () => navigation.navigate('Home') },
  //     ]);
  //   } catch (error) {
  //     console.error('Error adding document:', error);
  //     Alert.alert('Error', 'Failed to submit form. Please try again.');
  //   }
  // };

  const handleSubmit = async () => {
    try {
      const docRef = await addDoc(collection(db, 'intakeForms'), {
        ...form,
        timestamp: new Date(),
      });
      Alert.alert('Success', 'Form submitted successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    }
  };

  // Helper function to render form inputs
  const renderInput = (label: string, field: string, options: any = {}) => (
    <>
      <Text style={[styles.label, isDarkMode && styles.textDark]}>
        {label}
        {options.required ? '*' : ''}
      </Text>
      <TextInput
        style={[styles.input, isDarkMode && styles.inputDark]}
        onChangeText={(t) => handleChange(field, t)}
        value={form[field]}
        placeholderTextColor={isDarkMode ? '#666' : '#999'}
        {...options}
      />
    </>
  );

  // Helper function to render checkboxes
  const renderCheckbox = (label: string, field: string, description: string = '') => (
    <TouchableOpacity
      style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
      onPress={() => handleCheckbox(field)}>
      <View
        style={[
          styles.checkbox,
          isDarkMode && styles.checkboxDark,
          form[field] && styles.checkboxChecked,
        ]}
      />
      <Text style={[{ flex: 1 }, isDarkMode && styles.textDark]}>
        {label}
        {description && `: ${description}`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      <ScrollView
        style={[styles.container, isDarkMode && styles.containerDark]}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>
          Online Coaching Client Intake Form
        </Text>

        {/* GENERAL */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>1. General</Text>

        {renderInput('Full name', 'fullName', { required: true })}
        {renderInput('Street and house number', 'street')}
        {renderInput('Postal code', 'postalCode')}
        {renderInput('City', 'city', { required: true })}
        {renderInput('Country', 'country', { required: true })}
        {renderInput('Age', 'age', { required: true, keyboardType: 'numeric' })}
        {renderInput('Height', 'height', { required: true })}
        {renderInput('Weight', 'weight', { required: true })}
        {renderInput('Body fat percentage (plus estimation method)', 'bodyFat')}
        {renderInput(
          'Do you have experience with strength training?',
          'strengthTrainingExperience'
        )}

        {/* STRENGTH LEVEL */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>2. Strength Level</Text>
        {renderInput('Barbell Bench Press (kg x reps)', 'benchPress')}
        {renderInput('Back Squat (kg x reps)', 'squat')}
        {renderInput('Chin-up (kg x reps)', 'chinUp')}
        {renderInput('Deadlift (kg x reps)', 'deadlift')}
        {renderInput('Barbell Overhead Press (kg x reps)', 'overheadPress')}
        {renderInput(
          'How would you rate your competency on the aforementioned exercises?',
          'exerciseCompetency',
          { required: true }
        )}

        {/* GOALS */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>3. Goals</Text>
        {renderInput('What are your top 3 goals?', 'goals', { multiline: true, required: true })}
        {renderInput('What is your number 1 obstacle?', 'obstacle', { required: true })}
        {renderInput(
          'Will you be performing any other form of exercise alongside strength training?',
          'otherExercises',
          { required: true }
        )}

        <Text style={[styles.label, isDarkMode && styles.textDark]}>
          What's your dedication level?*
        </Text>
        <View style={{ marginTop: 10 }}>
          {[
            {
              level: 'A',
              description:
                "Steady and sustainability is most important to me. As long as I'm moving in the right direction, I don't mind about the rate of progress.",
            },
            {
              level: 'B',
              description:
                'I want to achieve results at a good pace whilst maintaining a balanced lifestyle.',
            },
            {
              level: 'C',
              description:
                'I will do whatever it takes to achieve maximum results without compromising my health.',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.level}
              style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
              onPress={() => handleChange('dedicationLevel', item.level)}>
              <View
                style={[
                  styles.checkbox,
                  isDarkMode && styles.checkboxDark,
                  form.dedicationLevel === item.level && styles.checkboxChecked,
                ]}
              />
              <Text style={[{ flex: 1 }, isDarkMode && styles.textDark]}>
                <Text style={[styles.checkboxLabel, isDarkMode && styles.textDark]}>
                  {item.level}:{' '}
                </Text>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderInput(
          'How often in a week would you be prepared to train for maximal results?',
          'weeklyFrequency',
          { required: true }
        )}

        {/* Misc */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>4. Misc</Text>
        {renderInput('What is your occupation?', 'occupation')}
        {renderInput('Please list any medical conditions or injuries', 'medicalConditions', {
          multiline: true,
        })}
        {renderInput('Do you currently follow any special diet?', 'specialDiet')}

        {/* Lifestyle */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>5. Lifestyle</Text>
        {renderInput('Training time preference', 'trainingTimePreference', {
          required: true,
          multiline: true,
        })}

        <Text style={[styles.label, isDarkMode && styles.textDark]}>
          Which of the following options best describes your activity level (this does NOT include
          exercise)?*
        </Text>
        <View style={{ marginTop: 10 }}>
          {[
            {
              level: 'Sedentary',
              description: '(e.g. office job), below 7,500 steps/day',
            },
            {
              level: 'Somewhat active',
              description:
                '(e.g. you walk your dog several times a day or you commute by bicycle/on foot), 7,500 – 9,999 steps/day',
            },
            {
              level: 'Active',
              description:
                '(e.g. full-time PT, literally on your feet most of the day), 10,000 – 12,500 steps/day',
            },
            {
              level: 'Very active',
              description:
                '(e.g. involved in physical labour), over 12,500 steps/day with intensive movement',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.level}
              style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
              onPress={() => handleChange('activityLevel', item.level)}>
              <View
                style={[
                  styles.checkbox,
                  isDarkMode && styles.checkboxDark,
                  form.activityLevel === item.level && styles.checkboxChecked,
                ]}
              />
              <Text style={[{ flex: 1 }, isDarkMode && styles.textDark]}>
                <Text style={[styles.checkboxLabel, isDarkMode && styles.textDark]}>
                  {item.level}:{' '}
                </Text>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, isDarkMode && styles.textDark]}>
          Which of the following options best describes your stress level?*
        </Text>
        <View style={{ marginTop: 10 }}>
          {[
            {
              level: 'Stress-free',
              description: '(e.g. on holiday)',
            },
            {
              level: 'Only occasional/mild stress',
              description: '(e.g. student not during exam period)',
            },
            {
              level: 'Average stress',
              description: '(e.g. full-time work with deadlines/commuting)',
            },
            {
              level: 'High stress',
              description: '(e.g. very high-paced work environment with great responsibility)',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.level}
              style={[styles.checkboxContainer, { alignItems: 'flex-start', marginBottom: 10 }]}
              onPress={() => handleChange('stressLevel', item.level)}>
              <View
                style={[
                  styles.checkbox,
                  isDarkMode && styles.checkboxDark,
                  form.stressLevel === item.level && styles.checkboxChecked,
                ]}
              />
              <Text style={[{ flex: 1 }, isDarkMode && styles.textDark]}>
                <Text style={[styles.checkboxLabel, isDarkMode && styles.textDark]}>
                  {item.level}:{' '}
                </Text>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderInput('Sleep Quality', 'sleepQuality', { required: true })}
        {renderInput('Caffeine Intake (Daily Avg)', 'caffeineIntake')}
        {renderInput('[Women only] Menstrual Cycle & Contraception', 'menstrualCycle', {
          multiline: true,
        })}

        {/* Equipment */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>6. Equipment</Text>
        <Text style={[styles.label, isDarkMode && styles.textDark]}>Do you have access to…</Text>

        <View style={{ marginTop: 10 }}>
          {[
            { field: 'squatRack', label: 'Squat cage or rack' },
            { field: 'hyperBench', label: '45° hyperextension bench' },
            { field: 'gluteHam', label: 'Glute-ham raise' },
            { field: 'standingCalf', label: 'Standing calf raise machine' },
            { field: 'dipBelt', label: 'Dip/chin-up belt' },
            { field: 'legCurl', label: 'Leg curl machine (seated/lying/standing)' },
            { field: 'gymRings', label: 'Gymnastic rings' },
            { field: 'trx', label: 'TRX or similar suspension device' },
            { field: 'resistanceBands', label: 'Resistance bands' },
            { field: 'pullUpBar', label: 'Pull-up bar' },
            { field: 'seatedCalf', label: 'Seated calf raise machine' },
            { field: 'cableTower', label: 'Cable tower' },
          ].map((item) => (
            <TouchableOpacity
              key={item.field}
              style={[styles.checkboxContainer, { marginBottom: 10 }]}
              onPress={() => handleCheckbox(item.field)}>
              <View
                style={[
                  styles.checkbox,
                  isDarkMode && styles.checkboxDark,
                  form[item.field] && styles.checkboxChecked,
                ]}
              />
              <Text style={[{ flex: 1 }, isDarkMode && styles.textDark]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Supplements */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>7. Supplements</Text>
        {renderInput('Please list all the supplements you are currently taking.', 'supplements', {
          multiline: true,
        })}

        {/* Genetics */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>8. Genetics</Text>
        {renderInput('Wrist circumference (smallest point)', 'wristCircumference')}
        {renderInput('Ankle circumference (smallest point)', 'ankleCircumference')}

        {/* Current Program */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>9. Current Program</Text>
        {renderInput('Describe a typical day of eating (or diet plan)', 'typicalDiet', {
          multiline: true,
        })}
        {renderInput('Describe or attach your current training program', 'currentTraining', {
          multiline: true,
        })}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isDarkMode && styles.submitButtonDark]}
            onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Form</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  checkboxGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  checkboxLabel: {
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  submitButtonDark: {
    backgroundColor: '#4338ca',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: { marginVertical: 20 },
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#000000',
  },
  textDark: {
    color: '#ffffff',
  },
  label: {
    marginTop: 15,
    fontWeight: '600',
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  inputDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#ffffff',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 3,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDark: {
    borderColor: '#4b5563',
    backgroundColor: '#1f2937',
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
  },
});
