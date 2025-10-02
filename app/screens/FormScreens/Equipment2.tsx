import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Equipment2({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  const cardioEquipment = [
    { id: 'treadmill', name: 'Treadmill' },
    { id: 'rower', name: 'Rower' },
    { id: 'crosstrainer', name: 'Cross- Trainer' },
    { id: 'skippingrope', name: 'Skipping Rope' }
  ];

  const toggleEquipment = (equipmentId) => {
    if (selectedEquipment.includes(equipmentId)) {
      setSelectedEquipment(selectedEquipment.filter(id => id !== equipmentId));
    } else {
      setSelectedEquipment([...selectedEquipment, equipmentId]);
    }
  };

  const handleNext = () => {
    navigation.navigate('Equipment3', {
      ...previousParams,
      cardioEquipment: selectedEquipment
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.85} barHeight={8} />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.questionText}>
            Do you have access to any cardio equipment at home ?
          </Text>
          
          <View style={styles.equipmentGrid}>
            {cardioEquipment.map((equipment, index) => (
              <TouchableOpacity
                key={equipment.id}
                style={[
                  styles.equipmentCard,
                  selectedEquipment.includes(equipment.id) && styles.selectedCard
                ]}
                onPress={() => toggleEquipment(equipment.id)}
              >
                <Text style={styles.equipmentText}>{equipment.name}</Text>
              </TouchableOpacity>
            ))}
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
    width: '47%', // Just under half to account for the space between
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
    transform: [{ translateX: -screenWidth * 0.125 }], // Half of the button width
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    textAlign: 'center',
  },
});