import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StressLevel({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Updated stress levels with unique display IDs but consistent database value mappings
  const stressLevels = [
    {
      displayId: 'stress_free',
      databaseValue: 'low_stress', // Value stored in database
      text: 'Stress-free (e.g. on holiday)',
    },
    {
      displayId: 'mild_stress',
      databaseValue: 'average_stress', // Both map to average_stress in database
      text: 'Only occasional/mild stress (e.g. student not during exam period)',
    },
    {
      displayId: 'average_stress',
      databaseValue: 'average_stress', // Both map to average_stress in database
      text: 'Average stress (e.g. full-time work with deadlines/commuting)',
    },
    {
      displayId: 'high_stress',
      databaseValue: 'high_stress',
      text: 'High stress (e.g. very high-paced work environment with great responsibility)',
    },
  ];

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

          // Populate form field with existing data
          if (data.stress_level) {
            setSelectedLevel(data.stress_level);
            console.log('Loaded stress level:', data.stress_level);
            
            // Find the matching index in our array
            const matchingOptionIndex = stressLevels.findIndex(level => 
              level.databaseValue === data.stress_level
            );
            
            if (matchingOptionIndex >= 0) {
              setSelectedIndex(matchingOptionIndex);
            }
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
    if (!user?.email) return;

    try {
      console.log('Saving stress level:', data.stress_level);
      
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

  const handleSelection = (databaseValue, index) => {
    setSelectedLevel(databaseValue);
    setSelectedIndex(index);
  };

  const handleNext = async () => {
    if (selectedLevel) {
      // Make sure the selected level matches one of the allowed enum values in your database
      const validStressLevels = ['low_stress', 'average_stress', 'high_stress'];
      
      if (!validStressLevels.includes(selectedLevel)) {
        console.error('Invalid stress level selected:', selectedLevel);
        Alert.alert('Error', 'Please select a valid stress level.');
        return;
      }
      
      // Save data to SQL backend before navigating
      await saveFormData({
        stress_level: selectedLevel,
        stress_level_completed: true,
      });

      // Navigate to next screen with updated params
      navigation.navigate('SleepForm', {
        ...previousParams,
        stressLevel: selectedLevel,
      });
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
      <ProgressBar progress={0.58} barHeight={8} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>
            Which of the following options best describes your stress level? (this does NOT include
            exercise)
          </Text>

          <View style={styles.optionsContainer}>
            {stressLevels.map((level, index) => (
              <TouchableOpacity
                key={level.displayId}
                style={[styles.optionCard, selectedIndex === index && styles.selectedCard]}
                onPress={() => handleSelection(level.databaseValue, index)}>
                <Text style={styles.optionText}>{level.text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedLevel && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
    marginTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.05,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.05,
    fontWeight: '700',
    marginBottom: screenHeight * 0.04,
    lineHeight: screenWidth * 0.07,
  },
  optionsContainer: {
    width: '100%',
    gap: screenHeight * 0.01,
  },
  optionCard: {
    width: '100%',
    backgroundColor: '#081A2F', // Base color from gradient
    borderRadius: 12,
    padding: screenWidth * 0.05,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: screenHeight * 0.02, // Adding margin for older React Native versions that might not support gap
  },
  selectedCard: {
    backgroundColor: '#C7312B', // Middle color from gradient
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.035,
    lineHeight: screenWidth * 0.058,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 20,
    marginTop: screenHeight * 0.05,
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
