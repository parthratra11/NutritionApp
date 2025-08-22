import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import WeekCalendar from '../components/WeekCalendar';
import { getCurrentWeekDates } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import SleepDetailScreen from './SleepDetailScreen'; // (optional reference, not required for navigation)

const { width: screenWidth } = Dimensions.get('window');

const HIGHLIGHT_COLOR = '#C7312B';
const BASE_COLOR = '#1E3046';

const qualityOptions = [
  { id: 'deep', label: 'Deep' },
  { id: 'restful', label: 'Restful' },
  { id: 'light', label: 'Light' },
  { id: 'interrupted', label: 'Interrupted' },
  { id: 'restless', label: 'Restless' },
];

const SleepQualityScreen = ({ route, navigation }) => {
  const { sleepTime, wakeTime, date } = route.params || {};
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user } = useAuth();
  const weekDates = getCurrentWeekDates();

  const handleQualitySelect = (quality) => {
    setSelectedQuality(quality);
  };

  const handleEnter = () => {
    if (!selectedQuality) {
      // Show some feedback that quality selection is required
      return;
    }
    setShowConfirmation(true);
  };

  const saveData = async () => {
    try {
      const sleepData = {
        date: date || new Date().toISOString().split('T')[0],
        sleepTime,
        wakeTime,
        quality: selectedQuality,
        timestamp: new Date().toISOString(),
      };

      // Get existing history
      const existingData = await AsyncStorage.getItem('sleepHistory');
      const sleepHistory = existingData ? JSON.parse(existingData) : [];

      // Check if entry already exists for this date and update it
      const existingEntryIndex = sleepHistory.findIndex(entry => entry.date === sleepData.date);
      if (existingEntryIndex >= 0) {
        sleepHistory[existingEntryIndex] = sleepData;
      } else {
        // Add new entry
        sleepHistory.unshift(sleepData);
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem('sleepHistory', JSON.stringify(sleepHistory));

      // If user is logged in, save to Firebase as well
      if (user?.email) {
        const docRef = doc(db, 'sleep', user.email.toLowerCase());
        await setDoc(docRef, { history: sleepHistory }, { merge: true });
      }

      // Navigate back or show success
      navigation.navigate('Sleep');
    } catch (error) {
      console.error('Error saving sleep data:', error);
    }
  };

  const handleDateSelect = (selectedDate) => {
    console.log('Selected date:', selectedDate.full);
    // Handle date selection logic if needed
  };

  return (
    <SafeAreaView style={styles.containerWithWhiteSpace}>
      <View style={styles.blueContent}>
        <WeekCalendar
          weekDates={weekDates}
          onDatePress={handleDateSelect}
          containerStyle={styles.calendarContainerStyle}
        />

        <View style={styles.questionContainer}>
          <Ionicons name="moon" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.questionText}>How well did you sleep last night?</Text>
        </View>

        <View style={styles.optionsContainer}>
          {qualityOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.qualityOption,
                { backgroundColor: selectedQuality === option.id ? HIGHLIGHT_COLOR : BASE_COLOR },
              ]}
              onPress={() => handleQualitySelect(option.id)}
            >
              <Text style={styles.qualityText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.enterButton} onPress={handleEnter}>
            <Text style={styles.enterButtonText}>Enter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() =>
              navigation.navigate('SleepDetailScreen', {
                selectedQuality,
              })
            }
          >
            <Text style={styles.detailButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Navbar activeScreen="WeeklyForm" />

      <ConfirmationModal
        visible={showConfirmation}
        message="Are you sure you want to save your sleep data?"
        onCancel={() => setShowConfirmation(false)}
        onConfirm={() => {
          setShowConfirmation(false);
          saveData();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerWithWhiteSpace: {
    flex: 1,
    backgroundColor: 'white',
  },
  blueContent: {
    flex: 1,
    backgroundColor: '#081A2F',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    marginBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
    alignItems: 'center',
    overflow: 'hidden',
  },
  calendarContainerStyle: {
    width: '100%',
    marginVertical: 20,
    marginBottom: 40,
    marginTop: 20,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  icon: {
    marginRight: 10,
  },
  questionText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionsContainer: {
    width: '100%',
    marginTop: 10,
    
  },
  qualityOption: {
    width: '100%',
    padding: 16,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
   
  },
  qualityText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonsRow:{
    position:'absolute',
    bottom:20,
    width:'100%',
    flexDirection:'row',
    justifyContent:'space-evenly',
  },
  enterButton:{
    backgroundColor:'#C7312B',
    paddingVertical:15,
    paddingHorizontal:32,
    borderRadius:25,
  },
  enterButtonText:{ color:'#fff', fontSize:16, fontWeight:'bold' },
  detailButton:{
    backgroundColor:'rgba(255,255,255,0.15)',
    paddingVertical:15,
    paddingHorizontal:32,
    borderRadius:25,
  },
  detailButtonText:{ color:'#fff', fontSize:16, fontWeight:'600' },
});

export default SleepQualityScreen;