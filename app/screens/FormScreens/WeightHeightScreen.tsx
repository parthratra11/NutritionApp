import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WeightHeightScreen({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const [formData, setFormData] = useState<any>({});
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [bodyFat, setBodyFat] = useState('');
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
          // Use snake_case field names from backend
          setHeight(data.height || '');
          setWeight(data.weight || '');
          setAge(data.age || '');
          setBodyFat(data.body_fat || ''); // Get body_fat directly from intake form
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        // Don't show error for 404 (form not found)
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email]);

  const saveFormData = async (data: any) => {
    if (!user?.email) return false;

    setIsSaving(true);
    try {
      // Save all data including body_fat directly to the intake form
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), {
        height: data.height,
        weight: data.weight,
        age: data.age,
        body_fat: data.bodyFat, // Save body_fat directly to intake form
        measurement_system: data.measurementSystem,
        weight_height_completed: true,
        last_updated: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      Alert.alert('Error', 'There was an error saving your data. Please try again.', [
        { text: 'OK' },
      ]);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Get measurement system from route params or form data
  const measurementSystem =
    previousParams.measurementSystem || formData.measurement_system || 'imperial';

  // Correct unit labels based on measurement system
  const heightUnit = measurementSystem === 'imperial' ? 'ft & in' : 'cm';
  const weightUnit = measurementSystem === 'imperial' ? 'lbs' : 'kg';

  const handleNext = async () => {
    const success = await saveFormData({
      height,
      weight,
      age,
      bodyFat,
      measurementSystem,
      weightHeightCompleted: true,
    });

    if (success) {
      navigation.navigate('StrengthChoice', {
        ...previousParams,
        height,
        weight,
        age,
        bodyFat,
        measurementSystem,
      });
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
      <ProgressBar progress={0.12} barHeight={8} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Height</Text>
                <Text style={styles.unit}>{heightUnit}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder={measurementSystem === 'imperial' ? '5\'10"' : '175'}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="numeric"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Weight</Text>
                <Text style={styles.unit}>{weightUnit}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder={measurementSystem === 'imperial' ? '170' : '77'}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="numeric"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Age</Text>
                <Text style={styles.unit}>years</Text>
              </View>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="25"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="numeric"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Body Fat Percentage (if known)</Text>
              <TextInput
                style={styles.input}
                value={bodyFat}
                onChangeText={setBodyFat}
                placeholder="15"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="numeric"
                editable={!isSaving}
              />
            </View>

            <TouchableOpacity
              style={[styles.nextButton, isSaving && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isSaving}>
              <Text style={styles.nextButtonText}>{isSaving ? '...' : '>'}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.07,
    paddingVertical: screenHeight * 0.1,
    minHeight: screenHeight * 0.8, // Ensure minimum height
  },
  inputGroup: {
    width: '100%',
    marginBottom: screenHeight * 0.06,
    paddingHorizontal: screenWidth * 0.02,
    paddingVertical: screenHeight * 0.02,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    fontWeight: '700',
    fontFamily: 'Texta',
  },
  unit: {
    color: '#BFC9D1',
    fontSize: screenWidth * 0.035,
    fontWeight: '400',
    fontFamily: 'Texta',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.048,
    paddingVertical: 6,
    fontFamily: 'Texta',
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.3,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.04,
  },
  buttonDisabled: {
    backgroundColor: '#8B3330', // Darker shade when disabled
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.08,
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
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Texta',
  },
});
