import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Caffeine({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [caffeine, setCaffeine] = useState('');
  const [menstrualInfo, setMenstrualInfo] = useState('');

  // Load existing form data from SQL backend
  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        // Get intake form data from SQL backend
        const data = await intakeFormApi.getIntakeForm(user.email.toLowerCase());
        
        if (data) {
          setFormData(data);
          console.log('Loaded form data:', data);

          // Populate form fields with existing data
          if (data.caffeine) {
            setCaffeine(data.caffeine);
            console.log('Loaded caffeine value:', data.caffeine);
          }
          if (data.menstrual_info) {
            setMenstrualInfo(data.menstrual_info);
            console.log('Loaded menstrual info:', data.menstrual_info);
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

  // Save form data to SQL backend
  const saveFormData = async (data: any) => {
    if (!user?.email) return false;
    
    try {
      console.log('Saving form data:', data);
      
      // Ensure data is properly formatted
      const formattedData = {
        caffeine: data.caffeine ? data.caffeine.toString().trim() : '',
        menstrual_info: data.menstrual_info ? data.menstrual_info.toString().trim() : '',
        caffeine_completed: true,
        last_updated: new Date().toISOString(),
      };

      console.log('Formatted data being sent to API:', formattedData);
      
      // Update intake form in SQL backend
      const response = await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), formattedData);
      console.log('API response:', response);
      
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      Alert.alert('Error', 'Could not save your data. Please try again.');
      return false;
    }
  };

  const handleNext = async () => {
    // Dismiss keyboard if it's open
    Keyboard.dismiss();
    
    setIsSaving(true);

    try {
      // Save data to SQL backend before navigating
      const saveSuccess = await saveFormData({
        caffeine,
        menstrual_info: menstrualInfo,
      });

      if (saveSuccess) {
        // Navigate to next screen with updated params
        navigation.navigate('Equipment1', {
          ...previousParams,
          caffeine,
          menstrualInfo,
        });
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
      <ProgressBar progress={0.66} barHeight={8} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.contentContainer}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                How much caffeine do you consume daily on average or on a typical work day?
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter Number of Cups..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={caffeine}
                onChangeText={setCaffeine}
                keyboardType="default"
              />

              <Text style={styles.labelText}>[Women only]</Text>
              <Text style={styles.questionText}>
                Do you have a regular menstrual cycle? And are you using any form of contraception?
              </Text>

              <TextInput
                style={styles.input}
                value={menstrualInfo}
                onChangeText={setMenstrualInfo}
                multiline={true}
                placeholder="Type your answer here..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />

              <Text style={styles.disclaimerText}>
                If these questions are sensitive, feel free to ignore them, but the more information
                I have, the better I can help you.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.nextButton, isSaving && styles.disabledButton]} 
              onPress={handleNext}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>&gt;</Text>
              )}
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
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.05,
  },
  questionContainer: {
    flex: 1,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    marginBottom: screenHeight * 0.02,
    lineHeight: screenWidth * 0.06,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.035,
    fontWeight: '600',
    marginTop: screenHeight * 0.1,
    marginBottom: screenHeight * 0.01,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    padding: 10,
    paddingBottom: 8,
    textAlignVertical: 'bottom',
    height: 40,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    marginTop: screenHeight * 0.04,
    marginBottom: screenHeight * 0.04,
    opacity: 0.5,
  },
  disclaimerText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.035,
    marginTop: screenHeight * 0.06,
    opacity: 0.7,
    lineHeight: screenWidth * 0.055,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.05,
  },
  disabledButton: {
    backgroundColor: '#8B2B27',
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
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
