import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Occupation({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const scrollViewRef = useRef(null);

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  const [occupation, setOccupation] = useState('');
  const [diet, setDiet] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');

  // Monitor keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setActiveInput(null);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Load existing form data from Firestore
  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) return;

      try {
        const docRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(data);

          // Populate form fields with existing data
          if (data.occupation) setOccupation(data.occupation);
          if (data.diet) setDiet(data.diet);
          if (data.medicalConditions) setMedicalConditions(data.medicalConditions);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email]);

  // Scroll to active input when keyboard appears
  useEffect(() => {
    if (keyboardVisible && activeInput && scrollViewRef.current) {
      setTimeout(() => {
        scrollToInput(activeInput);
      }, 100);
    }
  }, [keyboardVisible, activeInput]);

  // Save form data to Firestore
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

  const handleNext = async () => {
    // Dismiss keyboard if visible
    Keyboard.dismiss();

    // Save data to Firestore before navigating
    await saveFormData({
      occupation,
      diet,
      medicalConditions,
      occupationCompleted: true,
    });

    // Navigate to next screen with updated params
    navigation.navigate('TrainingTime', {
      ...previousParams,
      occupation,
      diet,
      medicalConditions,
    });
  };

  const scrollToInput = (inputName) => {
    if (!scrollViewRef.current) return;

    let scrollPosition = 0;

    switch (inputName) {
      case 'occupation':
        scrollPosition = 0; // Top of the form
        break;
      case 'diet':
        scrollPosition = screenHeight * 0.3; // Approximate position of diet input
        break;
      case 'medicalConditions':
        scrollPosition = screenHeight * 0.6; // Approximate position of medical conditions input
        break;
    }

    scrollViewRef.current.scrollTo({ y: scrollPosition, animated: true });
  };

  const handleFocus = (inputName) => {
    setActiveInput(inputName);
    scrollToInput(inputName);
  };

  if (isLoading) {
    return (
      <BackgroundWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.46} barHeight={8} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            keyboardVisible && { paddingBottom: screenHeight * 0.3 }, // Add extra padding when keyboard is visible
          ]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.question}>What is your occupation?</Text>
              <Text style={styles.description}>
                The aim is to understand your circadian rhythm (physiological impact of your daily
                routine), stress and activity level.
              </Text>
              <TextInput
                style={styles.input}
                value={occupation}
                onChangeText={setOccupation}
                onFocus={() => handleFocus('occupation')}
                placeholderTextColor="#8496A6"
              />
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.question}>
                Do you currently follow any special diet, or wish to follow any special diet as part
                of this coaching program?
              </Text>
              <Text style={styles.description}>e.g. ketogenic, vegan</Text>
              <TextInput
                style={styles.input}
                value={diet}
                onChangeText={setDiet}
                onFocus={() => handleFocus('diet')}
                placeholderTextColor="#8496A6"
              />
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.question}>Please list any medical conditions or injuries.</Text>
              <Text style={styles.description}>
                Including disabilities, allergies, illnesses, syndromes, disorders, etc.) you have
                or have had historically.
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={medicalConditions}
                onChangeText={setMedicalConditions}
                onFocus={() => handleFocus('medicalConditions')}
                placeholderTextColor="#8496A6"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.nextButton,
                keyboardVisible && { marginBottom: screenHeight * 0.15 }, // Add extra margin when keyboard is visible
              ]}
              onPress={handleNext}>
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.05,
    paddingBottom: screenHeight * 0.08,
  },
  sectionContainer: {
    marginBottom: screenHeight * 0.05,
  },
  question: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.043,
    fontWeight: '700',
    marginBottom: screenHeight * 0.01,
  },
  description: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.034,
    opacity: 0.8,
    marginBottom: screenHeight * 0.02,
    lineHeight: screenWidth * 0.05,
  },
  input: {
    width: '100%',
    borderBottomWidth: 0.5,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: 8,
  },
  multilineInput: {
    minHeight: screenHeight * 0.1,
    textAlignVertical: 'top',
    paddingTop: 38,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
  },
});
