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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Genetics({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const [wristCircumference, setWristCircumference] = useState('');
  const [ankleCircumference, setAnkleCircumference] = useState('');

  // Load existing form data from API
  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/intake_forms/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(data);

          // Populate form fields with existing data
          if (data.wrist_circumference) {
            setWristCircumference(data.wrist_circumference);
          }
          if (data.ankle_circumference) {
            setAnkleCircumference(data.ankle_circumference);
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.id]);

  // Save form data to API
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

  const handleNext = async () => {
    // Save data to API before navigating
    await saveFormData({
      wrist_circumference: wristCircumference,
      ankle_circumference: ankleCircumference,
      genetics_completed: true,
    });

    // Navigate to next screen with updated params
    navigation.navigate('CurrentProgram', {
      ...previousParams,
      genetics: {
        wristCircumference,
        ankleCircumference,
      },
    });
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
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>&gt;</Text>
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
