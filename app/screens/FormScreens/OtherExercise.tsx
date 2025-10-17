import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OtherExercise({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const scrollViewRef = useRef(null);
  const [formData, setFormData] = useState<any>({});
  const [otherExercise, setOtherExercise] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) return;

      try {
        // Get intake form data from SQL backend
        const data = await intakeFormApi.getIntakeForm(user.email.toLowerCase());
        
        if (data) {
          setFormData(data);
          setOtherExercise(data.other_exercises || '');
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

  const saveFormData = async (data: any) => {
    if (!user?.email) return;

    try {
      // Update intake form in SQL backend
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), {
        ...data,
        last_updated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving form data:', error);
      Alert.alert('Error', 'Could not save your data. Please try again.');
    }
  };

  const handleNext = async () => {
    await saveFormData({
      other_exercises: otherExercise,
      other_exercise_completed: true,
    });
    navigation.navigate('DedicationLevel', {
      ...previousParams,
      otherExercise,
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.34} barHeight={8} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.contentContainer}>
            <Text style={styles.mainTitle}>
              Will you be performing any other form of exercise alongside strength training (e.g.
              running, football, yoga)?*
            </Text>

            <TextInput
              style={styles.input}
              value={otherExercise}
              onChangeText={setOtherExercise}
              multiline
            />

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.07,
    marginTop: screenHeight * 0.25,
    paddingBottom: screenHeight * 0.1,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.048,
    fontWeight: '600',
    marginBottom: screenHeight * 0.05,
    lineHeight: screenWidth * 0.065,
  },
  input: {
    width: '100%',
    borderBottomWidth: 0.5,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: 12,
    marginBottom: screenHeight * 0.025,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.08,
    marginBottom: screenHeight * 0.02,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});
