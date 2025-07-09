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
  ImageBackground,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { NavigationProp } from '@react-navigation/native';
import IntroRectangle from '../assets/IntroRectangle.png';
import IntroBottom from '../assets/IntroBottom.png'; // <-- Add this import
import { LinearGradient } from 'expo-linear-gradient'; // Add this import
import Slider from '@react-native-community/slider';

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
  obstacle?: string;
  otherExercises?: string;
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
  measurementSystem: 'imperial' | 'metric' | ''; // <-- Add this
  strengthCompetency?: number;
  strengthCompetencyComments?: string;
  goal1?: string;
  goal2?: string;
  goal3?: string;
  skinfoldCalipers: string;
  hasMyoTape: boolean;
  fitnessTech: string;
  cardioEquipment: string[];
  legCurlType: string;
  cableTowerAdjustable: string;
  equipmentDifference: string;
  currentTrainingFile?: { name: string; uri: string };
  photos?: { uri: string; name: string }[];
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
  goal1: '',
  goal2: '',
  goal3: '',
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
  measurementSystem: '', // <-- Add this
  strengthCompetency: 1,
  strengthCompetencyComments: '',
  skinfoldCalipers: '',
  hasMyoTape: false,
  fitnessTech: '',
  cardioEquipment: [],
  legCurlType: '',
  cableTowerAdjustable: '',
  equipmentDifference: '',
  currentTrainingFile: undefined,
  photos: [],
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

// --- Add this new component above IntakeForm ---
const IntroScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const SCREEN_INDEX = 1; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#1A2330' }}>
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View style={introStyles.content}>
        <Text style={introStyles.title}>
          Hey there,{'\n'}legend! <Text style={{ fontSize: 50 }}>💪</Text>
        </Text>
        <ImageBackground
          source={IntroRectangle}
          style={[
            introStyles.card,
            {
              width: '105%',
              marginLeft: 38,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 520,
              justifyContent: 'center',
              backgroundColor: undefined,
            },
          ]}
          imageStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            resizeMode: 'stretch',
          }}>
          <View
            style={{
              paddingVertical: 32,
              paddingHorizontal: 18,
              width: '100%',
              alignItems: 'center',
            }}>
            <Text
              style={[
                introStyles.text,
                {
                  marginBottom: 12,
                  fontSize: 17,
                  color: '#232946',
                  backgroundColor: 'transparent',
                  textAlign: 'center',
                  marginRight: 29,
                },
              ]}>
              Before we jump into building your dream program, we just need a few answers from
              you—nothing too wild, promise!
            </Text>
            <Text
              style={[
                introStyles.subtext,
                {
                  fontSize: 14,
                  color: '#232946',
                  backgroundColor: 'transparent',
                  textAlign: 'center',
                  marginRight: 30,
                },
              ]}>
              Think of this like giving your future self a high-five. Your honest responses help us
              tailor everything just for you—from training to nutrition and everything in between!
            </Text>
            <TouchableOpacity
              style={introStyles.button}
              onPress={() => navigation.navigate('MeasurementSystem')}>
              <Text style={introStyles.buttonText}>Dive In!</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130, // Adjust height as needed for your asset
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7, // Make the lower one a bit transparent for a layered effect
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120, // Same height as above
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }], // Mirror horizontally
          tintColor: '#ffff', // Make it brighter (white overlay)
        }}
      />
    </SafeAreaView>
  );
};

const introStyles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 55,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 32,
  },
  card: {
    borderRadius: 32,
    padding: 28,
    width: '150%', // Increased from '88%' to '98%'
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  text: {
    color: '#000000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
    backgroundColor: 'transparent', // No white bg
    borderRadius: 8,
    padding: 6,
  },
  subtext: {
    color: '#000000',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    backgroundColor: 'transparent', // No white bg
    borderRadius: 8,
    padding: 6,
  },
  button: {
    backgroundColor: '#1A2330',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 25,
    width: '90%',
    alignItems: 'center',
    marginTop: 17,
    marginRight: 27,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

// Measurement System Screen Component
const MeasurementSystemScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const { formData, setFormData } = useFormContext();
  const SCREEN_INDEX = 2; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  const handleSelect = (system: 'imperial' | 'metric') => {
    setFormData((prev) => ({ ...prev, measurementSystem: system }));
    navigation.navigate('HeightWeight');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#1A2330' }}>
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 379,
            height: 555,
            position: 'relative',
            top: 0,
            left: 0,
            borderRadius: 109,
            borderWidth: 0.3,
            borderColor: '#e5e5e5',
            backgroundColor: '#081A2FC9',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
            overflow: 'hidden',
          }}>
          <View
            style={{
              zIndex: 2,
              width: '100%',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }}>
            <Text
              style={{
                color: '#fff',
                fontSize: 22,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 48,
                marginTop: 10,
              }}>
              Preferred Measurement{'\n'}System
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 24,
                backgroundColor: 'transparent',
              }}>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#fff',
                  borderRadius: 20,
                  paddingVertical: 10,
                  paddingHorizontal: 28,
                  marginRight: 18,
                }}
                onPress={() => handleSelect('imperial')}>
                <Text style={{ color: '#fff', fontSize: 16 }}>Imperial</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#fff',
                  borderRadius: 20,
                  paddingVertical: 10,
                  paddingHorizontal: 28,
                  marginLeft: 18,
                }}
                onPress={() => handleSelect('metric')}>
                <Text style={{ color: '#fff', fontSize: 16 }}>Metric</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Height Weight Screen Component
const HeightWeightScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const { formData, setFormData } = useFormContext();
  const SCREEN_INDEX = 3; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Determine units based on measurement system
  const isImperial = formData.measurementSystem === 'imperial';
  const heightUnit = isImperial ? 'ft.in' : 'cm';
  const weightUnit = isImperial ? 'lbs' : 'kgs';

  return (
    <SafeAreaView style={heightWeightStyles.container}>
      {/* Progress Bar */}
      <View style={heightWeightStyles.progressBar}>
        <View style={heightWeightStyles.progress} />
      </View>
      <View style={heightWeightStyles.content}>
        <View style={heightWeightStyles.card}>
          {/* Arrows at extreme corners */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={heightWeightStyles.backArrow}>
            <Ionicons name="chevron-back" size={36} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('BodyFat')}
            style={heightWeightStyles.forwardArrow}>
            <Ionicons name="chevron-forward" size={36} color="#fff" />
          </TouchableOpacity>
          {/* Centered height and weight with equal spacing */}
          <View style={heightWeightStyles.inputContainer}>
            <View style={heightWeightStyles.inputGroup}>
              <Text style={heightWeightStyles.label}>Height</Text>
              <View style={heightWeightStyles.inputWrapper}>
                <TextInput
                  style={[heightWeightStyles.input, { paddingRight: 40 }]} // add right padding for the unit
                  value={formData.height}
                  onChangeText={(val) => setFormData((prev) => ({ ...prev, height: val }))}
                  keyboardType="numeric"
                />
                <Text
                  style={{
                    position: 'absolute',
                    right: 18,
                    top: 0,
                    bottom: 0,
                    textAlignVertical: 'center',
                    color: '#232946',
                    fontSize: 16,
                    fontWeight: 'bold',
                    height: 33,
                    lineHeight: 33,
                  }}
                  pointerEvents="none">
                  {heightUnit}
                </Text>
              </View>
            </View>
            <View style={[heightWeightStyles.inputGroup, { marginTop: 18 }]}>
              <Text style={heightWeightStyles.label}>Weight</Text>
              <View style={heightWeightStyles.inputWrapper}>
                <TextInput
                  style={[heightWeightStyles.input, { paddingRight: 40 }]}
                  value={formData.weight}
                  onChangeText={(val) => setFormData((prev) => ({ ...prev, weight: val }))}
                  keyboardType="numeric"
                  placeholder={weightUnit}
                  placeholderTextColor="#9ca3af"
                />
                <Text
                  style={{
                    position: 'absolute',
                    right: 18,
                    top: 0,
                    bottom: 0,
                    textAlignVertical: 'center',
                    color: '#232946',
                    fontSize: 16,
                    fontWeight: 'bold',
                    height: 33,
                    lineHeight: 33,
                  }}
                  pointerEvents="none">
                  {weightUnit}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const heightWeightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2330',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    borderRadius: 3,
    marginTop: 32,
  },
  progress: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 3,
    width: '7.6923%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 379,
    height: 555,
    borderRadius: 109,
    borderWidth: 0.3,
    borderColor: '#e5e5e5',
    backgroundColor: '#081A2FC9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  backArrow: {
    position: 'absolute',
    left: 5,
    top: '50%',
    transform: [{ translateY: -18 }],
    zIndex: 10,
  },
  forwardArrow: {
    position: 'absolute',
    right: 5,
    top: '50%',
    transform: [{ translateY: -18 }],
    zIndex: 10,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 80,
  },
  inputGroup: {
    alignItems: 'center',
    paddingRight: 5,
  },
  label: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    height: 33,
    width: 261,
    fontSize: 18,
    color: '#232946',
    marginRight: 8,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 10,
    borderWidth: 0,
  },
  unit: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Body Fat Screen Component
const BodyFatScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const { formData, setFormData } = useFormContext();
  const SCREEN_INDEX = 4; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  return (
    <SafeAreaView style={heightWeightStyles.container}>
      {/* Progress Bar */}
      <View style={heightWeightStyles.progressBar}>
        <View style={[heightWeightStyles.progress, { width: progressWidth }]} />
      </View>
      <View style={heightWeightStyles.content}>
        <View style={heightWeightStyles.card}>
          {/* Arrows at extreme corners */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={heightWeightStyles.backArrow}>
            <Ionicons name="chevron-back" size={36} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Experience')}
            style={heightWeightStyles.forwardArrow}>
            <Ionicons name="chevron-forward" size={36} color="#fff" />
          </TouchableOpacity>
          {/* Centered Body Fat input */}
          <View style={[heightWeightStyles.inputContainer, { justifyContent: 'center' }]}>
            <Text style={heightWeightStyles.label}>Body Fat Percentage (if known)</Text>
            <View
              style={[heightWeightStyles.inputWrapper, { marginTop: 18, position: 'relative' }]}>
              <TextInput
                style={[heightWeightStyles.input, { paddingRight: 40 }]}
                value={formData.bodyFat}
                onChangeText={(val) => setFormData((prev) => ({ ...prev, bodyFat: val }))}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
              <Text
                style={{
                  position: 'absolute',
                  right: 18,
                  top: 0,
                  bottom: 0,
                  textAlignVertical: 'center',
                  color: '#232946',
                  fontSize: 16,
                  fontWeight: 'bold',
                  height: 33,
                  lineHeight: 33,
                }}
                pointerEvents="none">
                %
              </Text>
            </View>
          </View>
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

// --- Place this above IntakeForm ---
const ExperienceScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const { formData, setFormData } = useFormContext();
  const SCREEN_INDEX = 5; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  return (
    <SafeAreaView style={heightWeightStyles.container}>
      {/* Progress Bar */}
      <View style={heightWeightStyles.progressBar}>
        <View style={[heightWeightStyles.progress, { width: progressWidth }]} />
      </View>
      <View style={heightWeightStyles.content}>
        <View style={heightWeightStyles.card}>
          <Text
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 48,
              marginTop: 10,
              textShadowColor: 'rgba(0,0,0,0.18)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 16,
            }}>
            Experience in{'\n'}Strength Training?
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#fff',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 38,
                marginRight: 18,
                backgroundColor:
                  formData.strengthTrainingExperience === 'Yes' ? '#fff' : 'transparent',
              }}
              onPress={() => {
                setFormData((prev) => ({ ...prev, strengthTrainingExperience: 'Yes' }));
                navigation.navigate('StrengthCongrats'); // DreamBig will be 9th after StrengthCongrats and StrengthLevel etc.
              }}>
              <Text
                style={{
                  color: formData.strengthTrainingExperience === 'Yes' ? '#1A2330' : '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#fff',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 38,
                marginLeft: 18,
                backgroundColor:
                  formData.strengthTrainingExperience === 'No' ? '#fff' : 'transparent',
              }}
              onPress={() => {
                setFormData((prev) => ({ ...prev, strengthTrainingExperience: 'No' }));
                navigation.navigate('DreamBig', { screenIndex: 6 }); // DreamBig is 6th if No
              }}>
              <Text
                style={{
                  color: formData.strengthTrainingExperience === 'No' ? '#1A2330' : '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Place this above IntakeForm ---

const StrengthCongratsScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const SCREEN_INDEX = 6; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Radial Gradient Background */}
      <LinearGradient
        // Simulate radial by using a circular gradient with stops
        colors={['#FFFFFF', '#081A2F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: -1 }}
        end={{ x: 0.3, y: 0.5 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 36,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 12,
            marginTop: 32,
            textShadowColor: 'rgba(0,0,0,0.18)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 16,
            textDecorationColor: '#3B82F6',
            textDecorationStyle: 'solid',
            textDecorationThickness: 4,
          }}>
          That’s Great!
        </Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 22,
            textAlign: 'center',
            marginBottom: 20,
            marginTop: 24,
          }}>
          Tell us about your{'\n'}strength game!
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 40,
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
          }}
          onPress={() => navigation.navigate('StrengthLevel', { fromCongrats: true })}>
          <Ionicons name="chevron-forward" size={48} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const StrengthLevelScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const { formData, setFormData } = useFormContext();
  const SCREEN_INDEX = 7; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // List of exercises
  const exercises = [
    {
      key: 'benchPress',
      label: 'Barbell Bench Press',
      weightField: 'benchPressWeight',
      repsField: 'benchPressReps',
    },
    {
      key: 'squat',
      label: 'Back Squat',
      weightField: 'squatWeight',
      repsField: 'squatReps',
    },
    {
      key: 'chinUp',
      label: 'Chin Up',
      weightField: 'chinUpWeight',
      repsField: 'chinUpReps',
      description: '(Weight means any load in addition to body weight. 0 if just bodyweight.)',
    },
    {
      key: 'deadlift',
      label: 'Deadlift',
      weightField: 'deadliftWeight',
      repsField: 'deadliftReps',
    },
    {
      key: 'overheadPress',
      label: 'Barbell Overhead Press',
      weightField: 'overheadPressWeight',
      repsField: 'overheadPressReps',
    },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Navigation handlers for arrows
  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('StrengthCompetency', { fromCongrats: true });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Radial Gradient Background */}
      <LinearGradient
        colors={['#081A2F', '#cccccc']} // Blue at top, white at bottom
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }} // Top
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View style={heightWeightStyles.progressBar}>
        <View style={[heightWeightStyles.progress, { width: progressWidth }]} />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'box-none',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: [{ translateY: -30 }],
              zIndex: 10,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: [{ translateY: -30 }],
              zIndex: 10,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Scrollable Exercises */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 24,
            width: '100%',
          }}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {exercises.map((exercise, idx) => (
            <View
              key={exercise.key}
              style={{
                width: 290,
                minHeight: 180,
                borderRadius: 30,
                backgroundColor: '#081A2FCC',
                borderWidth: 0,
                borderColor: '#e5e5e5',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 22,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 4,
                marginBottom: 22,
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 18,
                }}>
                {exercise.label}
              </Text>
              {exercise.description && (
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 13,
                    textAlign: 'center',
                    marginBottom: 8,
                    paddingHorizontal: 8,
                  }}>
                  {exercise.description}
                </Text>
              )}
              {/* Weight Input */}
              <TextInput
                style={{
                  backgroundColor: '#19233a',
                  borderRadius: 16,
                  height: 36,
                  width: 220,
                  fontSize: 16,
                  color: '#fff',
                  textAlign: 'center',
                  borderWidth: 0,
                  marginBottom: 12,
                  alignSelf: 'center',
                }}
                value={formData[exercise.weightField] || ''}
                onChangeText={(val) => handleChange(exercise.weightField, val)}
                keyboardType="numeric"
                placeholder="Weight"
                placeholderTextColor="#b0b8c1"
              />
              {/* Reps Input */}
              <TextInput
                style={{
                  backgroundColor: '#19233a',
                  borderRadius: 16,
                  height: 36,
                  width: 220,
                  fontSize: 16,
                  color: '#fff',
                  textAlign: 'center',
                  borderWidth: 0,
                  alignSelf: 'center',
                }}
                value={formData[exercise.repsField] || ''}
                onChangeText={(val) => handleChange(exercise.repsField, val)}
                keyboardType="numeric"
                placeholder="Reps"
                placeholderTextColor="#9ca3af"
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const StrengthCompetencyScreen: React.FC<{ navigation: NavigationProp<RootStackParamList> }> = ({
  navigation,
}) => {
  const { formData, setFormData } = useFormContext();
  const [competency, setCompetency] = React.useState(formData.strengthCompetency ?? 1);
  const [comments, setComments] = React.useState(formData.strengthCompetencyComments ?? '');
  const SCREEN_INDEX = 8; // this screen's position in the flow
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      strengthCompetency: competency,
      strengthCompetencyComments: comments,
    }));
  }, [competency, comments]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('DreamBig', { screenIndex: 9 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        // Simulate radial by using a circular gradient with stops
        colors={['#FFFFFF', '#081A2F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: -1 }}
        end={{ x: 0.3, y: 0.5 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View style={heightWeightStyles.progressBar}>
        <View style={[heightWeightStyles.progress, { width: progressWidth }]} />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }}>
        {/* Arrows */}
        <View
          style={{
            width: '100%',
            position: 'absolute',
            top: '-25%',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'box-none',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              position: 'absolute',
              left: 0,
              zIndex: 10,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              position: 'absolute',
              right: -5,

              zIndex: 10,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <Text
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 50,
            marginTop: 32,
          }}>
          How would you rate your{'\n'}competency on the mentioned{'\n'}exercises?*
        </Text>
        {/* Slider */}
        <View style={{ width: '92%', alignItems: 'center', marginBottom: 50 }}>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={1}
            maximumValue={3}
            step={1}
            minimumTrackTintColor="#E11D48"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#E11D48"
            value={competency}
            onValueChange={setCompetency}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: 2,
            }}>
            <Text style={{ color: '#fff', fontSize: 12, width: 90, textAlign: 'left' }}>
              Novice{'\n'}(Questionable{'\n'}Technique)
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, width: 110, textAlign: 'center' }}>
              Intermediate{'\n'}(Reasonably{'\n'}Competent but could{'\n'}Improve)
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, width: 110, textAlign: 'right' }}>
              Advanced{'\n'}(Highly competent,{'\n'}with months/years{'\n'}of consistent{'\n'}
              application)
            </Text>
          </View>
        </View>
        {/* Comments */}
        <Text
          style={{
            color: '#fff',
            fontSize: 15,
            marginTop: 30,
            marginBottom: 8,
            textAlign: 'center',
          }}>
          Comments? (Add any context to your training history)
        </Text>
        <TextInput
          style={{
            backgroundColor: 'transparent',
            borderColor: '#b0b8c1',
            borderWidth: 1,
            borderRadius: 14,
            minHeight: 48,
            width: '92%',
            color: '#fff',
            paddingHorizontal: 14,
            paddingVertical: 8,
            fontSize: 15,
            marginBottom: 18,
            textAlignVertical: 'top',
          }}
          value={comments}
          onChangeText={setComments}
          placeholder="Add comments..."
          placeholderTextColor="#b0b8c1"
          multiline
        />
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const DreamBigScreen: React.FC<{ navigation: NavigationProp<RootStackParamList>; route: any }> = ({
  navigation,
  route,
}) => {
  const SCREEN_INDEX = route?.params?.screenIndex ?? 9;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        // Simulate radial by using a circular gradient with stops
        colors={['#FFFFFF', '#081A2F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: -1 }}
        end={{ x: 0.3, y: 0.5 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 80,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 60,
            marginTop: 25,
          }}>
          Dream{'\n'}Big!
        </Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 24,
          }}>
          Whether it’s six-pack abs, lifting Thor’s hammer, or just feeling awesome, let us know
          what you’re chasing.
        </Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 25,
            textAlign: 'center',
            marginBottom: 32,
            fontWeight: '600',
          }}>
          We’re all ears! <Text style={{ fontSize: 28 }}>🌟</Text>
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 10,
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
          }}
          onPress={() => navigation.navigate('TopGoals')}>
          <Ionicons name="chevron-forward" size={48} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const TopGoalsScreen: React.FC<{ navigation: NavigationProp<RootStackParamList>; route: any }> = ({
  navigation,
  route,
}) => {
  const { formData, setFormData } = useFormContext();
  const [goal1, setGoal1] = React.useState(formData.goal1 ?? '');
  const [goal2, setGoal2] = React.useState(formData.goal2 ?? '');
  const [goal3, setGoal3] = React.useState(formData.goal3 ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 10;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      goal1,
      goal2,
      goal3,
    }));
  }, [goal1, goal2, goal3]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('ObstacleExercise', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 32,
            marginTop: 32,
          }}>
          What are your top 3 Goals?
        </Text>
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 300,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 18,
              paddingHorizontal: 18,
            }}
            value={goal1}
            onChangeText={setGoal1}
            placeholder="Goal 1"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 18,
              paddingHorizontal: 18,
            }}
            value={goal2}
            onChangeText={setGoal2}
            placeholder="Goal 2"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
            }}
            value={goal3}
            onChangeText={setGoal3}
            placeholder="Goal 3"
            placeholderTextColor="#9ca3af"
          />
        </View>
        {/* Arrows */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '47%', // Adjust top position as needed
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35, // Small padding from the left edge
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35, // Small padding from the right edge
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const ObstacleExerciseScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [obstacle, setObstacle] = React.useState(formData.obstacle ?? '');
  const [otherExercises, setOtherExercises] = React.useState(formData.otherExercises ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 11;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      obstacle,
      otherExercises,
    }));
  }, [obstacle, otherExercises]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('DedicationLevel', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#6b6b6b']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '42%', // Adjust top position as needed
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35, // Small padding from the left edge
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35, // Small padding from the right edge
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            height: 180,
            maxWidth: 320,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 16,
            }}>
            What is you number one obstacle?
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 24,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={obstacle}
            onChangeText={setObstacle}
            placeholder="Enter your obstacle"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            height: 220,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
            marginTop: 70,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 16,
            }}>
            Will you be performing any other form of exercise alongside strength training (e.g.
            running, football, yoga)?*
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={otherExercises}
            onChangeText={setOtherExercises}
            placeholder="Enter other exercises"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const DedicationLevelScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [dedicationLevel, setDedicationLevel] = React.useState(formData.dedicationLevel ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 12;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      dedicationLevel,
    }));
  }, [dedicationLevel]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('WeeklyFrequency', { screenIndex: SCREEN_INDEX + 1 });

  const dedicationOptions = [
    {
      value: 'A',
      label:
        'Steady and sustainability is most important to me. As long as I’m moving in the right direction, I don’t mind about the rate of progress.',
    },
    {
      value: 'B',
      label: 'I want to achieve results at a good pace whilst maintaining a balanced lifestyle.',
    },
    {
      value: 'C',
      label:
        'I will do whatever it takes to achieve maximum results without compromising my health.',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#6b6b6b']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '80%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 0,
            }}>
            <Ionicons name="chevron-back" size={40} color="#232946" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 0,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#232946" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <ImageBackground
          source={IntroRectangle}
          style={[
            introStyles.card,
            {
              width: '110%',
              marginLeft: 25,
              marginTop: 130,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 550,
              justifyContent: 'center',
            },
          ]}
          imageStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            resizeMode: 'stretch',
          }}>
          <Text
            style={{
              color: '#232946',
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 24,
              marginTop: 6,
              marginRight: 10,
            }}>
            What’s your dedication level?*
          </Text>
          {dedicationOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setDedicationLevel(option.value)}
              style={{
                backgroundColor: dedicationLevel === option.value ? '#E11D48' : '#f3f4f6',
                borderRadius: 12,
                padding: 16,
                marginRight: 10,
                marginBottom: 25,
                width: 280,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: dedicationLevel === option.value ? 2 : 0,
                borderColor: dedicationLevel === option.value ? '#E11D48' : 'transparent',
              }}>
              <Text
                style={{
                  color: dedicationLevel === option.value ? '#fff' : '#232946',
                  fontSize: 12,
                  textAlign: 'center',
                }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ImageBackground>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const WeeklyFrequencyScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [frequency, setFrequency] = React.useState(
    formData.weeklyFrequency && !isNaN(Number(formData.weeklyFrequency))
      ? Number(formData.weeklyFrequency)
      : 1
  );
  const SCREEN_INDEX = route?.params?.screenIndex ?? 13;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      weeklyFrequency: String(frequency),
    }));
  }, [frequency]);

  const goBack = () => navigation.goBack('DedicationLevel');
  const goNext = () => navigation.navigate('Occupation', { screenIndex: SCREEN_INDEX + 1 });

  const increment = () => setFrequency((f) => Math.min(f + 1, 14));
  const decrement = () => setFrequency((f) => Math.max(f - 1, 1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '75%', // Adjust top position as needed
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35, // Small padding from the left edge
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35, // Small padding from the right edge
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <Text
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 32,
            marginTop: 32,
          }}>
          How often in a week would you be prepared to train for maximal results?{'\n'}
          <Text style={{ fontWeight: 'normal', fontSize: 14 }}>
            (A higher weekly training frequency means less time spent in the gym per session)
          </Text>
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#bfc3c7',
            borderRadius: 16,
            paddingHorizontal: 18,
            paddingVertical: 8,
            marginTop: 12,
            marginBottom: 32,
            minWidth: 180,
          }}>
          <TouchableOpacity
            onPress={decrement}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#232946',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 18,
            }}>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>-</Text>
          </TouchableOpacity>
          <Text
            style={{
              color: '#232946',
              fontSize: 28,
              fontWeight: 'bold',
              minWidth: 32,
              textAlign: 'center',
            }}>
            {frequency}
          </Text>
          <TouchableOpacity
            onPress={increment}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#232946',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 18,
            }}>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,

          bottom: 20,
          width: '100%',
          height: 135,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.4,
        }}
      />
    </SafeAreaView>
  );
};

const OccupationScreen: React.FC<{ navigation: NavigationProp<RootStackParamList>; oute: any }> = ({
  navigation,
  route,
}) => {
  const { formData, setFormData } = useFormContext();
  const [occupation, setOccupation] = React.useState(formData.occupation ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 14; // fallback to 11 if not passed
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      occupation,
    }));
  }, [occupation]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('DietMedical', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        // Simulate radial by using a circular gradient with stops
        colors={['#FFFFFF', '#081A2F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: -1 }}
        end={{ x: 0.3, y: 0.7 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '65%', // Adjust top position as needed
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35, // Small padding from the left edge
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35, // Small padding from the right edge
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            height: 220,
            maxWidth: 320,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 10,
            }}>
            What is your occupation?
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 14,
              opacity: 0.8,
            }}>
            The aim is to understand your circadian rhythm (physiological impact of your daily
            routine), stress and activity level.
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Enter your occupation"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const DietMedicalScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [specialDiet, setSpecialDiet] = React.useState(formData.specialDiet ?? '');
  const [medicalConditions, setMedicalConditions] = React.useState(
    formData.medicalConditions ?? ''
  );
  const SCREEN_INDEX = route?.params?.screenIndex ?? 15; // fallback to 11 if not passed
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      specialDiet,
      medicalConditions,
    }));
  }, [specialDiet, medicalConditions]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('LifestyleIntro', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '43%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            marginBottom: 50,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            Do you currently follow any special diet (e.g. ketogenic, vegan), or wish to follow any
            special diet as part of this coaching program?
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={specialDiet}
            onChangeText={setSpecialDiet}
            placeholder="Enter your diet details"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            Please list any medical conditions or injuries{'\n'}
            (including disabilities, allergies, illnesses, syndromes, disorders, etc.) you have or
            have had historically.
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={medicalConditions}
            onChangeText={setMedicalConditions}
            placeholder="Enter your medical conditions"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const LifestyleIntroScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const SCREEN_INDEX = route?.params?.screenIndex ?? 16; // fallback to 11 if not passed
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 50,
            fontWeight: 'bold',
            textAlign: 'center',

            marginTop: 40,
          }}>
          <Text style={{ fontSize: 50 }}>🧘‍♂️</Text> Lifestyle
        </Text>
        <ImageBackground
          source={IntroRectangle}
          style={[
            introStyles.card,
            {
              width: '113%',
              marginLeft: 16,
              marginTop: 110,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 550,
              justifyContent: 'center',
            },
          ]}
          imageStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            resizeMode: 'stretch',
          }}>
          <Text
            style={{
              color: '#232946',
              fontSize: 18,
              textAlign: 'center',
              marginBottom: 18,
              marginTop: 8,
              lineHeight: 26,
            }}>
            From sleep to stress, it’s the{'\n'}
            behind-the-scenes stuff that fuels{'\n'}
            your gains.
          </Text>
          <Text
            style={{
              color: '#232946',
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 0,
              marginTop: 12,
              lineHeight: 24,
            }}>
            Let’s take a peek at your day-to-day!
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 28,
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 70,
            }}
            onPress={() =>
              navigation.navigate('TrainingTimePreference', { screenIndex: SCREEN_INDEX + 1 })
            }>
            <Ionicons name="chevron-forward" size={70} color="#232946" />
          </TouchableOpacity>
        </ImageBackground>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const TrainingTimePreferenceScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [trainingTimePreference, setTrainingTimePreference] = React.useState(
    formData.trainingTimePreference ?? ''
  );
  const SCREEN_INDEX = route?.params?.screenIndex ?? 17;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      trainingTimePreference,
    }));
  }, [trainingTimePreference]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('StressLevel', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            Are there any times of day at which you are unable or unwilling to train, and outside of
            that, do you have a strong preference to train at a particular time of day?
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 14,
              opacity: 0.8,
            }}>
            This includes when you’re at work. If you don’t answer this question accurately with
            detailed times, you may get a program you can’t follow!*
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={trainingTimePreference}
            onChangeText={setTrainingTimePreference}
            placeholder="Enter your training time preference"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const StressLevelScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [stressLevel, setStressLevel] = React.useState(formData.stressLevel ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 18;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      stressLevel,
    }));
  }, [stressLevel]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('ActivityLevel', { screenIndex: SCREEN_INDEX + 1 });

  const stressOptions = [
    {
      value: 'Stress-free',
      label: 'Stress-free (e.g. on holiday)',
    },
    {
      value: 'Mild',
      label: 'Only occasional/mild stress (e.g. student not during exam period)',
    },
    {
      value: 'Average',
      label: 'Average stress (e.g. full-time work with deadlines/commuting)',
    },
    {
      value: 'High',
      label: 'High stress (e.g. very high-paced work environment with great responsibility)',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#6b6b6b']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '80%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 0,
            }}>
            <Ionicons name="chevron-back" size={40} color="#232946" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 0,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#232946" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <ImageBackground
          source={IntroRectangle}
          style={[
            introStyles.card,
            {
              width: '110%',
              marginLeft: 25,
              marginTop: 130,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 550,
              justifyContent: 'center',
            },
          ]}
          imageStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            resizeMode: 'stretch',
          }}>
          <Text
            style={{
              color: '#232946',
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 24,
              marginTop: 6,
              marginRight: 10,
            }}>
            Which of the following options best{'\n'}describes your stress level?*
          </Text>
          {stressOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setStressLevel(option.value)}
              style={{
                backgroundColor: stressLevel === option.value ? '#E11D48' : '#f3f4f6',
                borderRadius: 12,
                padding: 16,
                marginRight: 10,
                marginBottom: 18,
                width: 280,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: stressLevel === option.value ? 2 : 0,
                borderColor: stressLevel === option.value ? '#E11D48' : 'transparent',
              }}>
              <Text
                style={{
                  color: stressLevel === option.value ? '#fff' : '#232946',
                  fontSize: 13,
                  textAlign: 'center',
                }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ImageBackground>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const ActivityLevelScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [activityLevel, setActivityLevel] = React.useState(formData.activityLevel ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 19;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      activityLevel,
    }));
  }, [activityLevel]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('SleepQuality', { screenIndex: SCREEN_INDEX + 1 });

  const activityOptions = [
    {
      value: 'Sedentary',
      label: 'Sedentary (e.g. office job), below 7,500 steps/day',
    },
    {
      value: 'Somewhat active',
      label:
        'Somewhat active (e.g. you walk your dog several times a day or you commute by bicycle/on foot), 7,500 – 9,999 steps/day',
    },
    {
      value: 'Active',
      label:
        'Active (e.g. full-time PT, literally on your feet most of the day), 10,000 – 12,500 steps/day',
    },
    {
      value: 'Very active',
      label:
        'Very active (e.g. involved in physical labour), over 12,500 steps/day with intensive movement',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#6b6b6b']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '80%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 0,
            }}>
            <Ionicons name="chevron-back" size={40} color="#232946" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 0,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#232946" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <ImageBackground
          source={IntroRectangle}
          style={[
            introStyles.card,
            {
              width: '110%',
              marginLeft: 25,
              marginTop: 130,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 600,
              justifyContent: 'center',
            },
          ]}
          imageStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            resizeMode: 'stretch',
          }}>
          <Text
            style={{
              color: '#232946',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 10,
              marginTop: 4,
              marginRight: 10,
            }}>
            Which of the following options best{'\n'}describes your activity level (this does NOT
            include exercise)?*
          </Text>
          {activityOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setActivityLevel(option.value)}
              style={{
                backgroundColor: activityLevel === option.value ? '#E11D48' : '#f3f4f6',
                borderRadius: 12,
                padding: 10,
                marginRight: 10,
                marginBottom: 20,
                width: 280,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: activityLevel === option.value ? 2 : 0,
                borderColor: activityLevel === option.value ? '#E11D48' : 'transparent',
              }}>
              <Text
                style={{
                  color: activityLevel === option.value ? '#fff' : '#232946',
                  fontSize: 13,
                  textAlign: 'center',
                }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ImageBackground>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const SleepQualityScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [sleepQuality, setSleepQuality] = React.useState(formData.sleepQuality ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 20;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sleepQuality,
    }));
  }, [sleepQuality]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('CaffeineIntake', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            How is your sleep rhythm and quality?*
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={sleepQuality}
            onChangeText={setSleepQuality}
            placeholder="Describe your sleep"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const CaffeineIntakeScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [caffeineIntake, setCaffeineIntake] = React.useState(formData.caffeineIntake ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 21;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      caffeineIntake,
    }));
  }, [caffeineIntake]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('MenstrualCycle', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            How much caffeine do you consume daily on average or on a typical work day?
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={caffeineIntake}
            onChangeText={setCaffeineIntake}
            placeholder="e.g. 2 coffees, 1 energy drink"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const MenstrualCycleScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [menstrualCycle, setMenstrualCycle] = React.useState(formData.menstrualCycle ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 22;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      menstrualCycle,
    }));
  }, [menstrualCycle]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('Supplements', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            [Women only]{'\n'}
            Do you have a regular menstrual cycle? And are you using any form of contraception?
            {'\n'}
            If these questions are sensitive, feel free to ignore them, but the more information I
            have, the better I can help you.
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={menstrualCycle}
            onChangeText={setMenstrualCycle}
            placeholder="Enter details (optional)"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const SupplementsScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [supplements, setSupplements] = React.useState(formData.supplements ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 23;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      supplements,
    }));
  }, [supplements]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('Genetics', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            Please list all the supplements you are currently taking.
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
            }}
            value={supplements}
            onChangeText={setSupplements}
            placeholder="Enter supplements"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const GeneticsScreen: React.FC<{ navigation: NavigationProp<RootStackParamList>; route: any }> = ({
  navigation,
  route,
}) => {
  const { formData, setFormData } = useFormContext();
  const [wristCircumference, setWristCircumference] = React.useState(
    formData.wristCircumference ?? ''
  );
  const [ankleCircumference, setAnkleCircumference] = React.useState(
    formData.ankleCircumference ?? ''
  );
  const SCREEN_INDEX = route?.params?.screenIndex ?? 24;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      wristCircumference,
      ankleCircumference,
    }));
  }, [wristCircumference, ankleCircumference]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('EquipmentIntro', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 18,
            }}>
            Wrist circumference (smallest point)
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
              textAlign: 'center',
            }}
            value={wristCircumference}
            onChangeText={setWristCircumference}
            placeholder="Enter wrist circumference"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 18,
            }}>
            Ankle circumference (smallest point)
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
              textAlign: 'center',
            }}
            value={ankleCircumference}
            onChangeText={setAnkleCircumference}
            placeholder="Enter ankle circumference"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const EquipmentIntroScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const SCREEN_INDEX = route?.params?.screenIndex ?? 25;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 55,
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: 40,
          }}>
          <Text style={{ fontSize: 50 }}>🏋️‍♂️</Text> Equipment
        </Text>
        <ImageBackground
          source={IntroRectangle}
          style={[
            introStyles.card,
            {
              width: '113%',
              marginLeft: 16,
              marginTop: 110,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 550,
              justifyContent: 'center',
            },
          ]}
          imageStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            resizeMode: 'stretch',
          }}>
          <Text
            style={{
              color: '#232946',
              fontSize: 18,
              textAlign: 'center',
              marginBottom: 18,
              marginTop: 8,
              lineHeight: 26,
            }}>
            Let’s talk gear!
          </Text>
          <Text
            style={{
              color: '#232946',
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 0,
              marginTop: 12,
              lineHeight: 24,
            }}>
            Whether you’ve got a full gym or a backpack full of dreams, we’ll make it work.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 28,
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 70,
            }}
            onPress={() =>
              navigation.navigate('SkinfoldCalipers', { screenIndex: SCREEN_INDEX + 1 })
            }>
            <Ionicons name="chevron-forward" size={70} color="#232946" />
          </TouchableOpacity>
        </ImageBackground>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const SkinfoldCalipersScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [skinfoldCalipers, setSkinfoldCalipers] = React.useState(formData.skinfoldCalipers ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 26;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      skinfoldCalipers,
    }));
  }, [skinfoldCalipers]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('MyoTape', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            Do you have skinfold calipers and if so, which one(s)?
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
              textAlign: 'center',
            }}
            value={skinfoldCalipers}
            onChangeText={setSkinfoldCalipers}
            placeholder="Enter caliper details"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const MyoTapeScreen: React.FC<{ navigation: NavigationProp<RootStackParamList>; route: any }> = ({
  navigation,
  route,
}) => {
  const { formData, setFormData } = useFormContext();
  const [hasMyoTape, setHasMyoTape] = React.useState(
    typeof formData.hasMyoTape === 'boolean' ? formData.hasMyoTape : null
  );
  const SCREEN_INDEX = route?.params?.screenIndex ?? 27;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      hasMyoTape,
    }));
  }, [hasMyoTape]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('FitnessTech', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={heightWeightStyles.container}>
      {/* Progress Bar */}
      <View style={heightWeightStyles.progressBar}>
        <View style={[heightWeightStyles.progress, { width: progressWidth }]} />
      </View>
      <View style={heightWeightStyles.content}>
        <View style={heightWeightStyles.card}>
          <Text
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 48,
              marginTop: 10,
              textShadowColor: 'rgba(0,0,0,0.18)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 16,
            }}>
            Do you have a MyoTape{'\n'}(for taking circumference{'\n'}measurements)?
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#fff',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 38,
                marginRight: 18,
                backgroundColor: hasMyoTape === true ? '#fff' : 'transparent',
              }}
              onPress={() => {
                setHasMyoTape(true);
                goNext();
              }}>
              <Text
                style={{
                  color: hasMyoTape === true ? '#1A2330' : '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#fff',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 38,
                marginLeft: 18,
                backgroundColor: hasMyoTape === false ? '#fff' : 'transparent',
              }}
              onPress={() => {
                setHasMyoTape(false);
                goNext();
              }}>
              <Text
                style={{
                  color: hasMyoTape === false ? '#1A2330' : '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const FitnessTechScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [fitnessTech, setFitnessTech] = React.useState(formData.fitnessTech ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 28;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fitnessTech,
    }));
  }, [fitnessTech]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('CardioEquipment', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Arrows at the vertical center, overlayed */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}>
            Do you wear any fitness technology{'\n'}
            (Apple Watch, FitBit, Oura Ring, HR Chest Strap, etc)?
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
              textAlign: 'center',
            }}
            value={fitnessTech}
            onChangeText={setFitnessTech}
            placeholder="Enter device(s) or leave blank"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const CardioEquipmentScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [cardioEquipment, setCardioEquipment] = React.useState<string[]>(
    formData.cardioEquipment ?? []
  );
  const SCREEN_INDEX = route?.params?.screenIndex ?? 29;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  const options = [
    { key: 'treadmill', label: 'Treadmill' },
    { key: 'rower', label: 'Rower' },
    { key: 'crossTrainer', label: 'Cross- Trainer' },
    { key: 'skippingRope', label: 'Skipping Rope' },
  ];

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      cardioEquipment,
    }));
  }, [cardioEquipment]);

  const toggleOption = (key: string) => {
    setCardioEquipment((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('EquipmentAccess', { screenIndex: SCREEN_INDEX + 1 });

  // Arrange options in 2x2 grid
  const gridRows = [options.slice(0, 2), options.slice(2, 4)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 36,
            marginTop: 12,
          }}>
          Do you have access to{'\n'}any cardio equipment at{'\n'}home ?
        </Text>
        <View
          style={{
            marginBottom: 32,
            width: 320,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {gridRows.map((row, rowIdx) => (
            <View
              key={rowIdx}
              style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18 }}>
              {row.map((option, idx) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => toggleOption(option.key)}
                  style={{
                    width: 160,
                    height: 140,
                    marginHorizontal: 8,
                    borderRadius: 20,
                    backgroundColor: cardioEquipment.includes(option.key) ? '#546372' : '#22304a',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: cardioEquipment.includes(option.key) ? 0 : 0,
                    borderColor: '#E11D48',
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 20,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        {/* Arrows at the bottom */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            bottom: 90,
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 0,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 0,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const EquipmentDetailModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  type: 'legCurl' | 'cableTower' | null;
  value: string;
  setValue: (v: string) => void;
}> = ({ visible, onClose, type, value, setValue }) => {
  if (!visible || !type) return null;

  let question = '';
  let options: { label: string; value: string }[] = [];

  if (type === 'legCurl') {
    question = 'Is the leg curl machine,';
    options = [
      { label: 'Standing', value: 'Standing' },
      { label: 'Lying', value: 'Lying' },
      { label: 'Seated', value: 'Seated' },
    ];
  } else if (type === 'cableTower') {
    question = 'Is the cable tower adjustable?';
    options = [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ];
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
      }}>
      <View
        style={{
          backgroundColor: '#19233a',
          borderRadius: 32,
          padding: 32,
          width: 360,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 8,
        }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 28,
          }}>
          {question}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 24,
            alignItems: 'center',
            marginLeft: 25,
          }}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setValue(opt.value)}
              style={{
                backgroundColor: value === opt.value ? '#e5e5e5' : '#22304a',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 22,
                marginHorizontal: 8,
                borderWidth: value === opt.value ? 2 : 1,
                borderColor: value === opt.value ? '#fff' : '#22304a',
              }}>
              <Text
                style={{
                  color: value === opt.value ? '#fff' : '#bfc3c7',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
          <Ionicons name="chevron-back" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const EquipmentAccessScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [equipment, setEquipment] = React.useState<{ [key: string]: boolean }>({
    squatRack: formData.squatRack ?? false,
    hyperBench: formData.hyperBench ?? false,
    gluteHam: formData.gluteHam ?? false,
    standingCalf: formData.standingCalf ?? false,
    dipBelt: formData.dipBelt ?? false,
    legCurl: formData.legCurl ?? false,
    gymRings: formData.gymRings ?? false,
    trx: formData.trx ?? false,
    resistanceBands: formData.resistanceBands ?? false,
    pullUpBar: formData.pullUpBar ?? false,
    cableTower: formData.cableTower ?? false,
    seatedCalf: formData.seatedCalf ?? false,
  });
  const SCREEN_INDEX = route?.params?.screenIndex ?? 30;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalType, setModalType] = React.useState<'legCurl' | 'cableTower' | null>(null);
  const [legCurlType, setLegCurlType] = React.useState(formData.legCurlType ?? '');
  const [cableTowerAdjustable, setCableTowerAdjustable] = React.useState(
    formData.cableTowerAdjustable ?? ''
  );
  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...equipment,
      legCurlType,
      cableTowerAdjustable,
    }));
  }, [equipment, legCurlType, cableTowerAdjustable]);

  const toggleEquipment = (key: string) => {
    setEquipment((prev) => {
      const newVal = !prev[key];
      // Show modal if legCurl or cableTower is selected
      if (key === 'legCurl' && newVal) {
        setModalType('legCurl');
        setModalVisible(true);
      } else if (key === 'cableTower' && newVal) {
        setModalType('cableTower');
        setModalVisible(true);
      }
      return { ...prev, [key]: newVal };
    });
    // If unselecting, clear the extra info
    if (key === 'legCurl' && equipment.legCurl) setLegCurlType('');
    if (key === 'cableTower' && equipment.cableTower) setCableTowerAdjustable('');
  };

  const goBack = () => navigation.goBack();
  const goNext = () =>
    navigation.navigate('EquipmentDifference', { screenIndex: SCREEN_INDEX + 1 });

  // Equipment options with images
  const equipmentOptions = [
    {
      key: 'squatRack',
      label: 'Squat cage or rack',
      image: require('../assets/SquatRack.png'),
    },
    {
      key: 'hyperBench',
      label: '45° hyperextension bench',
      image: require('../assets/Hyperextension.png'),
    },
    {
      key: 'gluteHam',
      label: 'Glute-ham raise',
      image: require('../assets/Glute.png'),
    },
    {
      key: 'standingCalf',
      label: 'Standing calf raise machine',
      image: require('../assets/StandingCalfRaise.png'),
    },
    {
      key: 'dipBelt',
      label: 'Dip/chin-up belt',
      image: require('../assets/Dip.png'),
    },
    {
      key: 'legCurl',
      label: 'Leg Curl Machine',
      image: require('../assets/LegCurl.png'),
    },
    {
      key: 'gymRings',
      label: 'Gymnastic Rings',
      image: require('../assets/GymnasticsRings.png'),
    },
    {
      key: 'trx',
      label: 'TRX/ Similar Suspension Device',
      image: require('../assets/Trx.png'),
    },
    {
      key: 'resistanceBands',
      label: 'Resistance Bands',
      image: require('../assets/ResistanceBands.png'),
    },
    {
      key: 'pullUpBar',
      label: 'Pull-Up Bar',
      image: require('../assets/PullupBar.png'),
    },
    {
      key: 'cableTower',
      label: 'Cable Tower',
      image: require('../assets/CableTower.png'),
    },
    {
      key: 'seatedCalf',
      label: 'Seated Calf Raise Machine',
      image: require('../assets/SeatedCalfRaise.png'),
    },
  ];

  return (
    <>
      <EquipmentDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalType}
        value={modalType === 'legCurl' ? legCurlType : cableTowerAdjustable}
        setValue={(val) => {
          if (modalType === 'legCurl') setLegCurlType(val);
          if (modalType === 'cableTower') setCableTowerAdjustable(val);
          setModalVisible(false);
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        {/* Gradient background */}
        <LinearGradient
          colors={['#081A2F', '#36454F']}
          style={{
            ...StyleSheet.absoluteFillObject,
            zIndex: 0,
          }}
          start={{ x: 0.3, y: 0.07 }}
          end={{ x: 0.3, y: 1 }}
          locations={[0, 1]}
        />
        {/* Progress Bar */}
        <View
          style={{
            height: 6,
            backgroundColor: '#e5e7eb',
            marginHorizontal: 20,
            borderRadius: 3,
            marginTop: 32,
          }}>
          <View
            style={{
              height: '100%',
              backgroundColor: '#E11D48',
              borderRadius: 3,
              width: progressWidth,
            }}
          />
        </View>
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: 24,
              marginBottom: 8,
            }}>
            Do you have access to...
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 18,
              opacity: 0.8,
              paddingHorizontal: 10,
            }}>
            Note that you don’t need access to all of the below equipment to have a good training
            program. I’m mainly asking for the more unconventional pieces of equipment here.
          </Text>
          {/* 3x3 grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              width: '100%',
              maxWidth: 390,
            }}>
            {equipmentOptions.map((option, idx) => (
              <View
                key={option.key}
                style={{
                  width: '33.33%',
                  alignItems: 'center',
                  marginBottom: 18,
                }}>
                <TouchableOpacity
                  onPress={() => toggleEquipment(option.key)}
                  style={{
                    width: 110,
                    height: 135,
                    borderRadius: 22,
                    backgroundColor: equipment[option.key] ? '#546372' : '#19233a',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: equipment[option.key] ? 0.3 : 0.3,
                    borderColor: equipment[option.key] ? '#546372' : 'e5e5e5',
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                  <Image
                    source={option.image}
                    style={{
                      width: 65,
                      height: 64,
                      marginBottom: 10,
                      resizeMode: 'contain',
                    }}
                  />
                  <Text
                    style={{
                      color: equipment[option.key] ? '#fff' : '#bfc3c7',
                      fontSize: 13,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {/* Arrows at the bottom */}
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
              marginTop: 10,
              marginBottom: 30,
            }}>
            <TouchableOpacity
              onPress={goBack}
              style={{
                padding: 10,
                justifyContent: 'center',
                alignItems: 'center',
                height: 60,
                width: 60,
                left: 0,
              }}>
              <Ionicons name="chevron-back" size={40} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goNext}
              style={{
                padding: 10,
                justifyContent: 'center',
                alignItems: 'center',
                height: 60,
                width: 60,
                right: 0,
              }}>
              <Ionicons name="chevron-forward" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
        {/* Blur overlay when modal is open */}
        {modalVisible && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(20,24,38,0.95)',
              zIndex: 99,
            }}
            pointerEvents="none"
          />
        )}
      </SafeAreaView>
    </>
  );
};

const EquipmentDifferenceScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [equipmentDifference, setEquipmentDifference] = React.useState(
    formData.equipmentDifference ?? ''
  );
  const SCREEN_INDEX = route?.params?.screenIndex ?? 31;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      equipmentDifference,
    }));
  }, [equipmentDifference]);

  const goBack = () => navigation.goBack();
  const goNext = () =>
    navigation.navigate('CurrentProgramIntro', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 18,
            }}>
            Does your available equipment differ{'\n'}
            from that in most gyms in any other way{'\n'}
            (e.g. you train in a Crossfit box or at home)?
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 44,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
              textAlign: 'center',
            }}
            value={equipmentDifference}
            onChangeText={setEquipmentDifference}
            placeholder="Describe or leave blank"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
        {/* Arrows at the bottom */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const CurrentProgramIntroScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const SCREEN_INDEX = route?.params?.screenIndex ?? 34;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text
          style={{
            color: '#fff',
            fontSize: 40,
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: 40,
            marginBottom: 12,
          }}>
          Current{'\n'}Program
        </Text>
        <ImageBackground
          source={IntroRectangle}
          style={[
            introStyles.card,
            {
              width: '113%',
              marginLeft: 16,
              marginTop: 110,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 550,
              justifyContent: 'center',
            },
          ]}
          imageStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            resizeMode: 'stretch',
          }}>
          <View
            style={{
              paddingVertical: 32,
              paddingHorizontal: 18,
              width: '100%',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: '#232946',
                fontSize: 20,
                backgroundColor: 'transparent',
                textAlign: 'center',
                marginBottom: 35,
                marginRight: 0,
                fontWeight: '500',
              }}>
              Already doing your thing?
            </Text>
            <Text
              style={{
                color: '#232946',
                fontSize: 18,
                backgroundColor: 'transparent',
                textAlign: 'center',
                marginBottom: 12,
                marginRight: 0,
              }}>
              Cool, Tell us what you’ve got! <Text style={{ fontSize: 18 }}>📝</Text>
            </Text>
            <Text
              style={{
                color: '#232946',
                fontSize: 18,
                backgroundColor: 'transparent',
                textAlign: 'center',
                marginBottom: 0,
                marginRight: 0,
                opacity: 0.85,
              }}>
              We want to build on what’s{'\n'}working and fix what’s not.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 32,
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
              }}
              onPress={() => navigation.navigate('TypicalDiet', { screenIndex: SCREEN_INDEX + 1 })}>
              <Ionicons name="chevron-forward" size={48} color="#232946" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const TypicalDietScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [typicalDiet, setTypicalDiet] = React.useState(formData.typicalDiet ?? '');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 36;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      typicalDiet,
    }));
  }, [typicalDiet]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('CurrentProgram', { screenIndex: SCREEN_INDEX + 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 18,
            }}>
            Please describe a typical day of eating in detail{'\n'}
            (or diet plan if following one),{'\n'}
            including snacking and alcohol.
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
              textAlign: 'center',
            }}
            value={typicalDiet}
            onChangeText={setTypicalDiet}
            placeholder="Describe your typical diet"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
        {/* Arrows at the bottom */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const CurrentProgramScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData } = useFormContext();
  const [currentTraining, setCurrentTraining] = React.useState(formData.currentTraining ?? '');
  const [uploadName, setUploadName] = React.useState('');
  const [uploadUri, setUploadUri] = React.useState('');
  const SCREEN_INDEX = route?.params?.screenIndex ?? 38;
  const TOTAL_SCREENS = 39;
  const progressWidth = `${(SCREEN_INDEX / TOTAL_SCREENS) * 100}%`;

  // Save to formData on change
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      currentTraining,
      currentTrainingFile: uploadUri ? { name: uploadName, uri: uploadUri } : undefined,
    }));
  }, [currentTraining, uploadName, uploadUri]);

  const goBack = () => navigation.goBack();
  const goNext = () => navigation.navigate('StrikeAPose', { screenIndex: SCREEN_INDEX + 1 });

  // Upload logic
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.assets && result.assets.length > 0) {
        setUploadName(result.assets[0].name);
        setUploadUri(result.assets[0].uri);
      }
    } catch (e) {
      alert('Could not upload file');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{
            height: '100%',
            backgroundColor: '#E11D48',
            borderRadius: 3,
            width: progressWidth,
          }}
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Main Content */}
        <View
          style={{
            backgroundColor: '#19233a',
            borderRadius: 32,
            padding: 24,
            width: '100%',
            maxWidth: 370,
            marginBottom: 18,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 18,
            }}>
            Please describe or attach your current{'\n'}
            training program in detail (if any)
          </Text>
          <TextInput
            style={{
              backgroundColor: '#081A2FCC',
              borderRadius: 18,
              height: 70,
              color: '#fff',
              fontSize: 16,
              marginBottom: 0,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#223',
              textAlign: 'center',
            }}
            value={currentTraining}
            onChangeText={setCurrentTraining}
            placeholder="Describe or paste your program"
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
        {/* Upload Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#bfc3c7',
            borderRadius: 10,
            width: 60,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
          onPress={handleUpload}>
          <Ionicons name="cloud-upload-outline" size={28} color="#232946" />
        </TouchableOpacity>
        {uploadName ? (
          <Text style={{ color: '#fff', marginBottom: 10, fontSize: 13, textAlign: 'center' }}>
            Attached: {uploadName}
          </Text>
        ) : null}
        {/* Arrows at the bottom */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            position: 'absolute',
            top: '70%',
          }}>
          <TouchableOpacity
            onPress={goBack}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              right: 35,
            }}>
            <Ionicons name="chevron-back" size={40} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              height: 60,
              width: 60,
              left: 35,
            }}>
            <Ionicons name="chevron-forward" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Two IntroBottom images at the bottom of the screen */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
    </SafeAreaView>
  );
};

const StrikeAPoseScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
  route: any;
}> = ({ navigation, route }) => {
  const { formData, setFormData, handleSubmit, hasSubmitted } = useFormContext();
  const [photos, setPhotos] = React.useState<{ uri: string; name: string }[]>(
    formData.photos ?? []
  );
  const [uploading, setUploading] = React.useState(false);

  // Save photos to formData
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      photos,
    }));
  }, [photos, setFormData]);

  const pickImages = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 4,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const selected = result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName || `photo_${index + 1}.jpg`,
        }));
        setPhotos(selected);
        Alert.alert('Success', `${selected.length} photo(s) selected successfully!`);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Could not pick images. Please try again.');
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setUploading(true);
      const success = await handleSubmit();
      if (success) {
        Alert.alert(
          'Success!',
          'Your intake form has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Reports')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#081A2F', '#36454F']}
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 0,
        }}
        start={{ x: 0.3, y: 0.07 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 1]}
      />
      
      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: '#e5e7eb',
          marginHorizontal: 20,
          borderRadius: 3,
          marginTop: 32,
        }}>
        <View
          style={{ height: '100%', backgroundColor: '#E11D48', borderRadius: 3, width: '100%' }}
        />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          {/* Title */}
          <Text
            style={{
              color: '#fff',
              fontSize: 38,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 20,
              marginTop: 40,
            }}>
            Strike a Pose! <Ionicons name="camera" size={40} color="#fff" />
          </Text>

          {/* Main Content Card */}
          <ImageBackground
            source={IntroRectangle}
            style={[
              introStyles.card,
              {
              width: '113%',
              marginLeft: 16,
              marginTop: 110,
              marginHorizontal: 10,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
              alignSelf: 'center',
              minHeight: 550,
              justifyContent: 'center',
              },
            ]}
            imageStyle={{
              borderRadius: 32,
              resizeMode: 'stretch',
            }}>
            
            <View style={{ paddingVertical: 32, paddingHorizontal: 18, alignItems: 'center' }}>
              <Text
                style={{
                  color: '#232946',
                  fontSize: 15,
                  textAlign: 'center',
                  marginBottom: 60,
                  fontWeight: '500',
                  lineHeight: 20,
                }}>
                Please upload at least four full-body pictures (wearing shorts that don't cover your
                knees): front, both sides, and back.{'\n'}
                Shirtless if male or a vest if female. Your natural relaxed posture.
              </Text>

              {/* Upload Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginBottom: 15,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
                onPress={pickImages}
                disabled={uploading}>
                <Ionicons name="cloud-upload-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {photos.length > 0 ? 'Change Photos' : 'Upload Photos'}
                </Text>
              </TouchableOpacity>

              {/* Photo Count Display */}
              {photos.length > 0 && (
                <View style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 15,
                }}>
                  <Text style={{ 
                    color: '#232946', 
                    fontSize: 14, 
                    textAlign: 'center',
                    fontWeight: '600' 
                  }}>
                    ✅ {photos.length} photo{photos.length > 1 ? 's' : ''} selected
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: hasSubmitted ? '#9ca3af' : '#d3d3d3',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  alignItems: 'center',
                  marginTop: 10,
                  opacity: (uploading || hasSubmitted) ? 0.7 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
                onPress={handleFinalSubmit}
                disabled={uploading || hasSubmitted}>
                {uploading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {hasSubmitted ? 'Already Submitted' : 'Submit Form'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Decorative Images */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            width: '120%',
            
            top: -310,
            right:80
          }}>
            <Image
              source={require('../assets/boy.png')}
              style={{ 
                width: 300, 
                height: 480, 
                resizeMode: 'stretch',
                opacity: 0.8, 
                marginRight: 45,
              }}
            />
            <Image
              source={require('../assets/girl.png')}
              style={{ 
                width: 150, 
                height: 380, 
                resizeMode: 'stretch',
                opacity: 0.8 
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom decorative images */}
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 130,
          resizeMode: 'stretch',
          zIndex: 10,
          opacity: 0.7,
        }}
      />
      <Image
        source={IntroBottom}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 120,
          resizeMode: 'stretch',
          zIndex: 11,
          opacity: 1,
          transform: [{ scaleX: -1 }],
          tintColor: '#ffff',
        }}
      />
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
        const data = docSnap.data();
        // Only consider it submitted if it has actual form data beyond just basic signup info
        // Check for specific form fields that indicate completion
        const hasFormData = data.measurementSystem || 
                           data.height || 
                           data.weight || 
                           data.age || 
                           data.strengthTrainingExperience ||
                           data.goal1 ||
                           data.photos;

        if (hasFormData) {
          setFormData({ ...initialFormState, ...(data as DocumentData) });
          setHasSubmitted(true);
        } else {
          // Just basic signup data, not a completed form
          setFormData({ 
            ...initialFormState, 
            email: user.email,
            fullName: data.fullName || '',
            phoneNumber: data.phoneNumber || ''
          });
          setHasSubmitted(false);
        }
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
    // Create a clean object without undefined values
    const cleanFormData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const formDataToSubmit = {
      ...cleanFormData,
      email: user.email.toLowerCase(),
      timestamp: new Date(),
      isSignupOnly: false, // Mark as completed form
      formCompleted: true // Add completion flag
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

  

  return (
    <FormContext.Provider value={{ formData, setFormData, hasSubmitted, handleSubmit }}>
      <Stack.Navigator
      
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: isDarkMode ? '#111827' : '#ffffff' },
        }}>
        {/* Add IntroScreen as the first screen */}
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="MeasurementSystem" component={MeasurementSystemScreen} />
        <Stack.Screen name="HeightWeight" component={HeightWeightScreen} />
        <Stack.Screen name="BodyFat" component={BodyFatScreen} />
        <Stack.Screen name="Experience" component={ExperienceScreen} />
        <Stack.Screen name="StrengthCongrats" component={StrengthCongratsScreen} />
        <Stack.Screen name="StrengthLevel" component={StrengthLevelScreen} />
        <Stack.Screen name="StrengthCompetency" component={StrengthCompetencyScreen} />
        <Stack.Screen name="DreamBig" component={DreamBigScreen} />
        <Stack.Screen name="TopGoals" component={TopGoalsScreen} />
        <Stack.Screen name="ObstacleExercise" component={ObstacleExerciseScreen} />
        <Stack.Screen name="DedicationLevel" component={DedicationLevelScreen} />
        <Stack.Screen name="WeeklyFrequency" component={WeeklyFrequencyScreen} />
        <Stack.Screen name="Occupation" component={OccupationScreen} />
        <Stack.Screen name="DietMedical" component={DietMedicalScreen} />
        <Stack.Screen name="LifestyleIntro" component={LifestyleIntroScreen} />
        <Stack.Screen name="TrainingTimePreference" component={TrainingTimePreferenceScreen} />
        <Stack.Screen name="StressLevel" component={StressLevelScreen} />
        <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
        <Stack.Screen name="SleepQuality" component={SleepQualityScreen} />
        <Stack.Screen name="CaffeineIntake" component={CaffeineIntakeScreen} />
        <Stack.Screen name="MenstrualCycle" component={MenstrualCycleScreen} />
        <Stack.Screen name="Supplements" component={SupplementsScreen} />
        <Stack.Screen name="Genetics" component={GeneticsScreen} />
        <Stack.Screen name="EquipmentIntro" component={EquipmentIntroScreen} />
        <Stack.Screen name="SkinfoldCalipers" component={SkinfoldCalipersScreen} />
        <Stack.Screen name="MyoTape" component={MyoTapeScreen} />
        <Stack.Screen name="FitnessTech" component={FitnessTechScreen} />
        <Stack.Screen name="CardioEquipment" component={CardioEquipmentScreen} />
        <Stack.Screen name="EquipmentAccess" component={EquipmentAccessScreen} />
        <Stack.Screen name="EquipmentDifference" component={EquipmentDifferenceScreen} />
        <Stack.Screen name="CurrentProgramIntro" component={CurrentProgramIntroScreen} />
        <Stack.Screen name="TypicalDiet" component={TypicalDietScreen} />
        <Stack.Screen name="CurrentProgram" component={CurrentProgramScreen} />
        <Stack.Screen name="StrikeAPose" component={StrikeAPoseScreen} />
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
