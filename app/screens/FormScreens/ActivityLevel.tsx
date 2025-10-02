import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ActivityLevel({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [selectedLevel, setSelectedLevel] = useState(null);

  const activityLevels = [
    {
      id: 'sedentary',
      text: 'Sedentary (e.g. office job), below 7,500 steps/day'
    },
    {
      id: 'somewhat_active',
      text: 'Somewhat active (e.g. you walk your dog several times a day or you commute by bicycle/on foot), 7,500 - 9,999 steps/day'
    },
    {
      id: 'active',
      text: 'Active (e.g. full-time PT, literally on your feet most of the day), 10,000 - 12,500 steps/day'
    },
    {
      id: 'very_active',
      text: 'Very active (e.g. involved in physical labour), over 12,500 steps/day with intensive movement'
    }
  ];

  const handleSelection = (levelId) => {
    setSelectedLevel(levelId);
  };

  const handleNext = () => {
    if (selectedLevel) {
      navigation.navigate('StressLevel', {
        ...previousParams,
        activityLevel: selectedLevel
      });
    }
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.65} barHeight={8} />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>
            Which of the following options best describes your activity level?
          </Text>
          <Text style={styles.descriptionText}>
            (this does NOT include exercise)
          </Text>
          
          <View style={styles.optionsContainer}>
            {activityLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.optionCard,
                  selectedLevel === level.id && styles.selectedCard
                ]}
                onPress={() => handleSelection(level.id)}
              >
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
    paddingHorizontal: screenWidth * 0.04,
    marginTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.05,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.05,
    fontWeight: '700',
    marginBottom: screenHeight * 0.01,
    lineHeight: screenWidth * 0.09,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.03,
    marginBottom: screenHeight * 0.04,
    opacity: 0.8,
  },
  optionsContainer: {
    width: '100%',
    gap: screenHeight * 0.006,
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
    fontSize: screenWidth * 0.03,
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