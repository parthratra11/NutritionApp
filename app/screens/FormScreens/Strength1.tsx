import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import Slider from '@react-native-community/slider';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Strength1({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const [formData, setFormData] = useState<any>({});
  const [competencyLevel, setCompetencyLevel] = useState(0.5); // Keep for UI
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) return;

      try {
        // Get intake form data from SQL backend
        const data = await intakeFormApi.getIntakeForm(user.email.toLowerCase());

        if (data) {
          setFormData(data);
          // Convert text back to slider value for display
          const savedCompetency = data.strength_competency;
          if (savedCompetency === 'Novice') setCompetencyLevel(0.2);
          else if (savedCompetency === 'Intermediate') setCompetencyLevel(0.5);
          else if (savedCompetency === 'Advanced') setCompetencyLevel(0.8);
          else setCompetencyLevel(data.strength_competency_value || 0.5);

          setComments(data.strength_competency_comments || '');
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

  const saveFormData = async (data: any) => {
    if (!user?.email) return;

    try {
      // Update intake form in SQL backend
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), {
        strength_competency: data.strength_competency,
        strength_competency_value: data.strength_competency_value,
        strength_competency_comments: data.strength_competency_comments,
        last_updated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving form data:', error);
      Alert.alert('Error', 'Could not save your data. Please try again.');
    }
  };

  // Function to get label text based on slider value
  const getCompetencyText = () => {
    if (competencyLevel < 0.33) return 'Novice';
    if (competencyLevel < 0.67) return 'Intermediate';
    return 'Advanced';
  };

  const handleNext = async () => {
    const competencyText = getCompetencyText();

    await saveFormData({
      strength_competency: competencyText, // Save text instead of number
      strength_competency_value: competencyLevel, // Keep numeric for reference
      strength_competency_comments: comments,
    });

    navigation.navigate('Strength2', {
      ...previousParams,
      competencyLevel: competencyText, // Pass text to next screen
      trainingComments: comments,
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.2} barHeight={8} />
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
            <Text style={styles.mainTitle}>
              How would you rate your competency on the mentioned exercises?
            </Text>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={competencyLevel}
                onValueChange={setCompetencyLevel}
                minimumTrackTintColor="#C7312B"
                maximumTrackTintColor="#FFFFFF"
                thumbTintColor="#C7312B"
              />

              <View style={styles.labelsContainer}>
                <Text style={styles.labelText}>
                  Novice{'\n'}(Questionable{'\n'}Technique)
                </Text>
                <Text style={styles.labelText}>
                  Intermediate{'\n'}(Reasonably{'\n'}Competent but could{'\n'}Improve)
                </Text>
                <Text style={styles.labelText}>
                  Advanced (Highly{'\n'}competent, with{'\n'}months/years of{'\n'}consistent{'\n'}
                  application)
                </Text>
              </View>
            </View>

            <View style={styles.commentsContainer}>
              <Text style={styles.commentsLabel}>
                Comments? (Add any context to your training history)
              </Text>
              <TextInput
                style={styles.commentsInput}
                value={comments}
                onChangeText={setComments}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Add any context to your training history..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>&gt;</Text>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.02,
    paddingTop: screenHeight * 0.15,
    paddingBottom: screenHeight * 0.1, // Added bottom padding
    minHeight: screenHeight * 0.9, // Ensure minimum height
  },
  mainTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.055,
    fontWeight: '700',
    lineHeight: screenWidth * 0.075,
    marginBottom: screenHeight * 0.05,
    maxWidth: '95%',
  },
  sliderContainer: {
    width: '100%',
    marginBottom: screenHeight * 0.05,
    paddingHorizontal: screenWidth * 0.01, // Add slight padding to slider container
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.028,
    textAlign: 'center',
    opacity: 0.8,
    width: '33%',
  },
  commentsContainer: {
    width: '100%',
    marginBottom: screenHeight * 0.04,
    marginTop: screenHeight * 0.03,
  },
  commentsLabel: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.034,
    fontWeight: '600',
    marginBottom: 10,
  },
  commentsInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#BFC9D1',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.036,
    paddingVertical: 20,
    fontFamily: 'Texta',
    minHeight: screenHeight * 0.08, // Minimum height for better touch target
    maxHeight: screenHeight * 0.15, // Maximum height to prevent overflow
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.28,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.04,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});
