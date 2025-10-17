import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Equipment1({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const [fitnessTech, setFitnessTech] = useState('');
  const [skinfoldCalipers, setSkinfoldCalipers] = useState('');
  const [hasMeasuringTape, setHasMeasuringTape] = useState(null);

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

          // Populate form fields with existing data
          if (data.fitness_tech) setFitnessTech(data.fitness_tech);
          if (data.skinfold_calipers) setSkinfoldCalipers(data.skinfold_calipers);
          if (data.has_measuring_tape !== undefined && data.has_measuring_tape !== null) {
            setHasMeasuringTape(data.has_measuring_tape);
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
    // Save data to SQL backend before navigating
    await saveFormData({
      fitness_tech: fitnessTech,
      skinfold_calipers: skinfoldCalipers,
      has_measuring_tape: hasMeasuringTape,
      equipment1_completed: true,
    });

    // Navigate to next screen with updated params
    navigation.navigate('Equipment2', {
      ...previousParams,
      fitnessTech,
      skinfoldCalipers,
      hasMeasuringTape,
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
      <ProgressBar progress={0.7} barHeight={8} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.contentContainer}>
          <View style={styles.questionContainer}>
            {/* First question section */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Do you wear any fitness technology ?</Text>
              <Text style={styles.descriptionText}>
                (Apple Watch, FitBit, Oura Ring, HR Chest Strap, etc)
              </Text>

              <TextInput
                style={styles.input}
                value={fitnessTech}
                onChangeText={setFitnessTech}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            {/* Second question section */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Do you have skinfold calipers and if so, which one(s)?
              </Text>

              <TextInput
                style={styles.input}
                value={skinfoldCalipers}
                onChangeText={setSkinfoldCalipers}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            {/* Third question section */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Do you have a MyoTape (for taking circumference measurements)?
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton, 
                    hasMeasuringTape === true ? styles.selectedButton : null
                  ]}
                  onPress={() => setHasMeasuringTape(true)}>
                  <Text
                    style={[
                      styles.optionButtonText,
                      hasMeasuringTape === true ? styles.selectedButtonText : null,
                    ]}>
                    Yes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton, 
                    hasMeasuringTape === false ? styles.selectedButton : null
                  ]}
                  onPress={() => setHasMeasuringTape(false)}>
                  <Text
                    style={[
                      styles.optionButtonText,
                      hasMeasuringTape === false ? styles.selectedButtonText : null,
                    ]}>
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>&gt;</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.03,
    paddingTop: screenHeight * 0.12,
    paddingBottom: screenHeight * 0.05,
  },
  questionContainer: {
    flex: 1,
  },
  questionSection: {
    marginBottom: screenHeight * 0.08, // Add significant space between question sections
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.044,
    fontWeight: '600',
    marginBottom: screenHeight * 0.01,
    lineHeight: screenWidth * 0.06,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.03,
    opacity: 0.8,
    marginBottom: screenHeight * 0.02,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    padding: 0,
    paddingBottom: 8,
    textAlignVertical: 'bottom',
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: screenHeight * 0.03,
    width: '100%',
    maxWidth: screenWidth * 0.7,
  },
  optionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.09,
    minWidth: screenWidth * 0.25,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#C7312B',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
  },
  selectedButtonText: {
    color: 'white', // Dark blue color when button is selected
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: screenHeight * 0.05,
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
