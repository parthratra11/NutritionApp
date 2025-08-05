import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import WeekCalendar from '../components/WeekCalendar'; // Import the WeekCalendar component
import { getCurrentWeekDates } from '../utils/dateUtils'; // Import the date utility
import ConfirmationModal from '../components/ConfirmationModal';  // Import reusable ConfirmationModal

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const mealFields = ['Protein (g)', 'Fat (g)', 'Carbohydrate (g)', 'Kcal'];

const defaultMeals = {
  training: ['Pre-workout', 'Lunch', 'Afternoon', 'Dinner'],
  rest: ['Breakfast', 'Lunch', 'Dinner'],
  cardio: ['Breakfast', 'Lunch', 'Dinner'],
};

// Predefined nutrition goals for each meal
const mealGoals = {
  'Pre-workout': { 'Protein (g)': 25, 'Fat (g)': 10, 'Carbohydrate (g)': 30, 'Kcal': 300 },
  'Lunch': { 'Protein (g)': 30, 'Fat (g)': 15, 'Carbohydrate (g)': 50, 'Kcal': 500 },
  'Afternoon': { 'Protein (g)': 20, 'Fat (g)': 10, 'Carbohydrate (g)': 40, 'Kcal': 400 },
  'Dinner': { 'Protein (g)': 35, 'Fat (g)': 15, 'Carbohydrate (g)': 60, 'Kcal': 600 },
  'Breakfast': { 'Protein (g)': 20, 'Fat (g)': 10, 'Carbohydrate (g)': 30, 'Kcal': 350 },
};

// Determine default day type based on current day (weekend = rest, weekday = training)
const getDefaultDayType = () => {
  const currentDay = new Date().getDay();
  // Assuming Sunday (0) & Saturday (6) are rest days
  return currentDay === 0 || currentDay === 6 ? 'rest' : 'training';
};

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getDaysBetween(date1, date2) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function getWeekAndDayKey(firstEntryDate) {
  const today = new Date();
  const start = new Date(firstEntryDate);
  const daysSinceFirst = getDaysBetween(start, today);
  const weekNum = Math.floor(daysSinceFirst / 7) + 1;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[today.getDay()];
  return { weekKey: `week${weekNum}`, dayKey: dayName };
}

const NutritionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [dayType, setDayType] = useState(getDefaultDayType());
  const [mealData, setMealData] = useState({});
  const [loading, setLoading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [firstEntryDate, setFirstEntryDate] = useState(null);
  const [showDayTypeDropdown, setShowDayTypeDropdown] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  // Refs for animations and scrolling
  const navbarRef = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollTimeout = useRef(null);
  const lastScrollY = useRef(0);

  // Get the week dates using our utility function
  const weekDates = getCurrentWeekDates();

  // Handle date selection
  const handleDateSelect = (selectedDate) => {
    console.log('Selected date:', selectedDate.full);
    // You can add your logic here to update data based on the selected date
  };

  // Reset mealData when dayType changes
  useEffect(() => {
    setMealData({});
  }, [dayType]);

  // On mount, get or set firstEntryDate
  useEffect(() => {
    const fetchFirstEntryDate = async () => {
      if (!user?.email) {
        setFirstEntryDate(null);
        return;
      }
      const docRef = doc(db, 'nutrition', user.email.toLowerCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().firstEntryDate) {
        setFirstEntryDate(docSnap.data().firstEntryDate);
      } else {
        setFirstEntryDate(null);
      }
    };
    fetchFirstEntryDate();
  }, [user?.email]);

  // Check if already submitted for today
  useEffect(() => {
    const checkSubmitted = async () => {
      if (!user?.email || !firstEntryDate) {
        setAlreadySubmitted(false);
        return;
      }
      const { weekKey, dayKey } = getWeekAndDayKey(firstEntryDate);
      const docRef = doc(db, 'nutrition', user.email.toLowerCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()[weekKey] && docSnap.data()[weekKey][dayKey]) {
        setAlreadySubmitted(true);
      } else {
        setAlreadySubmitted(false);
      }
    };
    if (firstEntryDate) checkSubmitted();
  }, [user?.email, firstEntryDate]);

  const handleChange = (meal, field, value) => {
    setMealData((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value,
      },
    }));
  };

  const calculateTotal = (field) => {
    const meals = defaultMeals[dayType];
    return meals.reduce((sum, meal) => {
      const val = parseFloat(mealData[meal]?.[field] || '0');
      return sum + val;
    }, 0);
  };

  const getTodaysDate = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  const handleSave = async () => {
    if (!user?.email) {
      // Show user friendly error with the app's style
      return;
    }
    if (alreadySubmitted) {
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, 'nutrition', user.email.toLowerCase());
      const docSnap = await getDoc(docRef);

      let data = {};
      let entryDate = firstEntryDate;
      if (docSnap.exists()) {
        data = docSnap.data();
        if (!data.firstEntryDate) {
          const today = getTodaysDate();
          entryDate = today;
          data.firstEntryDate = entryDate;
          setFirstEntryDate(entryDate);
        } else {
          entryDate = data.firstEntryDate;
        }
      } else {
        const today = getTodaysDate();
        entryDate = today;
        data.firstEntryDate = entryDate;
        setFirstEntryDate(entryDate);
      }

      const { weekKey, dayKey } = getWeekAndDayKey(entryDate);

      // Calculate totals for each field
      const totals = {};
      for (const field of mealFields) {
        totals[field] = calculateTotal(field);
      }

      if (!data[weekKey]) data[weekKey] = {};
      data[weekKey][dayKey] = {
        dayType,
        date: getTodaysDate(),
        meals: {},
        totals,
      };

      for (const meal of defaultMeals[dayType]) {
        data[weekKey][dayKey].meals[meal] = {};
        for (const field of mealFields) {
          data[weekKey][dayKey].meals[meal][field] = mealData[meal]?.[field] || '';
        }
      }

      await setDoc(docRef, data, { merge: true });
      setAlreadySubmitted(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
    listener: (event) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      if (navbarRef.current) {
        navbarRef.current.show();
      }

      scrollTimeout.current = setTimeout(() => {
        if (navbarRef.current) {
          navbarRef.current.hide();
        }
      }, 2000);

      lastScrollY.current = currentScrollY;
    },
  });

  const renderDayTypeDropdown = () => (
    <Modal
      transparent={true}
      visible={showDayTypeDropdown}
      onRequestClose={() => setShowDayTypeDropdown(false)}
      animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowDayTypeDropdown(false)}>
        <View style={styles.dropdownContainer}>
          {['training', 'rest', 'cardio'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.dropdownItem, dayType === type && styles.dropdownItemActive]}
              onPress={() => {
                setDayType(type);
                setShowDayTypeDropdown(false);
              }}>
              <Text
                style={[
                  styles.dropdownItemText,
                  dayType === type && styles.dropdownItemTextActive,
                ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              {dayType === type && <Feather name="check" size={18} color="#fff" />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.containerWithWhiteSpace}>
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Blue header section with title and calendar */}
        <View style={styles.blueHeader}>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <WeekCalendar
            weekDates={weekDates}
            onDatePress={handleDateSelect}
            containerStyle={styles.calendarContainerStyle}
          />
        </View>
        {/* White content area */}
        <View style={styles.whiteContent}>
          <TouchableOpacity
            style={styles.cronoButton}
            onPress={() => navigation.navigate('Cronometer')}>
            <Ionicons name="nutrition" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.cronoButtonText}>Import from Cronometer</Text>
            <Feather name="chevron-right" size={18} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dayTypeSelector}
            onPress={() => setShowDayTypeDropdown(true)}>
            <Text style={styles.dayTypeText}>
              {dayType.charAt(0).toUpperCase() + dayType.slice(1)} Day
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.mealsContainer}>
            {defaultMeals[dayType].map((meal) => (
              <View key={meal} style={styles.mealCard}>
                <Text style={styles.mealTitle}>{meal}</Text>
                {mealFields.map((field) => (
                  <View key={field} style={styles.inputRow}>
                    <View style={styles.labelContainer}>
                      <Text style={styles.inputLabel}>{field}</Text>
                      {mealGoals[meal] && (
                        <Text style={styles.inputGoal}>
                          Goal: {mealGoals[meal][field]}{field.includes('Kcal') ? '' : 'g'}
                        </Text>
                      )}
                    </View>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={mealData[meal]?.[field] || ''}
                      onChangeText={(text) => handleChange(meal, field, text)}
                      placeholder="0"
                      placeholderTextColor="#b2bec3"
                    />
                  </View>
                ))}
              </View>
            ))}
            <View style={styles.totalContainer}>
              <Text style={styles.totalTitle}>Daily Totals</Text>
              {mealFields.map((field) => (
                <View key={field} style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{field}:</Text>
                  <Text style={styles.totalValue}>{calculateTotal(field)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.fiberCard}>
              <Text style={styles.fiberTitle}>Daily Fiber Goals</Text>
              <View style={styles.fiberRow}>
                <Text style={styles.fiberLabel}>Daily Goal:</Text>
                <Text style={styles.fiberValue}>38g</Text>
              </View>
              <View style={styles.fiberRow}>
                <Text style={styles.fiberLabel}>Per Meal:</Text>
                <Text style={styles.fiberValue}>8g</Text>
              </View>
            </View>
            {/* Update Save Nutrition button to show confirmation modal */}
            <TouchableOpacity
              style={[styles.saveButton, alreadySubmitted && styles.disabledButton]}
              onPress={() => setShowConfirmSave(true)}
              disabled={alreadySubmitted || loading}>
              <Text style={styles.saveButtonText}>
                {alreadySubmitted ? 'Already Submitted' : loading ? 'Saving...' : 'Save Nutrition'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {renderDayTypeDropdown()}
      <Navbar ref={navbarRef} activeScreen="Nutrition" opacityValue={navOpacity} />
      {/* Confirmation Modal for saving nutrition */}
      <ConfirmationModal
        visible={showConfirmSave}
        message="Are you sure you want to save your nutrition?"
        onCancel={() => setShowConfirmSave(false)}
        onConfirm={() => {
          setShowConfirmSave(false);
          handleSave();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerWithWhiteSpace: {
    flex: 1,
    backgroundColor: '#F7F9FC', // subtle light background
  },
  scrollView: {
    flex: 1,
  },
  blueHeader: {
    backgroundColor: '#081A2F',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  calendarContainerStyle: {
    width: '100%',
    marginTop: 10,
  },
  whiteContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  dayTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E0E6ED',
    padding: 15,
    borderRadius: 16,
    marginHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemActive: {
    backgroundColor: '#C7312B',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  mealsContainer: {
    paddingHorizontal: 10,
  },
  mealCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#C7312B',
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#081A2F',
    marginBottom: 12,
  },
  goalContainer: { 
    marginBottom: 12,
    backgroundColor: '#F0F4F8',
    padding: 8,
    borderRadius: 8,
  },
  goalText: { 
    fontSize: 14,
    color: '#607D8B',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputLabel: {
    flex: 1,
    fontSize: 14,
    color: '#607D8B',
  },
  input: {
    flex: 1,
    backgroundColor: '#E8EEF3',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    color: '#081A2F',
    textAlign: 'center',
    marginLeft: 10,
  },
  totalContainer: {
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#E8EEF3',
    borderRadius: 16,
  },
  totalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#081A2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8, 
  },
  totalLabel: { 
    fontSize: 16, 
    color: '#607D8B',
  },
  totalValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#C7312B',
  },
  fiberCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#00b894',
  },
  fiberTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#081A2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  fiberRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8,
  },
  fiberLabel: { 
    fontSize: 16, 
    color: '#607D8B',
  },
  fiberValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#00b894',
  },
  saveButton: {
    backgroundColor: '#C7312B',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: { 
    backgroundColor: '#999',
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  cronoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C7312B',
    padding: 14,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cronoButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 16, 
    letterSpacing: 0.5,
  },
  inputGoal: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  labelContainer: {
    flex: 1,
  },
});

export default NutritionScreen;
