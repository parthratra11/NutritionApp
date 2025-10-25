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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Genetics({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [wristCircumference, setWristCircumference] = useState('');
  const [ankleCircumference, setAnkleCircumference] = useState('');

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
        console.log('Received form data for genetics:', JSON.stringify(data, null, 2));

        if (data) {
          setFormData(data);

          // Check for genetics data
          if (data.genetics && Array.isArray(data.genetics) && data.genetics.length > 0) {
            const geneticsData = data.genetics[0];
            setWristCircumference(geneticsData.wrist_circumference || '');
            setAnkleCircumference(geneticsData.ankle_circumference || '');
            console.log('Loaded genetics data:', geneticsData);
          } else {
            console.log('No genetics data found in the response');
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        // Don't show error for 404 (form not found)
        if (!(error instanceof Error && error.message.includes('404'))) {
          Alert.alert(
            'Error',
            'Could not load your genetics data. You can still enter measurements.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email]);

  const handleNext = async () => {
    if (!user?.email) return;

    try {
      setIsSaving(true);

      // Save genetics data to SQL backend
      const geneticsData = {
        wrist_circumference: wristCircumference,
        ankle_circumference: ankleCircumference,
        genetics_completed: true,
      };

      await intakeFormApi.saveGeneticsData(user.email.toLowerCase(), geneticsData);
      console.log('Saved genetics data:', geneticsData);

      // Also update the completion flag in intake_forms table
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), {
        // genetics_completed: true, // This might be handled differently based on your DB schema
      });

      // Navigate to next screen with updated params
      navigation.navigate('CurrentProgram', {
        ...previousParams,
        genetics: {
          wristCircumference,
          ankleCircumference,
        },
      });
    } catch (error) {
      console.error('Error saving genetics data:', error);
      Alert.alert('Error', 'Could not save your genetics data. Please try again.');
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
      <ProgressBar progress={0.9} barHeight={8} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.labelText}>Wrist circumference (smallest point)</Text>

              <TextInput
                style={styles.inputField}
                value={wristCircumference}
                onChangeText={setWristCircumference}
                placeholder=""
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="numeric"
                editable={!isSaving}
              />
            </View>

            {/* Added spacing view to create more distance between questions */}
            <View style={styles.spacer} />

            <View style={styles.inputContainer}>
              <Text style={styles.labelText}>Ankle circumference (smallest point)</Text>

              <TextInput
                style={styles.inputField}
                value={ankleCircumference}
                onChangeText={setAnkleCircumference}
                placeholder=""
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="numeric"
                editable={!isSaving}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.nextButton, isSaving && { opacity: 0.6 }]}
                onPress={handleNext}
                disabled={isSaving}>
                <Text style={styles.nextButtonText}>{isSaving ? '...' : '>'}</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: screenHeight * 0.15,
    paddingBottom: screenHeight * 0.2, // Increased bottom padding
    justifyContent: 'space-around',
    minHeight: screenHeight * 0.8,
  },
  inputContainer: {
    marginBottom: screenHeight * 0.02, // Reduced from 0.04 since we're adding a spacer
  },
  spacer: {
    height: screenHeight * 0.08, // Adds significant space between the questions
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '500',
    marginBottom: screenHeight * 0.01,
  },
  inputField: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: screenHeight * 0.1,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.2,
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
