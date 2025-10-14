import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function DedicationLevel({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const [formData, setFormData] = useState<any>({});
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`http://localhost:8000/intake_forms/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(data);
          setSelectedLevel(data.dedication_level || null);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.id]);

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
      Alert.alert('Error', 'Failed to save form data. Please try again.');
    }
  };

  const dedicationLevels = [
    {
      id: 'steady',
      text: "Steady and sustainability is most important to me. As long as I'm moving in the right direction, I don't mind about the rate of progress.",
    },
    {
      id: 'balanced',
      text: 'I want to achieve results at a good pace whilst maintaining a balanced lifestyle.',
    },
    {
      id: 'maximum',
      text: 'I will do whatever it takes to achieve maximum results without compromising my health.',
    },
  ];

  const handleSelect = (levelId) => {
    setSelectedLevel(levelId);
  };

  const handleNext = async () => {
    await saveFormData({
      dedication_level: selectedLevel,
      dedication_level_completed: true,
    });
    navigation.navigate('TrainingFrequency', {
      ...previousParams,
      dedicationLevel: selectedLevel,
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
      <ProgressBar progress={0.38} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>What's your dedication{'\n'}level?</Text>

        <View style={styles.optionsContainer}>
          {dedicationLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[styles.optionCard, selectedLevel === level.id && styles.selectedCard]}
              onPress={() => handleSelect(level.id)}>
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
    fontSize: screenWidth * 0.065,
    fontWeight: '700',
    marginBottom: screenHeight * 0.04,
    lineHeight: screenWidth * 0.09,
  },
  optionsContainer: {
    width: '100%',
    gap: screenHeight * 0.02,
  },
  optionCard: {
    width: '100%',
    backgroundColor: '#081A2F', // Base color from gradient
    borderRadius: 12,
    padding: screenWidth * 0.05,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: screenWidth * 0.05,
  },
});
