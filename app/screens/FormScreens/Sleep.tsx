import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Sleep({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const [formData, setFormData] = useState<any>({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const sleepOptions = [
    {
      id: 'sleep_deprived',
      text: 'Chronically sleep deprived (less than 7 hours)',
    },
    {
      id: 'decent_sleep',
      text: 'Decent sleep quality (7+ hours)',
    },
    {
      id: 'excellent_sleep',
      text: 'Excellent sleep quality (8+ hours)',
    },
  ];

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

          if (data.sleep_quality) {
            setSelectedOption(data.sleep_quality);
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

  const handleSelection = (optionId) => {
    setSelectedOption(optionId);
  };

  const handleNext = async () => {
    if (selectedOption) {
      await saveFormData({
        sleep_quality: selectedOption,
        sleep_form_completed: true,
      });

      navigation.navigate('Caffeine', {
        ...previousParams,
        sleepQuality: selectedOption,
      });
    }
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.62} barHeight={8} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>How is your sleep rhythm and quality? *</Text>

          <View style={styles.optionsContainer}>
            {sleepOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, selectedOption === option.id && styles.selectedCard]}
                onPress={() => handleSelection(option.id)}>
                <Text style={styles.optionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedOption && (
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
});
