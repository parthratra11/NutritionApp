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
      if (!user?.email) {
        setAlreadySubmitted(false);
        setShowWaistHip(true);
        return;
      }
      const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
      const userDocSnap = await getDoc(userDocRef);

      let foundWaist = false;
      let foundHip = false;

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const weekKeys = Object.keys(data).filter((k) => k.startsWith('week'));
        let currentWeekKey = '';
        let maxWeekNum = 1;
        if (weekKeys.length > 0) {
          maxWeekNum = Math.max(...weekKeys.map((k) => parseInt(k.replace('week', ''))));
          currentWeekKey = `week${maxWeekNum}`;
        }
        // Check if waist/hip already exist for this week AT THE WEEK LEVEL
        if (data[currentWeekKey]) {
          if (data[currentWeekKey].waist && data[currentWeekKey].hip) {
            foundWaist = true;
            foundHip = true;
          }
        }
        // Check if already submitted for this day
        for (const weekKey of weekKeys) {
          if (data[weekKey] && data[weekKey][day]) {
            setAlreadySubmitted(true);
            break;
          }
        }
      }
      setShowWaistHip(!(foundWaist && foundHip));
    };

    checkAlreadySubmitted();
  }, [user?.email, day]);

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

  const shouldStartNewWeek = (currentWeekData: any, currentDay: string) => {
    // If it's Monday, always start a new week
    if (currentDay === 'Monday') return true;

    // If current week has Sunday logged, start a new week
    return currentWeekData && currentWeekData['Sunday'];
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

    let weekNum = 1;
    let weekKey = 'week1';
    let data: { [key: string]: any } = {};
    let entryDate = firstEntryDate;

    if (userDocSnap.exists()) {
      data = userDocSnap.data();
      if (!data.firstEntryDate) {
        const today = new Date();
        entryDate = today.toISOString().slice(0, 10);
        data.firstEntryDate = entryDate;
        setFirstEntryDate(entryDate);
      } else {
        entryDate = data.firstEntryDate;
      }

      // Find the latest week number
      const weekKeys = Object.keys(data).filter((k) => k.startsWith('week'));
      if (weekKeys.length > 0) {
        weekNum = Math.max(...weekKeys.map((k) => parseInt(k.replace('week', ''))));
        weekKey = `week${weekNum}`;

        // Check if we should start a new week
        if (shouldStartNewWeek(data[weekKey], day)) {
          weekNum += 1;
          weekKey = `week${weekNum}`;
        }
      }

      // Prevent duplicate submission for the same day
      if (data[weekKey] && data[weekKey][day]) {
        Alert.alert('Already Submitted', `You have already submitted for ${day}.`);
        setAlreadySubmitted(true);
        return;
      }
    } else {
      // First ever entry for this user
      const today = new Date();
      entryDate = today.toISOString().slice(0, 10);
      data.firstEntryDate = entryDate;
      setFirstEntryDate(entryDate);
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
          timestamp: new Date().toISOString(),
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
        <Pressable onPress={() => navigation.navigate('Chat')} style={styles.navItem}>
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

        <Pressable
          style={[styles.submitButton, alreadySubmitted && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={alreadySubmitted}
        >
          <Text style={styles.submitButtonText}>
            {alreadySubmitted ? 'Already Submitted' : 'Submit Check-in'}
          </Text>
        </Pressable>
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
  submittedText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
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
