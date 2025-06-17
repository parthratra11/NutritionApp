import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
  Modal,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type Set = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

type BodyPart = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

type ExerciseOption = {
  id: string;
  name: string;
  bodyPart: BodyPart;
  description: string;
  muscleGroups: string[];
  instructions: string[];
};

type ExerciseDetails = {
  name: string;
  description: string;
  muscleGroups: string[];
  instructions: string[];
};

type ExpandedSections = {
  [key: string]: boolean;
};

type Exercise = {
  id: string;
  name: string;
  sets: Set[];
  previousWeight?: string;
  previousReps?: string;
};
const EXERCISES_DB: ExerciseOption[] = [
  // Chest exercises
  {
    id: '1',
    name: 'Barbell Bench Press',
    bodyPart: 'Chest',
    description: 'A compound exercise that primarily targets the chest muscles.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    instructions: ['...'],
  },
  {
    id: '2',
    name: 'Dumbbell Flyes',
    bodyPart: 'Chest',
    description: 'An isolation exercise for chest development.',
    muscleGroups: ['Chest'],
    instructions: ['...'],
  },
  // Back exercises
  {
    id: '3',
    name: 'Barbell Row',
    bodyPart: 'Back',
    description: 'A compound pulling exercise for back development.',
    muscleGroups: ['Back', 'Biceps'],
    instructions: ['...'],
  },
  // Legs exercises
  {
    id: '4',
    name: 'Squat (Barbell)',
    bodyPart: 'Legs',
    description: 'A compound exercise for lower body.',
    muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes'],
    instructions: ['...'],
  },
  // Miscellaneous
  {
    id: '5',
    name: 'Plank',
    bodyPart: 'Miscellaneous',
    description: 'Core stabilization exercise.',
    muscleGroups: ['Core', 'Shoulders'],
    instructions: ['...'],
  },
];

const getSessionForDay = (dayIndex: number): string | null => {
  // Training split: A-B-C-rest-A-B-rest (starting Monday)
  const schedule = ['A', 'B', 'C', 'rest', 'A', 'B', 'rest'];
  return schedule[dayIndex];
};

// Modify the getCurrentSession function
const getCurrentSession = async (userEmail: string): Promise<string | null> => {
  const docRef = doc(db, 'Workout', userEmail.toLowerCase());
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return 'A'; // Start with Session A if no previous workouts
  }

  const data = docSnap.data();
  let lastCompletedSession = 'rest';

  // Find the last completed session
  const weekKeys = Object.keys(data)
    .filter((key) => key.startsWith('week'))
    .sort();
  if (weekKeys.length > 0) {
    const lastWeek = data[weekKeys[weekKeys.length - 1]];
    const dayKeys = Object.keys(lastWeek).filter((key) => key !== 'firstEntryDate');
    if (dayKeys.length > 0) {
      const lastDay = lastWeek[dayKeys[dayKeys.length - 1]];
      // Get session from the workout name or data
      const sessionMatch = lastDay.workoutName.match(/Session ([ABC])/i);
      if (sessionMatch) {
        lastCompletedSession = sessionMatch[1];
      }
    }
  }

  // Determine next session based on the training split
  const sessionOrder = ['A', 'B', 'C', 'rest', 'A', 'B', 'rest'];
  const lastIndex = sessionOrder.indexOf(lastCompletedSession);
  const nextIndex = (lastIndex + 1) % sessionOrder.length;
  return sessionOrder[nextIndex];
};

// Add this function at the top level
const autoSubmitRestDay = async (
  userEmail: string,
  session: string,
  firstEntryDate: string | null
) => {
  if (session !== 'rest' || !firstEntryDate) return;

  const docRef = doc(db, 'Workout', userEmail.toLowerCase());
  const docSnap = await getDoc(docRef);

  let data = docSnap.exists() ? docSnap.data() : {};
  const { weekKey, dayKey } = getWeekAndDayKey(firstEntryDate);

  // Check if already submitted
  if (data[weekKey]?.[dayKey]) return;

  // Create rest day entry
  data[weekKey] = data[weekKey] || {};
  data[weekKey][dayKey] = {
    workoutName: 'Rest Day',
    workoutNote: 'Automatically logged rest day',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    exercises: [],
    isRestDay: true,
    timestamp: new Date().toISOString(),
  };

  // Update database
  await setDoc(docRef, data, { merge: true });
};

export default function WorkoutScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date>(new Date());
  const [workoutEndTime, setWorkoutEndTime] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetails | null>(null);
  const [workoutNote, setWorkoutNote] = useState('');
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    Chest: false,
    Back: false,
    Legs: false,
    Shoulders: false,
    Arms: false,
    Core: false,
    Miscellaneous: false,
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const [workoutName, setWorkoutName] = useState(`Workout - ${today}`);
  const [firstEntryDate, setFirstEntryDate] = useState<string | null>(null);
  const { user } = useAuth(); // Make sure you have user context

  // Fetch or set firstEntryDate on mount
  useEffect(() => {
    const fetchFirstEntryDate = async () => {
      if (!user?.email) {
        setFirstEntryDate(null);
        return;
      }
      const docRef = doc(db, 'Workout', user.email.toLowerCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().firstEntryDate) {
        setFirstEntryDate(docSnap.data().firstEntryDate);
      } else {
        setFirstEntryDate(null);
      }
    };
    fetchFirstEntryDate();
  }, [user?.email]);

  // Check if workout was already submitted today
  useEffect(() => {
    const checkTodaySubmission = async () => {
      if (!user?.email || !firstEntryDate) return;

      const { weekKey, dayKey } = getWeekAndDayKey(firstEntryDate);
      const docRef = doc(db, 'Workout', user.email.toLowerCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data[weekKey]?.[dayKey]) {
          setAlreadySubmitted(true);
        }
      }
    };

    checkTodaySubmission();
  }, [user?.email, firstEntryDate]);

  // Helper to get week and day key based on firstEntryDate (like in NutritionScreen)
  function getDaysBetween(date1: Date, date2: Date) {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function getWeekAndDayKey(firstEntryDate: string) {
    const today = new Date();
    const start = new Date(firstEntryDate);
    const daysSinceFirst = getDaysBetween(start, today);
    const weekNum = Math.floor(daysSinceFirst / 7) + 1;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[today.getDay()];
    return { weekKey: `week${weekNum}`, dayKey: dayName };
  }

  const handleExercisePress = (exercise: Exercise) => {
    // This is mock data - you should replace with actual exercise details
    setSelectedExercise({
      name: exercise.name,
      description: 'This is a compound exercise that targets multiple muscle groups.',
      muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'],
      instructions: [
        'Stand with feet shoulder-width apart',
        'Keep your back straight',
        'Bend knees and lower your body',
        'Return to starting position',
      ],
    });
    setModalVisible(true);
  };

  // Add to existing JSX, right after the workoutName TextInput
  const timePickerSection = (
    <View style={styles.timeSection}>
      <Pressable
        style={[styles.timeButton, isDarkMode && styles.timeButtonDark]}
        onPress={() => setShowStartPicker(true)}>
        <Text style={[styles.timeButtonText, isDarkMode && styles.textDark]}>
          Start: {workoutStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.timeButton, isDarkMode && styles.timeButtonDark]}
        onPress={() => setShowEndPicker(true)}>
        <Text style={[styles.timeButtonText, isDarkMode && styles.textDark]}>
          End:{' '}
          {workoutEndTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ||
            '--:--'}
        </Text>
      </Pressable>
      {showStartPicker && (
        <DateTimePicker
          value={workoutStartTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setWorkoutStartTime(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={workoutEndTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setWorkoutEndTime(selectedDate);
          }}
        />
      )}
    </View>
  );

  // Add exercise details modal
  const exerciseModal = (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
          <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </Pressable>

          {selectedExercise && (
            <ScrollView>
              <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>
                {selectedExercise.name}
              </Text>

              <Image
                source={require('../assets/placeholder/gym.jpeg')}
                style={styles.exerciseImage}
                resizeMode="cover"
              />

              <Text style={[styles.modalSubtitle, isDarkMode && styles.textDark]}>Description</Text>
              <Text style={[styles.modalText, isDarkMode && styles.textDark]}>
                {selectedExercise.description}
              </Text>

              <Text style={[styles.modalSubtitle, isDarkMode && styles.textDark]}>
                Muscle Groups
              </Text>
              {selectedExercise.muscleGroups.map((muscle, index) => (
                <Text key={index} style={[styles.modalText, isDarkMode && styles.textDark]}>
                  • {muscle}
                </Text>
              ))}

              <Text style={[styles.modalSubtitle, isDarkMode && styles.textDark]}>
                Instructions
              </Text>
              {selectedExercise.instructions.map((instruction, index) => (
                <Text key={index} style={[styles.modalText, isDarkMode && styles.textDark]}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Update the addSet function to not copy previous set's values
  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: Date.now().toString(),
                weight: '', // Empty string instead of copying previous set's weight
                reps: '', // Empty string instead of copying previous set's reps
                completed: false,
              },
            ],
          };
        }
        return exercise;
      })
    );
  };

  const addExercise = (exercise: ExerciseOption) => {
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: exercise.name,
        sets: [
          {
            id: Date.now().toString(),
            weight: '',
            reps: '',
            completed: false,
          },
        ],
      },
    ]);
    setShowExerciseModal(false);
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId ? { ...set, completed: !set.completed } : set
            ),
          };
        }
        return exercise;
      })
    );
  };

  // Modify your useEffect that fetches exercises
  useEffect(() => {
    const fetchExercises = async () => {
      if (!user?.email) return;

      const session = await getCurrentSession(user.email);
      setCurrentSession(session);

      // Auto-submit rest day
      if (session === 'rest') {
        setAvailableExercises([]);
        await autoSubmitRestDay(user.email, session, firstEntryDate);
        setAlreadySubmitted(true);
        return;
      }

      const exercisesRef = doc(db, 'ExerciseTemplates', `Training-3x`);
      const docSnap = await getDoc(exercisesRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const sessionExercises = data[`Session ${session}`] || {};
        const exerciseNames = Object.keys(sessionExercises).filter(
          (key) => sessionExercises[key] !== null && sessionExercises[key] !== undefined
        );

        // Create initial exercises array with one empty set each
        const initialExercises = exerciseNames.map((name) => ({
          id: Date.now().toString() + Math.random(),
          name: name,
          sets: [
            {
              id: Date.now().toString() + Math.random(),
              weight: '',
              reps: '',
              completed: false,
            },
          ],
        }));

        setExercises(initialExercises);
        setAvailableExercises(exerciseNames);
      }
    };

    fetchExercises();
  }, [user?.email, firstEntryDate]);

  // Modify your exercise selection modal content
  const exerciseSelectionModal = (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showExerciseModal}
      onRequestClose={() => setShowExerciseModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
          <Pressable style={styles.modalCloseButton} onPress={() => setShowExerciseModal(false)}>
            <Ionicons name="close" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </Pressable>

          <ScrollView>
            <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>
              {currentSession === 'rest' ? 'Rest Day' : "Today's Exercises"}
            </Text>

            {currentSession === 'rest' ? (
              <Text style={[styles.modalText, isDarkMode && styles.textDark]}>
                Today is a rest day. Take time to recover!
              </Text>
            ) : (
              <View style={styles.exerciseList}>
                {availableExercises.map((exerciseName, index) => (
                  <Pressable
                    key={index}
                    style={[styles.exerciseOption, isDarkMode && styles.exerciseOptionDark]}
                    onPress={() =>
                      addExercise({
                        id: Date.now().toString(),
                        name: exerciseName,
                        bodyPart: 'Custom',
                        description: '',
                        muscleGroups: [],
                        instructions: [],
                      })
                    }>
                    <Text style={[styles.exerciseOptionText, isDarkMode && styles.textDark]}>
                      {exerciseName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Save workout function
  const saveWorkout = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    if (alreadySubmitted) {
      Alert.alert('Already Submitted', 'You have already logged a workout for today');
      return;
    }

    let docRef = doc(db, 'Workout', user.email.toLowerCase());
    let docSnap = await getDoc(docRef);

    let data: { [key: string]: any } = {};
    let entryDate = firstEntryDate;

    if (docSnap.exists()) {
      data = docSnap.data();
      if (!data.firstEntryDate) {
        const today = new Date();
        entryDate = today.toISOString().slice(0, 10);
        data.firstEntryDate = entryDate;
        setFirstEntryDate(entryDate);
      } else {
        entryDate = data.firstEntryDate;
      }
    } else {
      const today = new Date();
      entryDate = today.toISOString().slice(0, 10);
      data.firstEntryDate = entryDate;
      setFirstEntryDate(entryDate);
    }

    const { weekKey, dayKey } = getWeekAndDayKey(entryDate);

    // Prepare workout data to store
    data[weekKey] = data[weekKey] || {};
    data[weekKey][dayKey] = {
      workoutName,
      workoutNote,
      startTime: workoutStartTime.toISOString(),
      endTime: workoutEndTime ? workoutEndTime.toISOString() : null,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
      })),
      timestamp: new Date().toISOString(),
    };

    await setDoc(docRef, data, { merge: true });
    setAlreadySubmitted(true);
    Alert.alert('Success', 'Workout saved!');
  };

  // Modify handleSetChange to automatically check completion
  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: string,
    value: string
  ) => {
    const newExercises = [...exercises];
    const currentSet = newExercises[exerciseIndex].sets[setIndex];
    currentSet[field] = value;

    // Automatically mark set as completed if both weight and reps have values
    currentSet.completed = !!(currentSet.weight && currentSet.reps);

    setExercises(newExercises);
  };

  // Add these functions inside your WorkoutScreen component
  const deleteExercise = (exerciseIndex: number) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise and all its sets?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newExercises = [...exercises];
            newExercises.splice(exerciseIndex, 1);
            setExercises(newExercises);
          },
        },
      ]
    );
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    // Don't delete if it's the only set
    if (exercise.sets.length === 1) {
      Alert.alert('Cannot Delete', 'Exercise must have at least one set');
      return;
    }

    exercise.sets.splice(setIndex, 1);
    setExercises(newExercises);
  };

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </Pressable>

          <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Log Workout</Text>

          <Pressable
            style={[styles.finishButton, alreadySubmitted && styles.finishButtonDisabled]}
            onPress={saveWorkout}
            disabled={alreadySubmitted}>
            <Text style={styles.finishButtonText}>
              {alreadySubmitted ? 'Already Submitted' : 'Finish'}
            </Text>
          </Pressable>
        </View>

        <KeyboardAwareScrollView
          style={styles.scrollView}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled">
          <TextInput
            value={workoutName}
            onChangeText={setWorkoutName}
            style={[styles.workoutNameInput, isDarkMode && styles.inputDark]}
            placeholder="Workout Name"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          />

          <View style={[styles.sessionIndicator, isDarkMode && styles.sessionIndicatorDark]}>
            <Text style={[styles.sessionLabel, isDarkMode && styles.sessionLabelDark]}>
              Current Session:
            </Text>
            <Text style={styles.sessionValue}>
              {currentSession === 'rest' ? 'Rest Day' : `Session ${currentSession}`}
            </Text>
          </View>

          <TextInput
            value={workoutNote}
            onChangeText={setWorkoutNote}
            style={[styles.workoutNoteInput, isDarkMode && styles.inputDark]}
            placeholder="Workout note"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            multiline
          />

          {timePickerSection}
          {exerciseSelectionModal}
          {exerciseModal}

          {exercises.map((exercise, exerciseIndex) => (
            <View
              key={exerciseIndex}
              style={[styles.exerciseCard, isDarkMode && styles.exerciseCardDark]}>
              <Pressable
                onPress={() => !alreadySubmitted && handleExercisePress(exercise)}
                disabled={alreadySubmitted}>
                <Text
                  style={[
                    styles.exerciseName,
                    isDarkMode && styles.textDark,
                    alreadySubmitted && styles.disabledText,
                  ]}>
                  {exercise.name}
                </Text>
              </Pressable>

              <View style={styles.setHeader}>
                <Text style={styles.setHeaderText}>Set</Text>
                <Text style={styles.setHeaderText}>kg</Text>
                <Text style={styles.setHeaderText}>Reps</Text>
                <View style={styles.setHeaderSpacer} />
              </View>

              {exercise.sets.map((set, setIndex) => (
                <View
                  key={setIndex}
                  style={[
                    styles.setRow,
                    set.completed && styles.completedSetRow,
                    isDarkMode && set.completed && styles.completedSetRowDark,
                  ]}>
                  <View style={styles.setNumberContainer}>
                    <Text style={[styles.setNumber, isDarkMode && styles.textDark]}>
                      Set {setIndex + 1}
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.inputDark,
                      alreadySubmitted && styles.disabledInput,
                    ]}
                    placeholder="Weight"
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    value={set.weight}
                    onChangeText={(value) =>
                      !alreadySubmitted && handleSetChange(exerciseIndex, setIndex, 'weight', value)
                    }
                    keyboardType="numeric"
                    editable={!alreadySubmitted}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.inputDark,
                      alreadySubmitted && styles.disabledInput,
                    ]}
                    placeholder="Reps"
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    value={set.reps}
                    onChangeText={(value) =>
                      !alreadySubmitted && handleSetChange(exerciseIndex, setIndex, 'reps', value)
                    }
                    keyboardType="numeric"
                    editable={!alreadySubmitted}
                  />
                  {!alreadySubmitted && (
                    <Pressable
                      onPress={() => deleteSet(exerciseIndex, setIndex)}
                      style={styles.deleteSetButton}>
                      <Ionicons name="remove-circle" size={24} color="#ef4444" />
                    </Pressable>
                  )}
                </View>
              ))}

              <View style={styles.exerciseActions}>
                <Pressable
                  onPress={() => addSet(exercise.id)}
                  style={[
                    styles.addSetButton,
                    isDarkMode && styles.addSetButtonDark,
                    alreadySubmitted && styles.disabledButton,
                  ]}
                  disabled={alreadySubmitted}>
                  <Text
                    style={[
                      styles.addSetButtonText,
                      isDarkMode && styles.textDark,
                      alreadySubmitted && styles.disabledText,
                    ]}>
                    Add Set
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => deleteExercise(exerciseIndex)}
                  style={[
                    styles.deleteButton,
                    alreadySubmitted && styles.disabledButton,
                  ]}
                  disabled={alreadySubmitted}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={alreadySubmitted ? '#9ca3af' : '#ef4444'}
                  />
                </Pressable>
              </View>
            </View>
          ))}

          {/* Disable Add Exercise button when submitted */}
          <Pressable
            onPress={() => setShowExerciseModal(true)}
            style={[styles.addExerciseButton, alreadySubmitted && styles.disabledButton]}
            disabled={alreadySubmitted}>
            <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
          </Pressable>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#111827',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 8, // Add more padding for notch
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  headerDark: {
    borderBottomColor: '#374151',
    backgroundColor: '#111827',
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  categoryHeaderDark: {
    backgroundColor: '#374151',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  exerciseList: {
    paddingLeft: 16,
    marginTop: 8,
  },
  exerciseOption: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseOptionDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  exerciseOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  timeButtonDark: {
    backgroundColor: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContentDark: {
    backgroundColor: '#1f2937',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginRight: 24,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#000000',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  finishButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  workoutNameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  workoutNoteInput: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseCardDark: {
    backgroundColor: '#1f2937',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  setHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  setHeaderText: {
    flex: 1,
    color: '#6b7280',
  },
  setHeaderSpacer: {
    width: 40,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Increased margin
    padding: 8, // Increased padding
    borderRadius: 8,
    backgroundColor: '#f9fafb', // Light background for better visibility
  },
  setRowDark: {
    backgroundColor: '#1f2937',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12, // Increased padding
    borderRadius: 8,
    marginHorizontal: 4,
    color: '#000000',
    fontSize: 16, // Increased font size
    borderWidth: 1, // Add border
    borderColor: '#e5e7eb',
    minWidth: 80, // Ensure minimum width
  },
  inputDark: {
    backgroundColor: '#374151',
    color: '#ffffff',
    borderColor: '#4b5563',
  },
  textDark: {
    color: '#ffffff',
  },
  checkButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  addSetButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  addSetButtonDark: {
    backgroundColor: '#374151',
  },
  addSetButtonText: {
    textAlign: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  addExerciseButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  addExerciseButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  timeButton: {
    flex: 1,
    backgroundColor: '#fff3e0', // Light orangish background
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },

  timeButtonDark: {
    backgroundColor: '#422006', // Darker orange for dark mode
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 4,
    borderRadius: 6,
  },

  completedSetRow: {
    backgroundColor: '#dcfce7', // Light green for light mode
  },
  completedSetRowDark: {
    backgroundColor: '#064e3b', // Darker green for dark mode
  },

  setNumberContainer: {
    minWidth: 60, // Ensure minimum width
    marginRight: 8, // Add margin
  },
  setNumber: {
    fontSize: 16, // Increased font size
    color: '#4b5563',
    fontWeight: '500', // Medium weight for better visibility
  },

  // Update timeButtonText color for better contrast on orange background
  timeButtonText: {
    fontSize: 16,
    color: '#783c04', // Darker text for contrast on orange
  },

  disabledText: {
    color: '#9ca3af',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    opacity: 0.7,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#e5e7eb',
  },
  sessionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sessionIndicatorDark: {
    backgroundColor: '#1f2937', // Dark mode background
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  sessionLabelDark: {
    color: '#9ca3af', // Lighter text for dark mode
  },
  sessionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6', // Keep blue color for consistency
    marginLeft: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3b82f6', // Keep blue color for interactive elements
  },
  deleteSetButton: {
    padding: 8,
    marginLeft: 4,
  },
});
