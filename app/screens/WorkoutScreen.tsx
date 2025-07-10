import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import WeekCalendar from '../components/WeekCalendar'; // Import the WeekCalendar component
import { getCurrentWeekDates } from '../utils/dateUtils'; // Import the date utility

// Import assets
const TrainingArrow = require('../assets/TrainingArrow.png');

export default function WorkoutScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [currentSession, setCurrentSession] = useState('A');
  const [userFullName, setUserFullName] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const navbarRef = useRef(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [steps, setSteps] = useState(9000);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [exerciseData, setExerciseData] = useState([]);

  // Get the week dates using our utility function
  const weekDates = getCurrentWeekDates();

  // Handle date selection
  const handleDateSelect = (selectedDate) => {
    console.log('Selected date:', selectedDate.full);
    // You can add your logic here to update data based on the selected date
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        // First, try to fetch user-specific workout template
        const userWorkoutRef = doc(db, 'WorkoutTemplates', user.email.toLowerCase());
        const userWorkoutSnap = await getDoc(userWorkoutRef);

        let data;
        // Check if user has a custom workout template
        if (userWorkoutSnap.exists()) {
          data = userWorkoutSnap.data();
        } else {
          // If no custom template exists, use the default template
          const exercisesRef = doc(db, 'ExerciseTemplates', 'Training-3x');
          const docSnap = await getDoc(exercisesRef);

          if (docSnap.exists()) {
            data = docSnap.data();
          } else {
            console.log('No workout templates found');
            setLoading(false);
            return;
          }
        }

        const sessionKey = `Session ${currentSession}`;
        const sessionExercises = data[sessionKey] || {};

        // Format exercise data for display like in the original code
        const formattedExercises = Object.entries(sessionExercises)
          .filter(
            ([key, value]) => value !== null && value !== undefined && typeof value === 'object'
          )
          .map(([exerciseName, details]) => ({
            name: exerciseName,
            sets: details?.Sets || '0',
            repRange: details?.Reps || '0',
          }));

        setExerciseData(formattedExercises);
        setSessionData(data[sessionKey]);

        // Fetch user's full name if needed
        const intakeFormRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const intakeFormSnap = await getDoc(intakeFormRef);

        if (intakeFormSnap.exists()) {
          setUserFullName(intakeFormSnap.data().fullName);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email, currentSession]);

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
    listener: (event) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Show navbar when scrolling starts
      if (navbarRef.current) {
        navbarRef.current.show();
      }

      // Hide navbar after scrolling stops
      scrollTimeout.current = setTimeout(() => {
        if (navbarRef.current) {
          navbarRef.current.hide();
        }
      }, 2000);

      lastScrollY.current = currentScrollY;
    },
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>Time to level up.</Text>
          <Text style={styles.headerTitle}>Let's move!</Text>
          <Text style={styles.dateText}>{`${currentMonth}, ${currentYear}`}</Text>
        </View>
      </View>

      {/* Replace the Calendar Week View with the WeekCalendar component */}
      <WeekCalendar
        weekDates={weekDates}
        onDatePress={handleDateSelect}
        containerStyle={styles.calendarContainerStyle}
      />
    </View>
  );

  const renderTodaysAim = () => (
    <View style={styles.aimCard}>
      <View style={styles.aimHeader}>
        <View style={styles.aimIconContainer}>
          <Ionicons name="analytics-outline" size={22} color="#fff" />
        </View>
        <Text style={styles.aimTitle}>Today's Aim</Text>
        <Feather name="chevron-right" size={20} color="#fff" />
      </View>
      <Text style={styles.aimSubtitle}>Movement Variability</Text>
    </View>
  );

  const renderStepsCard = () => (
    <TouchableOpacity style={styles.stepsCard} onPress={() => navigation.navigate('Steps')}>
      <View style={styles.stepsIconContainer}>
        <Ionicons name="footsteps-outline" size={22} color="#fff" />
      </View>

      <View style={styles.stepsContent}>
        <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
        <Text style={styles.stepsGoal}>Goal: {stepsGoal.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPrepTimeCard = () => (
    <TouchableOpacity style={styles.prepCard} onPress={() => navigation.navigate('Warmup')}>
      <View style={styles.prepContent}>
        <Ionicons name="timer-outline" size={24} color="#fff" />
        <View style={styles.prepTextContainer}>
          <Text style={styles.prepTitle}>Prep time.</Text>
          <Text style={styles.prepTitle}>Warm Up!</Text>
          <Feather name="chevron-right" size={20} color="#fff" style={styles.prepArrow} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTraining = () => (
    <View style={styles.trainingSection}>
      <View style={styles.trainingHeader}>
        <Text style={styles.trainingTitle}>Training</Text>
        <Image source={TrainingArrow} style={styles.trainingArrowImage} />
      </View>

      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>Session {currentSession}</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() =>
              navigation.navigate('Exercise', {
                exercises: exerciseData,
                sessionName: `Session ${currentSession}`,
              })
            }>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.exercisesList}>
          {exerciseData.map((exercise, index) => (
            <View key={index} style={styles.exerciseRow}>
              <View style={styles.exerciseInfo}>
                <View style={styles.bulletPoint} />
                <Text style={styles.exerciseName}>{exercise.name}</Text>
              </View>
              <Text style={styles.exerciseSets}>{exercise.sets}</Text>
              <Text style={styles.exerciseRepRange}>× {exercise.repRange}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        {renderHeader()}

        <View style={styles.content}>
          {/* First row with two cards side by side */}
          <View style={styles.cardRow}>
            {renderTodaysAim()}
            {renderPrepTimeCard()}
          </View>

          {/* Second row with steps card */}
          {renderStepsCard()}

          {renderTraining()}
        </View>
      </ScrollView>

      <Navbar ref={navbarRef} activeScreen="Workout" opacityValue={navOpacity} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#081A2F',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  headerContainer: {
    backgroundColor: '#081A2F',
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    top: 25,
  },
  headerTitle: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.09, // 7% of screen width
    fontWeight: 'bold',
    lineHeight: Dimensions.get('window').width * 0.095, // 9.5% of screen width
  },
  dateText: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.035, // 3.5% of screen width
    opacity: 0.7,
    marginTop: 10,
  },
  calendarContainerStyle: {
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: Dimensions.get('window').width * 0.02, // 2% of screen width
  },
  content: {
    backgroundColor: '#f5f5f5',
    padding: Dimensions.get('window').width * 0.05, // 5% of screen width
    flex: 1,
    marginTop: 0,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Dimensions.get('window').height * 0.018, // 1.8% of screen height
    alignItems: 'flex-start',
    height: Dimensions.get('window').height * 0.22, // Fixed height for consistency
  },
  aimCard: {
    backgroundColor: '#081A2F',
    borderRadius: 16,
    padding: Dimensions.get('window').width * 0.04, // 4% of screen width
    flex: 0.48, // 48% of available width
    marginRight: Dimensions.get('window').width * 0.02, // 2% spacing
    justifyContent: 'space-between',
  },
  aimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Dimensions.get('window').height * 0.025, // 2.5% of screen height
  },
  aimIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
  },
  aimTitle: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.04, // 4% of screen width
    fontWeight: 'bold',
    flex: 1,
  },
  aimSubtitle: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.035, // 3.5% of screen width
    opacity: 0.7,
  },
  stepsCard: {
    backgroundColor: '#C7312B',
    borderRadius: 16,
    padding: Dimensions.get('window').width * 0.04, // 4% of screen width
    flexDirection: 'row',
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.437, // 50% of screen width
    alignSelf: 'flex-start',
    marginTop: -Dimensions.get('window').height * 0.09, // Negative margin relative to screen height
    marginBottom: Dimensions.get('window').height * 0.02, // 2% of screen height
  },
  stepsIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
    marginRight: 16,
  },
  stepsContent: {
    flex: 1,
  },
  stepsCount: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.075, // 7.5% of screen width
    fontWeight: 'bold',
  },
  stepsGoal: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.03, // 3% of screen width
    opacity: 0.8,
  },
  prepCard: {
    backgroundColor: '#081A2F',
    borderRadius: 16,
    padding: Dimensions.get('window').width * 0.04, // 4% of screen width
    flex: 0.5, // 50% of available width
    justifyContent: 'center',
    height: Dimensions.get('window').height * 0.25,
  },
  prepContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prepTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  prepTitle: {
    color: '#fff',
    fontSize: Dimensions.get('window').width * 0.04, // 4% of screen width
    fontWeight: 'bold',
    lineHeight: Dimensions.get('window').width * 0.06, // 6% of screen width
  },
  prepArrow: {
    position: 'absolute',
    right: Dimensions.get('window').width * 0.16, // 12% from right
    top: '50%',
    marginTop: 40, // Half of icon height
  },
  trainingSection: {
    marginTop: Dimensions.get('window').height * 0.02, // 2% of screen height
  },
  trainingHeader: {
    position: 'relative',
    marginBottom: Dimensions.get('window').height * 0.018, // 1.8% of screen height
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingTitle: {
    color: '#ffff',
    fontSize: Dimensions.get('window').width * 0.1, // 10% of screen width
    fontWeight: 'bold',
    zIndex: 2,
    position: 'relative',
  },
  trainingArrowImage: {
    position: 'absolute',
    right: Dimensions.get('window').width * 0.25, // 5% from right
    top: -Dimensions.get('window').height * 0.025, // 2.5% above
    width: Dimensions.get('window').width * 0.7, // 70% of screen width
    height: Dimensions.get('window').height * 0.12, // 12% of screen height
    resizeMode: 'contain',
    zIndex: 1,
  },
  sessionCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: Dimensions.get('window').width * 0.04, // 4% of screen width
    marginTop: Dimensions.get('window').height * 0.03, // 5% of screen height
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Dimensions.get('window').height * 0.025, // 2.5% of screen height
  },
  sessionTitle: {
    color: '#000000',
    fontSize: Dimensions.get('window').width * 0.045, // 4.5% of screen width
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#C7312B',
    paddingVertical: Dimensions.get('window').height * 0.01, // 1% of screen height
    paddingHorizontal: Dimensions.get('window').width * 0.04, // 4% of screen width
    borderRadius: 10,
    minWidth: Dimensions.get('window').width * 0.3, // 30% of screen width
    alignItems: 'center',
    marginRight: Dimensions.get('window').width * 0.25, // 2% of screen width
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Dimensions.get('window').width * 0.035, // 3.5% of screen width
  },
  exercisesList: {
    marginTop: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Dimensions.get('window').height * 0.02, // 2% of screen height
    paddingHorizontal: Dimensions.get('window').width * 0.02, // 2% of screen width
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginRight: Dimensions.get('window').width * 0.08, // 8% of screen width
  },
  exerciseName: {
    color: '#000000',
    fontSize: Dimensions.get('window').width * 0.03, // 3% of screen width
    flex: 1,
  },
  exerciseSets: {
    color: '#000000',
    fontSize: Dimensions.get('window').width * 0.035, // 3.5% of screen width
    textAlign: 'center',
    width: Dimensions.get('window').width * 0.08, // 8% of screen width
    marginHorizontal: 5,
  },
  exerciseRepRange: {
    color: '#000000',
    fontSize: Dimensions.get('window').width * 0.032, // 3.2% of screen width
    textAlign: 'right',
    flex: 1,
  },
});
