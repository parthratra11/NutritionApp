import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
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

// Import assets
const HomeIcon = require('../assets/home.png');
const ChatIcon = require('../assets/chat.png');
const AddIcon = require('../assets/add.png');
const WorkoutIcon = require('../assets/workout.png');
const NutritionIcon = require('../assets/nutrition.png');
const NavRectangle = require('../assets/NavRectangle.png');
const TrainingArrow = require('../assets/TrainingArrow.png'); // Add this line
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
  const screenWidth = Dimensions.get('window').width;
  const [steps, setSteps] = useState(9000);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [exerciseData, setExerciseData] = useState([]);

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

  // Get current date and week days
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dates = [];

    // Get days of current week (Sunday to Saturday)
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - today.getDay() + i);
      dates.push({
        day: dayLetters[i],
        date: date.getDate().toString(),
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    return dates;
  };

  const weekDates = getCurrentWeekDates();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
    listener: (event) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      Animated.timing(navOpacity, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }).start();

      scrollTimeout.current = setTimeout(() => {
        Animated.timing(navOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }).start();
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

      {/* Calendar Week View */}
      <View style={styles.calendarContainer}>
        {weekDates.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dayContainer, item.isToday && styles.todayContainer]}>
            <Text style={[styles.dayLetter, item.isToday && styles.todayText]}>{item.day}</Text>

            {item.isToday ? (
              <View style={styles.todayDateCircle}>
                <Text style={[styles.dayNumber, styles.todayText]}>{item.date}</Text>
              </View>
            ) : (
              <Text style={styles.dayNumber}>{item.date}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
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
    <View style={styles.stepsCard}>
      <View style={styles.stepsIconContainer}>
        <Ionicons name="footsteps-outline" size={22} color="#fff" />
      </View>

      <View style={styles.stepsContent}>
        <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
        <Text style={styles.stepsGoal}>Goal: {stepsGoal.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderPrepTimeCard = () => (
    <View style={styles.prepCard}>
      <View style={styles.prepContent}>
        <Ionicons name="timer-outline" size={24} color="#fff" />
        <View style={styles.prepTextContainer}>
          <Text style={styles.prepTitle}>Prep time.</Text>
          <Text style={styles.prepTitle}>Warm Up!</Text>
          <Feather name="chevron-right" size={20} color="#fff" style={styles.prepArrow} />
        </View>
      </View>
    </View>
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
          <TouchableOpacity style={styles.startButton}>
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
              <Text style={styles.exerciseRepRange}>{exercise.repRange} </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBottomNav = () => (
    <Animated.View style={[styles.bottomNavContainer, { opacity: navOpacity }]}>
      <Image source={NavRectangle} style={styles.bottomNavBg} />
      <View style={styles.bottomNavContent}>
        <Pressable onPress={() => navigation.navigate('Home')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={HomeIcon} style={styles.bottomNavIcon} />
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('WeeklyForm')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={AddIcon} style={styles.bottomNavIcon} />
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Nutrition')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={NutritionIcon} style={styles.bottomNavIcon} />
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Slack')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={ChatIcon} style={styles.bottomNavIcon} />
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Workout')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={WorkoutIcon} style={styles.bottomNavIcon} />
            <View style={styles.activeEclipse} />
          </View>
        </Pressable>
      </View>
    </Animated.View>
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
      {renderBottomNav()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Updated to match ReportScreen
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
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerContent: {
    flexDirection: 'row', // Changed to match ReportScreen
    justifyContent: 'space-between', // Changed to match ReportScreen
    alignItems: 'flex-start', // Changed to match ReportScreen
    marginBottom: 30, // Changed to match ReportScreen
    top: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 38,
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
    marginTop: 10,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  dayContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    minWidth: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  todayContainer: {
    backgroundColor: '#2A3F5F',
    borderWidth: 0,
  },
  dayLetter: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
    opacity: 0.7,
  },
  dayNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todayText: {
    color: '#fff',
    opacity: 1,
  },

  content: {
    backgroundColor: '#f5f5f5', // Updated to match ReportScreen
    padding: 20,
    flex: 1,
    marginTop: 0, // Removed negative margin
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'flex-start', // Change to stretch for equal heights
  },
  aimCard: {
    backgroundColor: '#081A2F',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginRight: 10,
    height: undefined, // Remove fixed height
  },
  aimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aimIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
  },
  aimTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  aimSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  stepsCard: {
    backgroundColor: '#C7312B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',

    width: '50%', // Full width
    top: -75,
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
    fontSize: 30,
    fontWeight: 'bold',
  },
  stepsGoal: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  prepCard: {
    backgroundColor: '#081A2F',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    height: 180, // Remove fixed height
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
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  prepArrow: {
    position: 'absolute',
    right: 50,
    top: 60,
    height: 50,
  },
  trainingSection: {
    marginTop: -28,
  },
  trainingHeader: {
    position: 'relative',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingTitle: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    zIndex: 2,
    position: 'relative',
  },
  trainingArrowImage: {
    position: 'absolute',
    right: 70,
    top: -20,
    width: 380, // Adjust width as needed
    height: 97, // Adjust height as needed
    resizeMode: 'stretch',
    zIndex: 1,
  },
  sessionCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginTop: 40,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#C7312B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: 127,
    right: 70,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exercisesList: {
    marginTop: 10,
    left: -10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginRight: 30,
  },
  exerciseName: {
    color: '#000000',
    fontSize: 12,
    flex: 1,
  },
  exerciseSets: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
    width: 30,
    marginHorizontal: 5,
  },
  exerciseRepRange: {
    color: '#000000',
    fontSize: 13,
    textAlign: 'right',
    flex: 1,
  },
  bottomNavContainer: {
    height: 55,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
  },
  bottomNavBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
    bottom: 0,
    left: 0,
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
    backgroundColor: '#C7312B',
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
