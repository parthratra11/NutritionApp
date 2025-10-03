import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Equipment3({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [showLegCurlModal, setShowLegCurlModal] = useState(false);
  const [legCurlType, setLegCurlType] = useState('');

  // New state for dumbbell modal
  const [showDumbbellModal, setShowDumbbellModal] = useState(false);
  const [dumbbellModalStep, setDumbbellModalStep] = useState(1); // 1: Ask if full set, 2: Min/Max or specific weights
  const [isFullSet, setIsFullSet] = useState(null);
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [specificWeights, setSpecificWeights] = useState('');

  // Load existing form data from Firestore
  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(data);

          // Populate form fields with existing data
          if (data.gymEquipment && Array.isArray(data.gymEquipment)) {
            setSelectedEquipment(data.gymEquipment);
          }

          if (data.legCurlType) {
            setLegCurlType(data.legCurlType);
          }

          if (data.dumbbellInfo) {
            setIsFullSet(data.dumbbellInfo.isFullSet);
            if (data.dumbbellInfo.isFullSet) {
              setMinWeight(data.dumbbellInfo.minWeight);
              setMaxWeight(data.dumbbellInfo.maxWeight);
            } else {
              setSpecificWeights(data.dumbbellInfo.specificWeights);
            }
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email]);

  // Save form data to Firestore
  const saveFormData = async (data: any) => {
    if (!user?.email) return;

    try {
      await setDoc(
        doc(db, 'intakeForms', user.email.toLowerCase()),
        {
          ...formData,
          ...data,
          email: user.email.toLowerCase(),
          lastUpdated: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const gymEquipment = [
    {
      id: 'squat_rack',
      name: 'Squat cage or rack',
      image: require('../../assets/intakeform/SquatRack.png'),
    },
    {
      id: 'hyperextension',
      name: '45° hyperextension bench',
      image: require('../../assets/intakeform/Hyperextension.png'),
    },
    {
      id: 'leg_press',
      name: 'Leg Press Machine',
      image: require('../../assets/intakeform/LegPress.png'),
    },
    {
      id: 'dual_pulley',
      name: 'Dual pulley cable machine',
      image: require('../../assets/intakeform/dualpulley.png'),
    },
    {
      id: 'trap_bar',
      name: 'Trap Bar',
      image: require('../../assets/intakeform/TrapBar.png'),
    },
    {
      id: 'leg_curl',
      name: 'Leg Curl Machine',
      image: require('../../assets/intakeform/LegCurl.png'),
    },
    {
      id: 'gymnastics_rings',
      name: 'Gymnastic Rings',
      image: require('../../assets/intakeform/GymnasticsRings.png'),
    },
    {
      id: 'trx',
      name: 'TRX / Similar Suspension Device',
      image: require('../../assets/intakeform/Trx.png'),
    },
    {
      id: 'dumbbell_set',
      name: 'Full Dumbbell Set',
      image: require('../../assets/intakeform/dumbellSet.png'),
    },
    {
      id: 'pull_up_bar',
      name: 'Pull-Up Bar',
      image: require('../../assets/intakeform/PullupBar.png'),
    },
    {
      id: 'single_column',
      name: 'Single Column Cable Machine',
      image: require('../../assets/intakeform/SinglePulley.png'),
    },
    {
      id: 'seated_calf_machine',
      name: 'Seated Calf Machine',
      image: require('../../assets/intakeform/SeatedCalf.png'),
    },
    {
      id: 'leg_extension',
      name: 'Leg extension machine',
      image: require('../../assets/intakeform/LegExtension.png'),
    },
    {
      id: 'bench',
      name: 'Bench Press',
      image: require('../../assets/intakeform/bench.png'),
    },
    {
      id: 'cable_tower',
      name: 'Cable Tower',
      image: require('../../assets/intakeform/CableTower.png'),
    },
    {
      id: 'dip_station',
      name: 'Dip Station',
      image: require('../../assets/intakeform/Dip.png'),
    },
    {
      id: 'glute_machine',
      name: 'Glute Machine',
      image: require('../../assets/intakeform/Glute.png'),
    },
    {
      id: 'resistance_bands',
      name: 'Resistance Bands',
      image: require('../../assets/intakeform/ResistanceBands.png'),
    },
    {
      id: 'standing_calf_raise',
      name: 'Standing Calf Raise',
      image: require('../../assets/intakeform/StandingCalfRaise.png'),
    },
    {
      id: 'step',
      name: 'Step Platform',
      image: require('../../assets/intakeform/step.png'),
    },
  ];

  const toggleEquipment = (equipmentId) => {
    // Special handling for leg curl machine
    if (equipmentId === 'leg_curl') {
      if (selectedEquipment.includes('leg_curl')) {
        setSelectedEquipment(selectedEquipment.filter((id) => id !== 'leg_curl'));
        setLegCurlType('');
      } else {
        setShowLegCurlModal(true);
      }
      return;
    }

    // Special handling for dumbbell set
    if (equipmentId === 'dumbbell_set') {
      if (selectedEquipment.includes('dumbbell_set')) {
        setSelectedEquipment(selectedEquipment.filter((id) => id !== 'dumbbell_set'));
        // Reset dumbbell-related state
        setIsFullSet(null);
        setMinWeight('');
        setMaxWeight('');
        setSpecificWeights('');
      } else {
        setShowDumbbellModal(true);
        setDumbbellModalStep(1);
      }
      return;
    }

    // Normal toggle behavior for other equipment
    if (selectedEquipment.includes(equipmentId)) {
      setSelectedEquipment(selectedEquipment.filter((id) => id !== equipmentId));
    } else {
      setSelectedEquipment([...selectedEquipment, equipmentId]);
    }
  };

  const handleLegCurlSelection = (type) => {
    setLegCurlType(type);
    if (!selectedEquipment.includes('leg_curl')) {
      setSelectedEquipment([...selectedEquipment, 'leg_curl']);
    }
    setShowLegCurlModal(false);
  };

  const closeModal = () => {
    setShowLegCurlModal(false);
    setShowDumbbellModal(false);
    setDumbbellModalStep(1);
  };

  const handleFullSetSelection = (isFullSetValue) => {
    setIsFullSet(isFullSetValue);
    if (isFullSetValue) {
      // If it's a full set, go to min/max weight input
      setDumbbellModalStep(2);
    } else {
      // If not a full set, go to specific weights input
      setDumbbellModalStep(3);
    }
  };

  const handleDumbbellSubmit = () => {
    // Add dumbbell_set to selected equipment if not already there
    if (!selectedEquipment.includes('dumbbell_set')) {
      setSelectedEquipment([...selectedEquipment, 'dumbbell_set']);
    }

    // Close the modal
    setShowDumbbellModal(false);
    setDumbbellModalStep(1);
  };

  const handleNext = async () => {
    // Prepare dumbbell information
    const dumbbellInfo =
      isFullSet !== null
        ? isFullSet
          ? { isFullSet: true, minWeight: minWeight, maxWeight: maxWeight }
          : { isFullSet: false, specificWeights: specificWeights }
        : null;

    // Save data to Firestore before navigating
    await saveFormData({
      gymEquipment: selectedEquipment,
      legCurlType: legCurlType,
      dumbbellInfo: dumbbellInfo,
      equipment3Completed: true,
    });

    // Navigate to next screen with updated params
    navigation.navigate('Equipment4', {
      ...previousParams,
      gymEquipment: selectedEquipment,
      legCurlType: legCurlType,
      dumbbellInfo: dumbbellInfo,
    });
  };

  // Get all equipment except the last two items
  const mainEquipment = gymEquipment.slice(0, gymEquipment.length - 2);
  // Get the second-to-last item
  const secondLastItem = gymEquipment[gymEquipment.length - 2];
  // Get the last item
  const lastItem = gymEquipment[gymEquipment.length - 1];

  // Render the appropriate dumbbell modal content based on step
  const renderDumbbellModalContent = () => {
    switch (dumbbellModalStep) {
      case 1: // Is it a full set?
        return (
          <>
            <Text style={styles.modalTitle}>Is it a full set?</Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, isFullSet === true && styles.redButton]}
                onPress={() => handleFullSetSelection(true)}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, isFullSet === false && styles.redButton]}
                onPress={() => handleFullSetSelection(false)}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 2: // Min/Max weight for full set
        return (
          <>
            <View style={styles.weightInputContainer}>
              <Text style={styles.weightLabel}>Min Weight</Text>
              <TextInput
                style={styles.weightInput}
                value={minWeight}
                onChangeText={setMinWeight}
                placeholderTextColor="#CCCCCC"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.weightInputContainer}>
              <Text style={styles.weightLabel}>Max Weight</Text>
              <TextInput
                style={styles.weightInput}
                value={maxWeight}
                onChangeText={setMaxWeight}
                placeholderTextColor="#CCCCCC"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.nextButtonSmall, minWeight && maxWeight ? {} : styles.disabledButton]}
              onPress={handleDumbbellSubmit}
              disabled={!minWeight || !maxWeight}>
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          </>
        );

      case 3: // Specific weights for non-full set
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What dumbbells weights do you have access to?</Text>
            </View>

            <TextInput
              style={styles.specificWeightsInput}
              value={specificWeights}
              onChangeText={setSpecificWeights}
              placeholderTextColor="#CCCCCC"
              multiline
            />

            <TouchableOpacity
              style={[styles.submitButton, !specificWeights ? styles.disabledButton : {}]}
              onPress={handleDumbbellSubmit}
              disabled={!specificWeights}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
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
      <ProgressBar progress={0.78} barHeight={8} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.contentContainer}>
          <Text style={styles.questionText}>Do you have access to...</Text>

          <View style={styles.equipmentGrid}>
            {/* Display all equipment except the last two */}
            {mainEquipment.map((equipment) => (
              <TouchableOpacity
                key={equipment.id}
                style={[
                  styles.equipmentCard,
                  selectedEquipment.includes(equipment.id) && styles.selectedCard,
                ]}
                onPress={() => toggleEquipment(equipment.id)}>
                <Image
                  source={equipment.image}
                  style={styles.equipmentImage}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.equipmentText,
                    selectedEquipment.includes(equipment.id) && styles.selectedEquipmentText,
                  ]}>
                  {equipment.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Last row with second-to-last item, next button, and last item */}
          <View style={styles.lastRowContainer}>
            {/* Second-to-last item */}
            <TouchableOpacity
              key={secondLastItem.id}
              style={[
                styles.equipmentCard,
                selectedEquipment.includes(secondLastItem.id) && styles.selectedCard,
              ]}
              onPress={() => toggleEquipment(secondLastItem.id)}>
              <Image
                source={secondLastItem.image}
                style={styles.equipmentImage}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.equipmentText,
                  selectedEquipment.includes(secondLastItem.id) && styles.selectedEquipmentText,
                ]}>
                {secondLastItem.name}
              </Text>
            </TouchableOpacity>

            {/* Next button */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>

            {/* Last item */}
            <TouchableOpacity
              key={lastItem.id}
              style={[
                styles.equipmentCard,
                selectedEquipment.includes(lastItem.id) && styles.selectedCard,
              ]}
              onPress={() => toggleEquipment(lastItem.id)}>
              <Image source={lastItem.image} style={styles.equipmentImage} resizeMode="contain" />
              <Text
                style={[
                  styles.equipmentText,
                  selectedEquipment.includes(lastItem.id) && styles.selectedEquipmentText,
                ]}>
                {lastItem.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Leg Curl Type Modal */}
      <Modal
        visible={showLegCurlModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay} onTouchEnd={closeModal}>
          <View style={styles.modalContainer} onTouchEnd={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Is the leg curl machine,</Text>
            </View>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.redButton]}
                onPress={() => handleLegCurlSelection('standing')}>
                <Text style={styles.modalButtonText}>Standing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleLegCurlSelection('lying')}>
                <Text style={styles.modalButtonText}>Lying</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleLegCurlSelection('seated')}>
                <Text style={styles.modalButtonText}>Seated</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dumbbell Modal */}
      <Modal
        visible={showDumbbellModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay} onTouchEnd={closeModal}>
          <View
            style={[
              styles.modalContainer,
              dumbbellModalStep === 2 && styles.modalContainerTall,
              dumbbellModalStep === 3 && styles.modalContainerTall,
            ]}
            onTouchEnd={(e) => e.stopPropagation()}>
            {renderDumbbellModalContent()}
          </View>
        </View>
      </Modal>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.03,
    paddingTop: screenHeight * 0.05,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.06,
    fontWeight: '600',
    marginBottom: screenHeight * 0.02,
    marginLeft: screenWidth * 0.02,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: screenHeight * 0.015,
  },
  lastRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenHeight * 0.03,
  },
  equipmentCard: {
    width: '31%',
    height: screenHeight * 0.15,
    backgroundColor: '#FFFFFFB0',
    borderRadius: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenHeight * 0.015,
    padding: screenWidth * 0.02,
    overflow: 'hidden',
  },
  selectedCard: {
    backgroundColor: '#C7312B',
    borderColor: '#C7312B',
  },
  equipmentImage: {
    width: '90%',
    height: '67%',
    marginBottom: 5,
  },
  equipmentText: {
    color: '#000000',
    fontSize: screenWidth * 0.027,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: screenWidth * 0.032,
  },
  selectedEquipmentText: {
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#C7312B',
    width: '31%',
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.25,
    backgroundColor: '#081A2FED',
    borderRadius: 20,
    padding: screenWidth * 0.05,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerTall: {
    height: screenHeight * 0.35,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: screenHeight * 0.025,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    padding: 5,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.06,
    fontWeight: '600',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: screenWidth * 0.02,
    marginTop: screenHeight * 0.01,
  },
  modalButton: {
    backgroundColor: '#3A4A5B',
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.04,
    borderRadius: 10,
    minWidth: screenWidth * 0.22,
    alignItems: 'center',
  },
  redButton: {
    backgroundColor: '#C7312B',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.035,
    fontWeight: '500',
  },
  weightInputContainer: {
    width: '100%',
    marginBottom: screenHeight * 0.02,
  },
  weightLabel: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    marginBottom: screenHeight * 0.01,
  },
  weightInput: {
    backgroundColor: '#081A2FED',
    borderRadius: 15,
    padding: screenWidth * 0.03,
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    borderColor: 'white',
    borderWidth: 0.5,
  },
  specificWeightsInput: {
    backgroundColor: '#081A2FED',
    borderRadius: 15,
    padding: screenWidth * 0.03,
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    width: '100%',
    height: screenHeight * 0.1,
    textAlignVertical: 'top',
    marginVertical: screenHeight * 0.02,
    borderColor: 'white',
    borderWidth: 0.5,
  },
  submitButton: {
    backgroundColor: '#C7312B',
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.08,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
  },
  nextButtonSmall: {
    backgroundColor: '#C7312B',
    width: screenWidth * 0.15,
    height: screenWidth * 0.15,
    borderRadius: screenWidth * 0.075,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: screenHeight * 0.02,
  },
  disabledButton: {
    backgroundColor: '#888888',
    opacity: 0.7,
  },
  modalCloseContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: screenHeight * 0.02,
  },
  // Add new styles for loading state
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
