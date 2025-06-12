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

const DailyCheckInForm = () => {
  const [day, setDay] = useState('');
  const [formData, setFormData] = useState({});
  const [weight, setWeight] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
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
  }, []);

  // Check if already submitted for yesterday when email changes
  useEffect(() => {
    const checkAlreadySubmitted = async () => {
      if (!user?.email) {
        setAlreadySubmitted(false);
        return;
      }
      const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const weekKeys = Object.keys(data).filter((k) => k.startsWith('week'));
        for (const weekKey of weekKeys) {
          if (data[weekKey] && data[weekKey][day]) {
            setAlreadySubmitted(true);
            return;
          }
        }
      }
      setAlreadySubmitted(false);
    };

    checkAlreadySubmitted();
  }, [user?.email, day]);

  const handleSelect = (metric, value) => {
    setFormData((prev) => ({
      ...prev,
      [metric]: value,
    }));
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

    const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
    const userDocSnap = await getDoc(userDocRef);

    let weekNum = 1;
    let weekKey = 'week1';
    let data = {};

    if (userDocSnap.exists()) {
      data = userDocSnap.data();
      // Find the latest week number
      const weekKeys = Object.keys(data).filter((k) => k.startsWith('week'));
      if (weekKeys.length > 0) {
        weekNum = Math.max(...weekKeys.map((k) => parseInt(k.replace('week', ''))));
        weekKey = `week${weekNum}`;
        // If this week already has 7 days, start a new week
        if (
          Object.keys(data[weekKey] || {}).length >= 7 &&
          !(data[weekKey] && data[weekKey][day])
        ) {
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
    }

    // Prepare the object to save: value + color tag for each metric
    const metricsWithTags = {};
    Object.keys(formData).forEach((metric) => {
      metricsWithTags[metric] = {
        value: formData[metric],
        color: getTag(formData[metric]),
      };
    });

    const update = {
      [weekKey]: {
        ...(data[weekKey] || {}),
        [day]: {
          ...metricsWithTags,
          weight,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    };

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
          title={alreadySubmitted ? 'Already Submitted' : 'Submit Check-in'}
          onPress={handleSubmit}
          disabled={alreadySubmitted}
        />
        {alreadySubmitted && (
          <Text style={{ color: 'red', marginTop: 10 }}>You have already submitted for {day}.</Text>
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
