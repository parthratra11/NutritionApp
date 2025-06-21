import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { NavigationProp } from '@react-navigation/native';

// Define types for form data
interface FormData {
  email: string;
  fullName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  age: string;
  height: string;
  weight: string;
  bodyFat: string;
  strengthTrainingExperience: string;
  benchPress: string;
  squat: string;
  chinUp: string;
  deadlift: string;
  overheadPress: string;
  exerciseCompetency: string;
  goals: string;
  obstacle: string;
  otherExercises: string;
  dedicationLevel: string;
  weeklyFrequency: string;
  occupation: string;
  medicalConditions: string;
  specialDiet: string;
  trainingTimePreference: string;
  activityLevel: string;
  stressLevel: string;
  sleepQuality: string;
  caffeineIntake: string;
  menstrualCycle: string;
  squatRack: boolean;
  hyperBench: boolean;
  gluteHam: boolean;
  standingCalf: boolean;
  dipBelt: boolean;
  legCurl: boolean;
  gymRings: boolean;
  trx: boolean;
  resistanceBands: boolean;
  pullUpBar: boolean;
  seatedCalf: boolean;
  cableTower: boolean;
  supplements: string;
  wristCircumference: string;
  ankleCircumference: string;
  typicalDiet: string;
  currentTraining: string;
}

// Define types for field configuration
interface Field {
  name: keyof FormData | string;
  label: string;
  type?: 'text' | 'checkbox' | 'radio';
  options?: {
    required?: boolean;
    keyboardType?: string;
    multiline?: boolean;
    custom?: Array<{ value: string; description: string }>;
  };
}

// Define navigation param list
type RootStackParamList = {
  Address: FormScreenProps;
  PersonalInfo: FormScreenProps;
  StrengthLevel: FormScreenProps;
  Goals: FormScreenProps;
  Misc: FormScreenProps;
  Lifestyle: FormScreenProps;
  Equipment: FormScreenProps;
  Supplements: FormScreenProps;
  Genetics: FormScreenProps;
  CurrentProgram: FormScreenProps;
  StrikeAPose: FormScreenProps;
  Welcome: undefined;
  Home: undefined;
};

// Define props for FormScreen
interface FormScreenProps {
  fields: Field[];
  title: string;
  nextScreen?: keyof RootStackParamList;
  isLast?: boolean;
  progress: number;
}

// Create context for form data
interface FormContextType {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  hasSubmitted: boolean;
  handleSubmit: () => Promise<boolean>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

const Stack = createStackNavigator<RootStackParamList>();

// Initial form state
const initialFormState: FormData = {
  email: '',
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
  benchPress: '',
  squat: '',
  chinUp: '',
  deadlift: '',
  overheadPress: '',
  exerciseCompetency: '',
  goals: '',
  obstacle: '',
  otherExercises: '',
  dedicationLevel: '',
  weeklyFrequency: '',
  occupation: '',
  medicalConditions: '',
  specialDiet: '',
  trainingTimePreference: '',
  activityLevel: '',
  stressLevel: '',
  sleepQuality: '',
  caffeineIntake: '',
  menstrualCycle: '',
  squatRack: false,
  hyperBench: false,
  gluteHam: false,
  standingCalf: false,
  dipBelt: false,
  legCurl: false,
  gymRings: false,
  trx: false,
  resistanceBands: false,
  pullUpBar: false,
  seatedCalf: false,
  cableTower: false,
  supplements: '',
  wristCircumference: '',
  ankleCircumference: '',
  typicalDiet: '',
  currentTraining: '',
};

// Form Screen Component
const FormScreen: React.FC<{
  route: { params: FormScreenProps };
  navigation: StackNavigationProp<RootStackParamList>;
}> = ({ route, navigation }) => {
  const { fields, title, nextScreen, isLast, progress } = route.params;
  const { isDarkMode } = useTheme();
  const { formData, setFormData, hasSubmitted, handleSubmit } = useFormContext();

  const handleChange = (field: keyof FormData, value: string) => {
    if (!hasSubmitted) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCheckbox = (field: keyof FormData) => {
    if (!hasSubmitted) {
      setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const renderInput = (
    label: string,
    field: keyof FormData | string,
    options: Field['options'] = {},
    index: number
  ) => (
    <View key={`input-${field}-${index}`} style={styles.inputContainer}>
      <Text style={[styles.label, isDarkMode && styles.textDark]}>{label}</Text>
      <TextInput
        style={[styles.input, isDarkMode && styles.inputDark]}
        onChangeText={(text) => field in formData && handleChange(field as keyof FormData, text)}
        value={field in formData ? (formData[field as keyof FormData] as string) : ''}
        placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
        editable={!hasSubmitted}
        selectTextOnFocus={!hasSubmitted}
        {...options}
      />
    </View>
  );

  const renderCheckbox = (
    label: string,
    field: keyof FormData,
    description?: string,
    index: number
  ) => (
    <TouchableOpacity
      key={`checkbox-${field}-${index}`}
      style={[styles.checkboxContainer, hasSubmitted && styles.disabled]}
      onPress={() => handleCheckbox(field)}
      disabled={hasSubmitted}>
      <View
        style={[
          styles.checkbox,
          isDarkMode && styles.checkboxDark,
          formData[field] && styles.checkboxChecked,
        ]}
      />
      <Text style={[styles.checkboxLabel, isDarkMode && styles.textDark]}>
        {label}
        {description && `: ${description}`}
      </Text>
    </TouchableOpacity>
  );

  const renderRadio = (field: keyof FormData, options: Field['options'], index: number) => (
    <View key={`radio-${field}-${index}`}>
      {options?.custom?.map((item, itemIndex) => (
        <TouchableOpacity
          key={`radio-${field}-${item.value}-${itemIndex}`}
          style={[
            styles.checkboxContainer,
            { alignItems: 'flex-start', marginBottom: 12 },
            hasSubmitted && styles.disabled,
          ]}
          onPress={() => handleChange(field, item.value)}
          disabled={hasSubmitted}>
          <View
            style={[
              styles.checkbox,
              isDarkMode && styles.checkboxDark,
              formData[field] === item.value && styles.checkboxChecked,
            ]}
          />
          <Text style={[styles.checkboxLabel, isDarkMode && styles.textDark]}>
            {item.value}: {item.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleNext = async () => {
    if (isLast && !hasSubmitted) {
      const success = await handleSubmit();
      if (success) {
        navigation.navigate('Welcome');
      }
    } else if (nextScreen) {
      navigation.navigate(nextScreen);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>{title}</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          style={[styles.container, isDarkMode && styles.containerDark]}
          contentContainerStyle={{ paddingBottom: 100 }}>
          {fields.map((field, index) =>
            field.type === 'checkbox'
              ? renderCheckbox(field.label, field.name as keyof FormData, undefined, index)
              : field.type === 'radio'
                ? renderRadio(field.name as keyof FormData, field.options, index)
                : renderInput(field.label, field.name, field.options, index)
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                isDarkMode && styles.nextButtonDark,
                hasSubmitted && isLast && styles.disabled,
              ]}
              onPress={handleNext}
              disabled={hasSubmitted && isLast}>
              <Text style={styles.nextButtonText}>{isLast ? 'Submit' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Welcome Screen Component
const WelcomeScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
      <View style={[styles.container, isDarkMode && styles.containerDark, styles.centerContent]}>
        <Text style={[styles.welcomeTitle, isDarkMode && styles.textDark]}>Welcome, Legend!</Text>
        <Text style={[styles.welcomeText, isDarkMode && styles.textDark]}>
          Your intake form has been submitted successfully. Let's start your fitness journey!
        </Text>
        <TouchableOpacity
          style={[styles.nextButton, isDarkMode && styles.nextButtonDark]}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.nextButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Main Intake Form Component
const IntakeForm: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    ...initialFormState,
    email: user?.email || '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const checkExistingForm = async () => {
      if (!user?.email) return;

      try {
        setIsLoading(true);
        const docRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData({ ...initialFormState, ...(docSnap.data() as DocumentData) });
          setHasSubmitted(true);
        }
      } catch (error) {
        console.error('Error checking existing form:', error);
        Alert.alert('Error', 'Failed to load existing form data.');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingForm();
  }, [user?.email]);

  const handleSubmit = async (): Promise<boolean> => {
    if (!user?.email) {
      Alert.alert('Error', 'Please login first');
      return false;
    }

    if (hasSubmitted) {
      Alert.alert('Already Submitted', 'You have already submitted the intake form.');
      return false;
    }

    try {
      const formDataToSubmit = {
        ...formData,
        email: user.email.toLowerCase(),
        timestamp: new Date(),
      };

      await setDoc(doc(db, 'intakeForms', user.email.toLowerCase()), formDataToSubmit);

      setHasSubmitted(true);
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Error', 'Failed to submit form. Please try again.');
      return false;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark, styles.centerContent]}>
        <Text style={[styles.text, isDarkMode && styles.textDark]}>Loading...</Text>
      </View>
    );
  }

  const screens = [
    {
      name: 'Address',
      title: 'Address Details',
      fields: [
        { name: 'street', label: 'Street and house number', options: {} },
        { name: 'postalCode', label: 'Postal code', options: {} },
        { name: 'city', label: 'City', options: {} },
        { name: 'country', label: 'Country', options: {} },
      ],
      nextScreen: 'PersonalInfo',
      progress: 0.08,
    },
    {
      name: 'PersonalInfo',
      title: 'Personal Information',
      fields: [
        { name: 'fullName', label: 'Full name', options: {} },
        { name: 'age', label: 'Age', options: { keyboardType: 'numeric' } },
        { name: 'height', label: 'Height', options: {} },
        { name: 'weight', label: 'Weight', options: {} },
        { name: 'bodyFat', label: 'Body Fat % (if known)', options: {} },
        {
          name: 'strengthTrainingExperience',
          label: 'Do you have experience with strength training?',
          options: { multiline: true },
        },
      ],
      nextScreen: 'StrengthLevel',
      progress: 0.16,
    },
    {
      name: 'StrengthLevel',
      title: 'Strength Level',
      fields: [
        { name: 'benchPress', label: 'Barbell Bench Press (kg x reps)', options: {} },
        { name: 'squat', label: 'Back Squat (kg x reps)', options: {} },
        { name: 'chinUp', label: 'Chin-up (kg x reps)', options: {} },
        { name: 'deadlift', label: 'Deadlift (kg x reps)', options: {} },
        { name: 'overheadPress', label: 'Barbell Overhead Press (kg x reps)', options: {} },
        {
          name: 'exerciseCompetency',
          label: 'How would you rate your competency on the aforementioned exercises?',
          type: 'radio',
          options: {
            custom: [
              { value: 'Novice', description: 'Questionable Technique' },
              { value: 'Intermediate', description: 'Reasonably Competent' },
              { value: 'Advanced', description: 'Highly Competent' },
            ],
          },
        },
      ],
      nextScreen: 'Goals',
      progress: 0.24,
    },
    {
      name: 'Goals',
      title: 'Your Goals',
      fields: [
        {
          name: 'goals',
          label: 'What are your top 3 goals? (combine into one answer)',
          options: { multiline: true },
        },
        {
          name: 'obstacle',
          label: 'What is your number 1 obstacle?',
          options: { multiline: true },
        },
        {
          name: 'otherExercises',
          label: 'Will you be performing any other form of exercise alongside strength training?',
          options: { multiline: true },
        },
        {
          name: 'dedicationLevel',
          label: 'Dedication Level',
          type: 'radio',
          options: {
            custom: [
              { value: 'A', description: 'Steady and sustainable' },
              { value: 'B', description: 'Balanced pace' },
              { value: 'C', description: 'Max results at all cost' },
            ],
          },
        },
        {
          name: 'weeklyFrequency',
          label: 'How often in a week would you be prepared to train for maximal results?',
          options: {},
        },
      ],
      nextScreen: 'Misc',
      progress: 0.32,
    },
    {
      name: 'Misc',
      title: 'Miscellaneous',
      fields: [
        { name: 'occupation', label: 'What is your occupation?', options: {} },
        {
          name: 'medicalConditions',
          label: 'Please list any medical conditions or injuries',
          options: { multiline: true },
        },
        { name: 'specialDiet', label: 'Do you currently follow any special diet?', options: {} },
      ],
      nextScreen: 'Lifestyle',
      progress: 0.4,
    },
    {
      name: 'Lifestyle',
      title: 'Lifestyle',
      fields: [
        {
          name: 'trainingTimePreference',
          label: 'Training time preference',
          options: { multiline: true },
        },
        {
          name: 'activityLevel',
          label: 'Activity Level (excluding exercise)',
          type: 'radio',
          options: {
            custom: [
              { value: 'Sedentary', description: '(e.g. office job), below 7,500 steps/day' },
              {
                value: 'Somewhat active',
                description:
                  '(e.g. you walk your dog several times a day or you commute by bicycle/on foot), 7,500 – 9,999 steps/day',
              },
              {
                value: 'Active',
                description:
                  '(e.g. full-time PT, literally on your feet most of the day), 10,000 – 12,500 steps/day',
              },
              {
                value: 'Very active',
                description:
                  '(e.g. involved in physical labour), over 12,500 steps/day with intensive movement',
              },
            ],
          },
        },
        {
          name: 'stressLevel',
          label: 'Stress Level',
          type: 'radio',
          options: {
            custom: [
              { value: 'Stress-free', description: '(e.g. on holiday)' },
              { value: 'Mild', description: '(e.g. student not during exam period)' },
              { value: 'Average', description: '(e.g. full-time work with deadlines/commuting)' },
              {
                value: 'High',
                description: '(e.g. very high-paced work environment with great responsibility)',
              },
            ],
          },
        },
        { name: 'sleepQuality', label: 'Sleep Quality', options: {} },
        { name: 'caffeineIntake', label: 'Caffeine Intake (Daily Avg)', options: {} },
        {
          name: 'menstrualCycle',
          label: 'Menstrual Cycle & Contraception',
          options: { multiline: true },
        },
      ],
      nextScreen: 'Equipment',
      progress: 0.48,
    },
    {
      name: 'Equipment',
      title: 'Equipment Access',
      fields: [
        { name: 'squatRack', label: 'Squat cage or rack', type: 'checkbox' },
        { name: 'hyperBench', label: '45° hyperextension bench', type: 'checkbox' },
        { name: 'gluteHam', label: 'Glute-ham raise', type: 'checkbox' },
        { name: 'standingCalf', label: 'Standing calf raise machine', type: 'checkbox' },
        { name: 'dipBelt', label: 'Dip/chin-up belt', type: 'checkbox' },
        { name: 'legCurl', label: 'Leg curl machine (seated/lying/standing)', type: 'checkbox' },
        { name: 'gymRings', label: 'Gymnastic rings', type: 'checkbox' },
        { name: 'trx', label: 'TRX or similar suspension device', type: 'checkbox' },
        { name: 'resistanceBands', label: 'Resistance bands', type: 'checkbox' },
        { name: 'pullUpBar', label: 'Pull-up bar', type: 'checkbox' },
        { name: 'seatedCalf', label: 'Seated calf raise machine', type: 'checkbox' },
        { name: 'cableTower', label: 'Cable tower', type: 'checkbox' },
      ],
      nextScreen: 'Supplements',
      progress: 0.56,
    },
    {
      name: 'Supplements',
      title: 'Supplements',
      fields: [
        {
          name: 'supplements',
          label: 'Please list all the supplements you are currently taking.',
          options: { multiline: true },
        },
      ],
      nextScreen: 'Genetics',
      progress: 0.64,
    },
    {
      name: 'Genetics',
      title: 'Genetics',
      fields: [
        { name: 'wristCircumference', label: 'Wrist circumference (smallest point)', options: {} },
        { name: 'ankleCircumference', label: 'Ankle circumference (smallest point)', options: {} },
      ],
      nextScreen: 'CurrentProgram',
      progress: 0.72,
    },
    {
      name: 'CurrentProgram',
      title: 'Current Program',
      fields: [
        {
          name: 'typicalDiet',
          label: 'Describe your eating habits',
          options: { multiline: true },
        },
        {
          name: 'currentTraining',
          label: 'Describe current program',
          options: { multiline: true },
        },
      ],
      nextScreen: 'StrikeAPose',
      progress: 0.8,
    },
    {
      name: 'StrikeAPose',
      title: 'Strike a Pose',
      fields: [
        {
          name: 'photoFront' as any, // TODO: Not linked to Firestore, safe to ignore
          label: 'Front Photo (Optional)',
          options: { multiline: true },
        },
        {
          name: 'photoBack' as any, // TODO: Not linked to Firestore, safe to ignore
          label: 'Back Photo (Optional)',
          options: { multiline: true },
        },
        {
          name: 'photoSideLeft' as any, // TODO: Not linked to Firestore, safe to ignore
          label: 'Side Left Photo (Optional)',
          options: { multiline: true },
        },
        {
          name: 'photoSideRight' as any, // TODO: Not linked to Firestore, safe to ignore
          label: 'Side Right Photo (Optional)',
          options: { multiline: true },
        },
      ],
      isLast: true,
      progress: 1.0,
      // TODO: Add 4 photo uploads (front, back, side-left, side-right) using Expo ImagePicker
    },
  ];

  return (
    <FormContext.Provider value={{ formData, setFormData, hasSubmitted, handleSubmit }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: isDarkMode ? '#111827' : '#ffffff' },
        }}>
        {screens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name as keyof RootStackParamList}
            component={FormScreen}
            initialParams={{
              fields: screen.fields,
              title: screen.title,
              nextScreen: screen.nextScreen,
              isLast: screen.isLast || false,
              progress: screen.progress,
            }}
          />
        ))}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      </Stack.Navigator>
    </FormContext.Provider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerDark: {
    backgroundColor: '#111827',
    borderBottomColor: '#374151',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: '#000000',
  },
  textDark: {
    color: '#ffffff',
  },
  text: {
    fontSize: 16,
    color: '#000000',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#ffffff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 6,
    marginRight: 12,
  },
  checkboxDark: {
    borderColor: '#9ca3af',
    backgroundColor: '#1f2937',
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonDark: {
    backgroundColor: '#4338ca',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IntakeForm;
