import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  Image,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import Navbar from '../components/navbar';
import WeekCalendar from '../components/WeekCalendar';
import { getCurrentWeekDates } from '../utils/dateUtils';

const UserImage = require('../assets/User.png');
const metrics = ['Sleep Quality', 'Mood', 'Hunger Level'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper functions remain the same
const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dayNames[date.getDay()];
};

const getTag = (value) => {
  if (value === null) return null;
  if (value <= 2) return 'red';
  if (value === 3) return 'amber';
  if (value >= 4) return 'green';
  return null;
};

const getWeekNumber = (currentDate, firstEntryDate) => {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const firstDate = new Date(firstEntryDate);
  const diffTime = Math.abs(currentDate.getTime() - firstDate.getTime());
  const diffWeeks = Math.floor(diffTime / msPerWeek);
  return diffWeeks + 1;
};

const isSameWeek = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  const firstDay1 = new Date(d1.setDate(d1.getDate() - d1.getDay()));
  const firstDay2 = new Date(d2.setDate(d2.getDate() - d2.getDay()));

  return (
    firstDay1.getFullYear() === firstDay2.getFullYear() &&
    firstDay1.getMonth() === firstDay2.getMonth() &&
    firstDay1.getDate() === firstDay2.getDate()
  );
};

const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
};

const DailyCheckInForm = () => {
  const [day, setDay] = useState('');
  const [formData, setFormData] = useState({});
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showWaistHip, setShowWaistHip] = useState(true);
  const [firstEntryDate, setFirstEntryDate] = useState(null);
  const [userFullName, setUserFullName] = useState('');
  const [yesterdayDate, setYesterdayDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();

  // Get the week dates for the calendar
  const weekDates = getCurrentWeekDates();

  const scrollY = useRef(new Animated.Value(0)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const navbarRef = useRef(null);

  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    console.log('Selected date:', date.full);
    // You could load previous data for this date here
  };

  useEffect(() => {
    const yesterday = getYesterday();
    setDay(yesterday);
    const initialData = {};
    metrics.forEach((metric) => {
      initialData[metric] = null;
    });
    setFormData(initialData);
    setWeight('');

    const yesterdayDate = getYesterdayDate();
    setYesterdayDate(yesterdayDate.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const fetchFirstEntryDate = async () => {
      if (!user?.email) {
        setFirstEntryDate(null);
        return;
      }
      const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data().firstEntryDate) {
        setFirstEntryDate(userDocSnap.data().firstEntryDate);
      } else {
        setFirstEntryDate(null);
      }
    };
    fetchFirstEntryDate();
  }, [user?.email]);

  // Rest of useEffect hooks remain the same
  useEffect(() => {
    const checkAlreadySubmitted = async () => {
      if (!user?.email || !yesterdayDate) {
        setAlreadySubmitted(false);
        setShowWaistHip(true);
        return;
      }

      const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
      const userDocSnap = await getDoc(userDocRef);

      let foundWaistHip = false;
      let entryExistsForYesterday = false;

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const yesterday = getYesterdayDate();

        if (data.firstEntryDate) {
          const weekKeys = Object.keys(data).filter((k) => k.startsWith('week'));

          const currentWeekNum = getWeekNumber(yesterday, data.firstEntryDate);
          const currentWeekKey = `week${currentWeekNum}`;

          if (data[currentWeekKey] && data[currentWeekKey].waist && data[currentWeekKey].hip) {
            foundWaistHip = true;
          }

          for (const weekKey of weekKeys) {
            const weekData = data[weekKey];
            if (!weekData || typeof weekData !== 'object') continue;

            for (const dayKey of dayNames) {
              if (weekData[dayKey] && weekData[dayKey].timestamp) {
                const entryDate = weekData[dayKey].timestamp.slice(0, 10);
                if (entryDate === yesterdayDate) {
                  entryExistsForYesterday = true;
                  break;
                }
              }
            }

            if (entryExistsForYesterday) break;
          }
        }
      }

      setShowWaistHip(!foundWaistHip);
      setAlreadySubmitted(entryExistsForYesterday);
    };

    checkAlreadySubmitted();
  }, [user?.email, day, yesterdayDate]);

  // Fetch user name
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) return;
      try {
        const intakeFormRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const intakeFormSnap = await getDoc(intakeFormRef);
        
        if (intakeFormSnap.exists()) {
          setUserFullName(intakeFormSnap.data().fullName);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user?.email]);

  // Handle scrolling
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
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
    }
  );

  const handleSelect = (metric, value) => {
    setFormData((prev) => ({
      ...prev,
      [metric]: value,
    }));
  };

  const calculateWeekForDate = (dateString, firstEntryDateString) => {
    const date = new Date(dateString);
    const firstDate = new Date(firstEntryDateString);

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffTime = Math.abs(date.getTime() - firstDate.getTime());
    const weeksSinceStart = Math.floor(diffTime / msPerWeek) + 1;

    return weeksSinceStart;
  };

  // Firebase save logic remains mostly the same
  const saveWeeklyForm = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    if (!weight) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }

    // Validate required metrics
    for (const metric of metrics) {
      if (formData[metric] == null) {
        Alert.alert('Error', `Please select a value for "${metric}"`);
        return;
      }
    }

    const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
    const userDocSnap = await getDoc(userDocRef);

    const yesterday = getYesterdayDate();
    const yesterdayIsoString = yesterday.toISOString().slice(0, 10);
    let data = {};
    let entryDate = firstEntryDate;

    try {
      if (userDocSnap.exists()) {
        data = userDocSnap.data();

        // If this is the first entry ever, set the firstEntryDate
        if (!data.firstEntryDate) {
          entryDate = yesterdayIsoString;
          data.firstEntryDate = entryDate;
          setFirstEntryDate(entryDate);
        } else {
          entryDate = data.firstEntryDate;
        }

        // Calculate which week this entry belongs to
        const weekNum = getWeekNumber(yesterday, entryDate);
        const weekKey = `week${weekNum}`;

        // Check if an entry already exists for yesterday's date
        let entryExistsForYesterday = false;
        const weekKeys = Object.keys(data).filter((k) => k.startsWith('week'));

        for (const wKey of weekKeys) {
          const weekData = data[wKey];
          if (!weekData || typeof weekData !== 'object') continue;

          for (const dayKey of dayNames) {
            if (weekData[dayKey] && weekData[dayKey].timestamp) {
              const existingEntryDate = new Date(weekData[dayKey].timestamp)
                .toISOString()
                .slice(0, 10);
              if (existingEntryDate === yesterdayIsoString) {
                entryExistsForYesterday = true;
                Alert.alert(
                  'Already Submitted',
                  'You have already submitted an entry for yesterday.'
                );
                return;
              }
            }
          }
        }

        // Prepare the object to save: value + color tag for each metric
        const metricsWithTags = {};
        Object.keys(formData).forEach((metric) => {
          metricsWithTags[metric] = {
            value: formData[metric],
            color: getTag(formData[metric]),
          };
        });

        // Build the update object
        let update = {
          ...data,
          [weekKey]: {
            ...(data[weekKey] || {}),
            [day]: {
              ...metricsWithTags,
              weight,
              email: user.email,
              timestamp: yesterday.toISOString(), // Use yesterday's timestamp
            },
          },
          firstEntryDate: entryDate,
        };

        // Only add waist/hip at the week level if user is allowed to submit them
        if (showWaistHip && waist && hip) {
          update[weekKey].waist = waist;
          update[weekKey].hip = hip;
        }

        await setDoc(userDocRef, update, { merge: true });
        Alert.alert('Success', `Check-in for ${day} saved in ${weekKey}!`);
        setAlreadySubmitted(true);
      } else {
        // First ever entry for this user
        entryDate = yesterdayIsoString;

        // Prepare the object to save: value + color tag for each metric
        const metricsWithTags = {};
        Object.keys(formData).forEach((metric) => {
          metricsWithTags[metric] = {
            value: formData[metric],
            color: getTag(formData[metric]),
          };
        });

        let newData = {
          firstEntryDate: entryDate,
          week1: {
            [day]: {
              ...metricsWithTags,
              weight,
              email: user.email,
              timestamp: yesterday.toISOString(), // Use yesterday's timestamp
            },
          },
        };

        // Add waist/hip at the week level for new users
        if (waist && hip) {
          newData.week1.waist = waist;
          newData.week1.hip = hip;
        }

        await setDoc(userDocRef, newData);
        setFirstEntryDate(entryDate);
        Alert.alert('Success', `First check-in saved for ${day}!`);
        setAlreadySubmitted(true);
      }
    } catch (error) {
      console.error('Error saving weekly form:', error);
      Alert.alert('Error', 'Failed to save your check-in. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      await saveWeeklyForm();
    } catch (e) {
      alert('Error saving check-in');
      console.error(e);
    }
  };

  // Updated rendering functions for consistent UI

  const renderHeader = () => (
    <View style={styles.blueHeader}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#081A2F"
        translucent
      />
      <Text style={styles.headerTitle}>Daily Check-In</Text>
      
      <WeekCalendar 
        weekDates={weekDates}
        onDatePress={handleDateSelect}
        containerStyle={styles.calendarContainerStyle}
      />
    </View>
  );

  const renderWeightSection = () => (
    <View style={[styles.cardContainer, isDarkMode && styles.cardDark]}>
      <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>Weight</Text>
      <TextInput
        style={[styles.weightInput, isDarkMode && styles.inputDark]}
        placeholder="Enter your weight"
        placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        editable={!alreadySubmitted}
      />
    </View>
  );

  const renderMeasurementsSection = () => (
    showWaistHip && (
      <View style={styles.measurementsContainer}>
        <View style={[styles.measurementCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>Waist</Text>
          <TextInput
            style={[styles.measurementInput, isDarkMode && styles.inputDark]}
            placeholder="cm"
            placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
            value={waist}
            onChangeText={setWaist}
            keyboardType="numeric"
            editable={!alreadySubmitted}
          />
        </View>
        <View style={[styles.measurementCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>Hip</Text>
          <TextInput
            style={[styles.measurementInput, isDarkMode && styles.inputDark]}
            placeholder="cm"
            placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
            value={hip}
            onChangeText={setHip}
            keyboardType="numeric"
            editable={!alreadySubmitted}
          />
        </View>
      </View>
    )
  );

  const renderMetricCard = (metric) => {
    const currentValue = formData[metric] || 1;

    const renderSlider = (metric) => {
      return (
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={currentValue}
            onValueChange={(value) => !alreadySubmitted && handleSelect(metric, Math.round(value))}
            minimumTrackTintColor="#C7312B"
            maximumTrackTintColor="#e5e7eb"
            thumbStyle={styles.sliderThumbStyle}
            trackStyle={styles.sliderTrackStyle}
            disabled={alreadySubmitted}
          />
        </View>
      );
    };

    return (
      <View key={metric} style={[styles.cardContainer, isDarkMode && styles.cardDark]}>
        <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>{metric}</Text>

        {renderSlider(metric)}

        {metric === 'Sleep Quality' && (
          <View style={styles.sliderEmojiLabels}>
            <Text style={styles.sliderLabel}>😴</Text>
            <Text style={styles.sliderLabel}>😐</Text>
            <Text style={styles.sliderLabel}>😊</Text>
          </View>
        )}

        {metric === 'Mood' && (
          <View style={styles.sliderEmojiLabels}>
            <Text style={styles.sliderLabel}>😡</Text>
            <Text style={styles.sliderLabel}>😔</Text>
            <Text style={styles.sliderLabel}>😐</Text>
            <Text style={styles.sliderLabel}>😊</Text>
            <Text style={styles.sliderLabel}>😍</Text>
          </View>
        )}

        {metric === 'Hunger Level' && (
          <View style={styles.hungerLabels}>
            <Text style={[styles.hungerLabel, isDarkMode && styles.textDark]}>Starving</Text>
            <Text style={[styles.hungerLabel, isDarkMode && styles.textDark]}>Satisfied</Text>
            <Text style={[styles.hungerLabel, isDarkMode && styles.textDark]}>Stuffed</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderHeader()}
        
        <View style={styles.whiteContent}>
          {renderWeightSection()}
          {renderMeasurementsSection()}
          {metrics.map((metric) => renderMetricCard(metric))}
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              alreadySubmitted && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={alreadySubmitted}
          >
            <Text style={styles.submitButtonText}>
              {alreadySubmitted ? 'Submitted' : 'Submit Check-in'}
            </Text>
          </TouchableOpacity>
          
          {/* Add extra padding at bottom for navbar */}
          <View style={{ height: 70 }} />
        </View>
      </ScrollView>
      
      <Navbar 
        ref={navbarRef}
        activeScreen="WeeklyForm" 
        opacityValue={navOpacity} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  blueHeader: {
    backgroundColor: '#081A2F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 40, // Increased padding to compensate for removed content
    paddingHorizontal: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20, // Increased margin to create better spacing
    marginTop: 10,
  },
  calendarContainerStyle: {
    width: '100%',
    marginTop: 1,
    marginBottom: 5, // Reduced bottom margin since no user info below
  },
  whiteContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1f2937',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  textDark: {
    color: '#fff',
  },
  weightInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  inputDark: {
    backgroundColor: '#374151',
    color: '#fff',
  },
  measurementsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 8,
  },
  measurementCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  measurementInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  sliderContainer: {
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumbStyle: {
    backgroundColor: '#C7312B',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sliderTrackStyle: {
    height: 6,
    borderRadius: 3,
  },
  sliderEmojiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  sliderLabel: {
    fontSize: 18,
    textAlign: 'center',
  },
  hungerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  hungerLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#C7312B',
    marginVertical: 24,
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    width: '70%',
    alignSelf: 'center',
    shadowColor: '#000',
    height: 48,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DailyCheckInForm;