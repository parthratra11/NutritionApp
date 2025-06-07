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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function WorkoutScreen() {
  const navigation = useNavigation();
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date>(new Date());
  const [workoutEndTime, setWorkoutEndTime] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetails | null>(null);
  const [workoutNote, setWorkoutNote] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    Chest: false,
    Back: false,
    Legs: false,
    Shoulders: false,
    Arms: false,
    Core: false,
    Miscellaneous: false,
  });
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'Squat (Barbell)',
      sets: [{ id: '1', weight: '80', reps: '8', completed: false }],
      previousWeight: '77.5',
      previousReps: '8',
    },
  ]);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const [workoutName, setWorkoutName] = useState(`Workout - ${today}`);

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
        style={[styles.timeButton, isDark && styles.timeButtonDark]}
        onPress={() => setShowStartPicker(true)}>
        <Text style={[styles.timeButtonText, isDark && styles.textDark]}>
          Start: {workoutStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.timeButton, isDark && styles.timeButtonDark]}
        onPress={() => setShowEndPicker(true)}>
        <Text style={[styles.timeButtonText, isDark && styles.textDark]}>
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
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
          </Pressable>

          {selectedExercise && (
            <ScrollView>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                {selectedExercise.name}
              </Text>

              <Image
                source={require('../assets/placeholder/gym.jpeg')}
                style={styles.exerciseImage}
                resizeMode="cover"
              />

              <Text style={[styles.modalSubtitle, isDark && styles.textDark]}>Description</Text>
              <Text style={[styles.modalText, isDark && styles.textDark]}>
                {selectedExercise.description}
              </Text>

              <Text style={[styles.modalSubtitle, isDark && styles.textDark]}>Muscle Groups</Text>
              {selectedExercise.muscleGroups.map((muscle, index) => (
                <Text key={index} style={[styles.modalText, isDark && styles.textDark]}>
                  • {muscle}
                </Text>
              ))}

              <Text style={[styles.modalSubtitle, isDark && styles.textDark]}>Instructions</Text>
              {selectedExercise.instructions.map((instruction, index) => (
                <Text key={index} style={[styles.modalText, isDark && styles.textDark]}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

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
                weight: exercise.sets[exercise.sets.length - 1]?.weight || '',
                reps: exercise.sets[exercise.sets.length - 1]?.reps || '',
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

  const exerciseSelectionModal = (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showExerciseModal}
      onRequestClose={() => setShowExerciseModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <Pressable style={styles.modalCloseButton} onPress={() => setShowExerciseModal(false)}>
            <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
          </Pressable>

          <ScrollView>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>Select Exercise</Text>

            {(
              ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Miscellaneous'] as (
                | BodyPart
                | 'Miscellaneous'
              )[]
            ).map((bodyPart) => (
              <View key={bodyPart} style={styles.categoryContainer}>
                <Pressable
                  style={styles.categoryHeader}
                  onPress={() => {
                    setExpandedSections((prev) => ({
                      ...prev,
                      [bodyPart]: !prev[bodyPart],
                    }));
                  }}>
                  <Text style={[styles.categoryTitle, isDark && styles.textDark]}>{bodyPart}</Text>
                  <Ionicons
                    name={expandedSections[bodyPart] ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={isDark ? '#ffffff' : '#000000'}
                  />
                </Pressable>

                {expandedSections[bodyPart] && (
                  <View style={styles.exerciseList}>
                    {EXERCISES_DB.filter((exercise) => exercise.bodyPart === bodyPart).map(
                      (exercise) => (
                        <Pressable
                          key={exercise.id}
                          style={[styles.exerciseOption, isDark && styles.exerciseOptionDark]}
                          onPress={() => addExercise(exercise)}>
                          <Text style={[styles.exerciseOptionText, isDark && styles.textDark]}>
                            {exercise.name}
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </Pressable>

        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Log Workout</Text>

        <Pressable style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        <TextInput
          value={workoutName}
          onChangeText={setWorkoutName}
          style={[styles.workoutNameInput, isDark && styles.inputDark]}
          placeholder="Workout Name"
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
        />

        <TextInput
          value={workoutNote}
          onChangeText={setWorkoutNote}
          style={[styles.workoutNoteInput, isDark && styles.inputDark]}
          placeholder="Workout note"
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          multiline
        />

        {timePickerSection}
        {exerciseSelectionModal}
        {exerciseModal}

        {exercises.map((exercise) => (
          <View key={exercise.id} style={[styles.exerciseCard, isDark && styles.exerciseCardDark]}>
            <Pressable onPress={() => handleExercisePress(exercise)}>
              <Text style={[styles.exerciseName, isDark && styles.textDark]}>{exercise.name}</Text>
            </Pressable>

            <View style={styles.setHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={styles.setHeaderText}>kg</Text>
              <Text style={styles.setHeaderText}>Reps</Text>
              <View style={styles.setHeaderSpacer} />
            </View>

            {exercise.sets.map((set, index) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={[styles.setNumber, isDark && styles.textDark]}>#{index + 1}</Text>
                <TextInput
                  value={set.weight}
                  onChangeText={(value) => {
                    /* Handle weight change */
                  }}
                  style={[styles.input, isDark && styles.inputDark]}
                  keyboardType="numeric"
                />
                <TextInput
                  value={set.reps}
                  onChangeText={(value) => {
                    /* Handle reps change */
                  }}
                  style={[styles.input, isDark && styles.inputDark]}
                  keyboardType="numeric"
                />
                <Pressable
                  onPress={() => toggleSetCompletion(exercise.id, set.id)}
                  style={styles.checkButton}>
                  <Ionicons
                    name={set.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={24}
                    color={set.completed ? '#22c55e' : '#9ca3af'}
                  />
                </Pressable>
              </View>
            ))}

            <View style={styles.exerciseActions}>
              <Pressable
                onPress={() => addSet(exercise.id)}
                style={[styles.addSetButton, isDark && styles.addSetButtonDark]}>
                <Text style={[styles.addSetButtonText, isDark && styles.textDark]}>Add Set</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  /* Handle delete exercise */
                }}
                style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable onPress={() => setShowExerciseModal(true)} style={styles.addExerciseButton}>
          <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  timeButtonText: {
    fontSize: 16,
    color: '#4b5563',
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
    marginBottom: 8,
  },
  setNumber: {
    flex: 1,
    color: '#4b5563',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  inputDark: {
    backgroundColor: '#374151',
    color: '#ffffff',
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
});
