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
  Pressable,
  Platform,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

// Import assets
const UserImage = require('../assets/User.png');
const GreetRectangle = require('../assets/GreetRectangle.png');
const HomeIcon = require('../assets/home.png');
const ChatIcon = require('../assets/chat.png');
const AddIcon = require('../assets/add.png');
const WorkoutIcon = require('../assets/workout.png');
const NavRectangle = require('../assets/NavRectangle.png');

const metrics = ['Sleep Quality', 'Mood', 'Hunger Level'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Add near other state declarations at the top
const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dayNames[date.getDay()];
};

// Helper to get color tag for a value
const getTag = (value) => {
  if (value === null) return null;
  if (value <= 2) return 'red';
  if (value === 3) return 'amber';
  if (value >= 4) return 'green';
  return null;
};

// Helper to calculate week number from a date and first entry date
const getWeekNumber = (currentDate, firstEntryDate) => {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const firstDate = new Date(firstEntryDate);
  const diffTime = Math.abs(currentDate.getTime() - firstDate.getTime());
  const diffWeeks = Math.floor(diffTime / msPerWeek);
  return diffWeeks + 1; // Week numbers are 1-based
};

// Helper to check if a date is from the current week
const isSameWeek = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Get first day of week (Sunday) for each date
  const firstDay1 = new Date(d1.setDate(d1.getDate() - d1.getDay()));
  const firstDay2 = new Date(d2.setDate(d2.getDate() - d2.getDay()));

  // Compare year and week number
  return (
    firstDay1.getFullYear() === firstDay2.getFullYear() &&
    firstDay1.getMonth() === firstDay2.getMonth() &&
    firstDay1.getDate() === firstDay2.getDate()
  );
};

// Add this helper function near the other helper functions
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
  const [yesterdayDate, setYesterdayDate] = useState(''); // Move this line here
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();

  const scrollY = useRef(new Animated.Value(0)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    const yesterday = getYesterday();
    setDay(yesterday);
    const initialData = {};
    metrics.forEach((metric) => {
      initialData[metric] = null;
    });
    setFormData(initialData);
    setWeight('');

    // Set yesterday's date in ISO format
    const yesterdayDate = getYesterdayDate();
    setYesterdayDate(yesterdayDate.toISOString().slice(0, 10));
  }, []);

  // Fetch or set firstEntryDate
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

  // Check if already submitted for yesterday when email changes
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

        // Check if any week has an entry for yesterday's day of the week
        if (data.firstEntryDate) {
          const weekKeys = Object.keys(data).filter((k) => k.startsWith('week'));

          // Calculate current week number based on first entry date
          const currentWeekNum = getWeekNumber(yesterday, data.firstEntryDate);
          const currentWeekKey = `week${currentWeekNum}`;

          // Check waist/hip for current week
          if (data[currentWeekKey] && data[currentWeekKey].waist && data[currentWeekKey].hip) {
            foundWaistHip = true;
          }

          // Look through each week's entries
          for (const weekKey of weekKeys) {
            const weekData = data[weekKey];
            // Skip non-week fields
            if (!weekData || typeof weekData !== 'object') continue;

            // Check each day in this week
            for (const dayKey of dayNames) {
              if (weekData[dayKey] && weekData[dayKey].timestamp) {
                const entryDate = weekData[dayKey].timestamp.slice(0, 10);

                // Check if there's an entry with yesterday's date
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

  // Fetch user full name
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

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        
        // Clear existing timeout
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }

        // Show navbar when scrolling
        Animated.timing(navOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // Hide navbar after 2 seconds of no scrolling
        scrollTimeout.current = setTimeout(() => {
          Animated.timing(navOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
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

  // Determine the week number for a specific date
  const calculateWeekForDate = (dateString, firstEntryDateString) => {
    const date = new Date(dateString);
    const firstDate = new Date(firstEntryDateString);

    // Calculate weeks since first entry
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffTime = Math.abs(date.getTime() - firstDate.getTime());
    const weeksSinceStart = Math.floor(diffTime / msPerWeek) + 1;

    return weeksSinceStart;
  };

  // Firestore save logic
  const saveWeeklyForm = async () => {
    if (!user?.email) {
      alert('Please login first');
      return;
    }

    if (!weight) {
      alert('Please enter your weight');
      return;
    }

    // Validate required metrics
    for (const metric of metrics) {
      if (formData[metric] == null) {
        alert(`Please select a value for "${metric}"`);
        return;
      }
    }

    const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
    const userDocSnap = await getDoc(userDocRef);

    const yesterday = getYesterdayDate();
    const yesterdayIsoString = yesterday.toISOString().slice(0, 10);
    let data: { [key: string]: any } = {};
    let entryDate = firstEntryDate;

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
      const weekNum = calculateWeekForDate(yesterdayIsoString, entryDate);
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
      const metricsWithTags: { [key: string]: { value: any; color: string | null } } = {};
      Object.keys(formData).forEach((metric) => {
        metricsWithTags[metric] = {
          value: formData[metric],
          color: getTag(formData[metric]),
        };
      });

      // Build the update object
      let update: any = {
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
      const metricsWithTags: { [key: string]: { value: any; color: string | null } } = {};
      Object.keys(formData).forEach((metric) => {
        metricsWithTags[metric] = {
          value: formData[metric],
          color: getTag(formData[metric]),
        };
      });

      let newData: any = {
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
  };

  const handleSubmit = async () => {
    try {
      await saveWeeklyForm();
    } catch (e) {
      alert('Error saving check-in');
      console.error(e);
    }
  };

 const renderGreeting = () => (
  <View style={styles.bannerContainer}>
    <Image source={GreetRectangle} style={styles.bannerBg} />
    <View style={styles.bannerContent}>
      <View>
        <Text style={styles.bannerSubTitle}>Keeping Moving Today!</Text>
        <Text style={styles.bannerTitle}>
          Hi, <Text style={{ fontWeight: 'bold' }}>{userFullName || 'User'}</Text>!
        </Text>
      </View>
      <Image source={UserImage} style={styles.bannerUserImage} />
    </View>
  </View>
);

  const renderWeightSection = () => (
    <View style={styles.cardContainer}>
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
          <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>Waist Circumference</Text>
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
          <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>Hip Circumference</Text>
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
            minimumTrackTintColor="#6366f1"
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

  const renderBottomNav = () => (
    <Animated.View style={[styles.bottomNavContainer, { opacity: navOpacity }]}>
      <Image source={NavRectangle} style={styles.bottomNavBg} />
      <View style={styles.bottomNavContent}>
        <Pressable onPress={() => navigation.navigate('Home')} style={styles.navItem}>
          <Image source={HomeIcon} style={styles.bottomNavIcon} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Add')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={AddIcon} style={styles.bottomNavIcon} />
            <View style={styles.activeEclipse} />
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Slack')} style={styles.navItem}>
          <Image source={ChatIcon} style={styles.bottomNavIcon} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Workout')} style={styles.navItem}>
          <Image source={WorkoutIcon} style={styles.bottomNavIcon} />
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderGreeting()}
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
            {alreadySubmitted ? 'Already Submitted for Yesterday' : 'Submit Check-in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {renderBottomNav()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  bannerContainer: {
    height: 280,
    marginBottom: -80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bannerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    top: 0,
    left: 0,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 50,
    height: '100%',
  },
  bannerSubTitle: {
    color: 'black',
    fontSize: 13,
    marginBottom: 2,
    opacity: 0.85,
  },
  bannerTitle: {
    color: 'black',
    fontSize: 26,
    fontWeight: '400',
    marginBottom: 10,
  },
  bannerUserImage: {
    width: 73,
    height: 75,
    borderRadius: 50,
    borderWidth: 0,
    borderColor: '#fff',
    backgroundColor: '#eee',
    marginBottom:55
  },
  cardContainer: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
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
    backgroundColor: '#e5e7eb',
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
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  measurementCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
  },
  measurementInput: {
    backgroundColor: '#e5e7eb',
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
    backgroundColor: '#6366f1',
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
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  checkbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  checkboxDark: {
    backgroundColor: '#374151',
    borderColor: '#444',
  },
  checkboxSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  checkboxSelectedDark: {
    borderColor: '#a5b4fc',
    backgroundColor: '#6366f1',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  checkboxTextSelected: {
    color: '#fff',
  },
  checkboxTextSelectedDark: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNavContainer: {
    height: 45,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNavBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 24,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeEclipse: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#BABABA',
    opacity: 0.6,
    top: -3.5,
    left: -3.5,
  },
  bottomNavIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    zIndex: 2,
  },
});

export default DailyCheckInForm;
