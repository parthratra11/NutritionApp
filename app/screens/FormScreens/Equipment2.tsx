import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { useAuth } from '../../context/AuthContext';
import { intakeFormApi } from '../../api/client'; // Make sure this import is correct

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Equipment2({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const cardioEquipment = [
    { id: 'treadmill', name: 'Treadmill' },
    { id: 'rower', name: 'Rower' },
    { id: 'crosstrainer', name: 'Cross-Trainer' },
    { id: 'skipping_rope', name: 'Skipping Rope' },
  ];

  useEffect(() => {
    const loadCardioEquipment = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        // Load existing form data including cardio equipment
        const formData = await intakeFormApi.getIntakeForm(user.email.toLowerCase());

        if (formData && formData.cardio_equipment && Array.isArray(formData.cardio_equipment)) {
          const existingEquipment = formData.cardio_equipment.map((item) =>
            typeof item === 'string' ? item : item.equipment_type
          );
          setSelectedEquipment(existingEquipment);
          console.log('Loaded existing cardio equipment:', existingEquipment);
        }
      } catch (error) {
        console.error('Error loading cardio equipment:', error);
        // Don't show error for 404 (form not found)
        if (!(error instanceof Error && error.message.includes('404'))) {
          Alert.alert(
            'Error',
            'Could not load your equipment data. You can still make selections.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCardioEquipment();
  }, [user?.email]);

  const toggleEquipment = (equipmentId) => {
    if (selectedEquipment.includes(equipmentId)) {
      setSelectedEquipment(selectedEquipment.filter((id) => id !== equipmentId));
    } else {
      setSelectedEquipment([...selectedEquipment, equipmentId]);
    }
  };

  const handleNext = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);

      // Update the equipment2_completed flag in intake_forms table
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), {
        equipment2_completed: true,
      });

      // Save selected cardio equipment to cardio_equipment table
      if (selectedEquipment.length > 0) {
        await intakeFormApi.saveUserCardioEquipment(user.email.toLowerCase(), selectedEquipment);
        console.log('Saved cardio equipment:', selectedEquipment);
      }

      navigation.navigate('Equipment3', {
        ...previousParams,
        cardioEquipment: selectedEquipment,
      });
    } catch (error) {
      console.error('Error saving cardio equipment:', error);
      Alert.alert('Error', 'Could not save your equipment. Please try again.');
    } finally {
      setIsLoading(false);
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
      <ProgressBar progress={0.74} barHeight={8} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.contentContainer}>
          <Text style={styles.questionText}>
            Do you have access to any cardio equipment at home?
          </Text>

          <View style={styles.equipmentGrid}>
            {cardioEquipment.map((equipment) => (
              <TouchableOpacity
                key={equipment.id}
                style={[
                  styles.equipmentCard,
                  selectedEquipment.includes(equipment.id) && styles.selectedCard,
                ]}
                onPress={() => toggleEquipment(equipment.id)}>
                <Text style={styles.equipmentText}>{equipment.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.nextButton, isLoading && { opacity: 0.6 }]}
            onPress={handleNext}
            disabled={isLoading}>
            <Text style={styles.nextButtonText}>{isLoading ? '...' : '>'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.05,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.06,
    fontWeight: '600',
    marginBottom: screenHeight * 0.06,
    lineHeight: screenWidth * 0.08,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: screenHeight * 0.1,
  },
  equipmentCard: {
    width: '47%',
    height: screenWidth * 0.35,
    backgroundColor: '#081A2F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.02,
    padding: screenWidth * 0.03,
  },
  selectedCard: {
    backgroundColor: '#C7312B',
    borderColor: '#C7312B',
  },
  equipmentText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'absolute',
    bottom: screenHeight * 0.17,
    left: '50%',
    transform: [{ translateX: -screenWidth * 0.125 }],
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
