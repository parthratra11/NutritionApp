import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StrengthChoice({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const [formData, setFormData] = useState<any>({});
  const [strengthExperience, setStrengthExperience] = useState<string>('');
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
          setStrengthExperience(data.strength_training_experience || '');
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

  const handleSelect = async (hasExperience: boolean) => {
    const experienceValue = hasExperience ? 'Yes' : 'No';
    setStrengthExperience(experienceValue);

    await saveFormData({
      strength_training_experience: experienceValue,
      strength_choice_completed: true,
    });

    if (hasExperience) {
      navigation.navigate('Strength1', {
        ...previousParams,
        strengthExperience: hasExperience,
      });
    } else {
      navigation.navigate('Goals', {
        ...previousParams,
        strengthExperience: hasExperience,
      });
    }
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.16} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>Experience in Strength{'\n'}Training?</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.choiceButton} onPress={() => handleSelect(true)}>
            <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.choiceButton} onPress={() => handleSelect(false)}>
            <Text style={styles.buttonText}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.07,
    marginTop: -screenHeight * 0.05,
  },
  mainTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.064,
    fontWeight: '700',
    lineHeight: screenWidth * 0.09,
    marginBottom: screenHeight * 0.08,
    maxWidth: '95%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: screenWidth * 0.08,
    marginBottom: 32,
  },
  choiceButton: {
    width: screenWidth * 0.4,
    height: screenHeight * 0.053,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: screenWidth * 0.036,
    fontWeight: '600',
    lineHeight: screenWidth * 0.041,
  },
});
