import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
// Firestore imports
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
  const [firstEntryDate, setFirstEntryDate] = useState<string | null>(null);
  const [yesterdayDate, setYesterdayDate] = useState(''); // Change to yesterdayDate
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();

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

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>
          Daily Check-in: {day}
        </Text>
        <View style={styles.headerButton} /> {/* Empty view for spacing */}
      </View>

      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.label, isDarkMode && styles.textDark]}>Weight</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          placeholder="Enter your weight"
          placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          editable={!alreadySubmitted}
        />
        {/* Only show waist/hip if not already filled this week */}
        {showWaistHip && (
          <>
            <Text style={[styles.label, isDarkMode && styles.textDark]}>
              Waist Circumference (cm)
            </Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Enter your waist circumference"
              placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
              value={waist}
              onChangeText={setWaist}
              keyboardType="numeric"
              editable={!alreadySubmitted}
            />
            <Text style={[styles.label, isDarkMode && styles.textDark]}>
              Hip Circumference (cm)
            </Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Enter your hip circumference"
              placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
              value={hip}
              onChangeText={setHip}
              keyboardType="numeric"
              editable={!alreadySubmitted}
            />
          </>
        )}
        {metrics.map((metric) => (
          <View key={metric} style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.textDark]}>{metric}</Text>
            <View style={styles.checkboxRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.checkbox,
                    formData[metric] === num && styles.checkboxSelected,
                    isDarkMode && styles.checkboxDark,
                    isDarkMode && formData[metric] === num && styles.checkboxSelectedDark,
                  ]}
                  onPress={() => !alreadySubmitted && handleSelect(metric, num)}
                  disabled={alreadySubmitted}>
                  <Text
                    style={[
                      styles.checkboxText,
                      formData[metric] === num && styles.checkboxTextSelected,
                      isDarkMode && styles.textDark,
                      isDarkMode && formData[metric] === num && styles.checkboxTextSelectedDark,
                    ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <Button
          title={alreadySubmitted ? 'Already Submitted for Yesterday' : 'Submit Check-in'}
          onPress={handleSubmit}
          disabled={alreadySubmitted}
        />
        {alreadySubmitted && (
          <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>
            You have already submitted an entry for yesterday ({day}).
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  headerDark: {
    borderBottomColor: '#374151',
    backgroundColor: '#111827',
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#000000',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#22223b',
    borderColor: '#444',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  textDark: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  checkbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: '#f3f4f6',
  },
  checkboxDark: {
    backgroundColor: '#22223b',
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
});

export default DailyCheckInForm;
