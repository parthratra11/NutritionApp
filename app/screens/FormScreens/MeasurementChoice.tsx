import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MeasurementChoice() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch intake form data from SQL backend
        const data = await intakeFormApi.getIntakeForm(user.email.toLowerCase());

        if (data) {
          setFormData(data);

          // If measurement system is already set, navigate to the next screen
          if (data.measurement_system) {
            navigation.navigate('WeightHeight', {
              measurementSystem: data.measurement_system,
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        // Don't show error for 404 (form not found)
        if (!(error instanceof Error && error.message.includes('404'))) {
          console.error('Error loading form data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email, navigation]);

  const saveFormData = async (data: any) => {
    if (!user?.email) return;

    setIsSaving(true);

    try {
      // Convert camelCase to snake_case for backend
      const updatedData = {
        measurement_system: data.measurementSystem,
        last_updated: new Date().toISOString(),
      };

      // Update the intake form in the SQL backend
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), updatedData);

      // Update local state
      setFormData({
        ...formData,
        measurement_system: data.measurementSystem,
      });

      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = async (system: 'imperial' | 'metric') => {
    const success = await saveFormData({ measurementSystem: system });
    if (success) {
      navigation.navigate('WeightHeight', { measurementSystem: system });
    }
  };

  if (isLoading) {
    return (
      <BackgroundWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.08} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>Preferred Measurement{'\n'} System</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.measurementButton}
            onPress={() => handleSelect('imperial')}
            disabled={isSaving}>
            <Text style={styles.buttonText}>
              {isSaving && formData.measurement_system === 'imperial' ? 'Saving...' : 'Imperial'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.measurementButton}
            onPress={() => handleSelect('metric')}
            disabled={isSaving}>
            <Text style={styles.buttonText}>
              {isSaving && formData.measurement_system === 'metric' ? 'Saving...' : 'Metric'}
            </Text>
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
    gap: screenWidth * 0.15,
    marginBottom: 32,
  },
  measurementButton: {
    width: screenWidth * 0.36,
    height: screenHeight * 0.053,
    borderRadius: 17.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(217, 217, 217, 0.00)',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});
