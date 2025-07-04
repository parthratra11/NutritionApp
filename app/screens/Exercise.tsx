import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Image,
  PanResponder,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ExerciseItemProps = {
  name: string;
  sets: string;
  repRange: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onEditPress: () => void;
};

const ExerciseItem = ({ 
  name, 
  sets, 
  repRange, 
  isCompleted, 
  onToggleComplete, 
  onEditPress 
}: ExerciseItemProps) => (
  <TouchableOpacity 
    style={[styles.exerciseItem, isCompleted && styles.completedExercise]} 
    onPress={onToggleComplete}
    activeOpacity={0.7}
  >
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseLeftSection}>
        <View style={[styles.exerciseCheckCircle, isCompleted && styles.completedCheckCircle]}>
          {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={[styles.exerciseName, isCompleted && styles.completedText]}>
          {name}
        </Text>
      </View>
      
      <View style={styles.exerciseRightSection}>
        <Text style={[styles.exerciseSets, isCompleted && styles.completedText]}>
          {sets}
        </Text>
        <Text style={[styles.exerciseRepRange, isCompleted && styles.completedText]}>
          <Text style={styles.repRangePrefix}>{'<'}</Text>{repRange}
        </Text>
        <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
          <Feather name="edit-2" size={16} color={isCompleted ? "#777" : "#fff"} />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const Exercise = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useTheme();
  const [exercises, setExercises] = useState([]);
  const [sessionName, setSessionName] = useState("Session A");
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [startTime, setStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const dragThreshold = screenHeight * 0.2; // 20% of screen height to trigger close
  const scrollViewRef = useRef(null);
  const isScrolling = useRef(false);
  const isDragging = useRef(false);
  
  // Pan responder for drag down to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only enable pan responder when scrolled to the top and dragging down
      const isDraggingDown = gestureState.dy > 5;
      const isAtTop = isScrolling.current === false || gestureState.vy > 0;
      return isAtTop && isDraggingDown;
    },
    onPanResponderGrant: () => {
      isDragging.current = true;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        // Only allow dragging down, not up
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      isDragging.current = false;
      
      if (gestureState.dy > dragThreshold) {
        // If dragged down beyond threshold, close the screen
        handleGoBack();
      } else {
        // Otherwise snap back to original position
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }
    },
  });
  
  const handleScroll = (event) => {
    // Track if the scroll view is at the top
    const offsetY = event.nativeEvent.contentOffset.y;
    isScrolling.current = offsetY > 0;
  };
  
  useEffect(() => {
    // Get exercises from route params if available
    if (route.params?.exercises) {
      const initialExercises = route.params.exercises.map(ex => ({
        ...ex,
        isCompleted: true // Start with all exercises marked as completed
      }));
      setExercises(initialExercises);
    }
    
    if (route.params?.sessionName) {
      setSessionName(route.params.sessionName);
    }
    
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 70,
      friction: 10,
      useNativeDriver: true,
    }).start();
    
    // Start timer
    startTimer();
    
    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsedTime(diff);
    }, 1000);
  };
  
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleGoBack = () => {
    // Slide down animation before navigating back
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };
  
  const handleToggleComplete = (index) => {
    const updatedExercises = [...exercises];
    updatedExercises[index].isCompleted = !updatedExercises[index].isCompleted;
    setExercises(updatedExercises);
  };
  
  const handleEditExercise = (index) => {
    // Implement exercise editing functionality
    console.log(`Edit exercise at index ${index}`);
  };
  
  const handleFinish = () => {
    // Implement saving completed workout
    // You might want to pass the completed exercises back to the WorkoutScreen
    handleGoBack();
  };
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

return (
    <View style={styles.modalContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* This is the transparent overlay that shows the previous screen */}
      <View style={styles.backgroundOverlay} />
      
      <Animated.View
        style={[
          styles.safeArea,
          {
            transform: [{ translateY: slideAnim }],
            opacity: slideAnim.interpolate({
              inputRange: [0, screenHeight * 0.5],
              outputRange: [1, 0.7],
              extrapolate: 'clamp'
            })
          }
        ]}
      >
        {/* Pull-down handle indicator */}
        <View style={styles.pullDownContainer} {...panResponder.panHandlers}>
          <View style={styles.pullDownIndicator} />
        </View>
        
        <View style={styles.header}>
          <View style={styles.timerIconContainer}>
            <Ionicons name="time-outline" size={24} color="#fff" />
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.dateText}>{currentDate}</Text>
            <Text style={styles.timeText}>{formatTime(elapsedTime)}</Text>
          </View>
          
          <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>
        
        {/* Rest of your content */}
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionName}>{sessionName}</Text>
        </View>
        
        <View style={styles.exerciseListHeader}>
          <Text style={styles.exerciseHeaderText}>Exercise</Text>
          <View style={styles.exerciseHeaderRight}>
            <Text style={styles.exerciseHeaderText}>Sets</Text>
            <Text style={styles.exerciseHeaderText}>Rep Range</Text>
            <View style={styles.editHeaderSpacer} />
          </View>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {exercises.map((exercise, index) => (
            <ExerciseItem
              key={index}
              name={exercise.name}
              sets={exercise.sets}
              repRange={exercise.repRange}
              isCompleted={exercise.isCompleted}
              onToggleComplete={() => handleToggleComplete(index)}
              onEditPress={() => handleEditExercise(index)}
            />
          ))}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel Workout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
);
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent overlay
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#081A2F',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    // Add these properties to position the modal correctly
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '100%',
  },
  pullDownContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  pullDownIndicator: {
    width: 80,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
  },
  timerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    alignItems: 'center',
  },
  dateText: {
    color: '#7A7A7A',
    fontSize: screenWidth * 0.035,
    opacity: 0.7,
  },
  timeText: {
    color: '#fff',
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#C7312B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  finishText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: screenWidth * 0.035,
  },
  sessionHeader: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
  },
  sessionName: {
    color: '#fff',
    fontSize: screenWidth * 0.05,
    fontWeight: 'bold',
  },
  exerciseListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenWidth * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#081A2F',
  },
  exerciseHeaderText: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    fontWeight: '600',
    opacity: 1,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    width: '50%',
    justifyContent: 'space-between',
  },
  editHeaderSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  exerciseItem: {
    paddingVertical: screenHeight * 0.018,
    paddingHorizontal: screenWidth * 0.05,
    marginVertical: screenHeight * 0.005, // Add margin for all items
    borderBottomWidth: 0, // Remove bottom border for all items
    marginHorizontal: screenWidth * 0.02, // Add horizontal margin for all items
    borderRadius: 10, // Add slight border radius to all items
  },
  completedExercise: {
    backgroundColor: '#D9D9D959',
    marginHorizontal: screenWidth * 0.02,
    marginVertical: screenHeight * 0.005,
    borderRadius: 20,
   
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  exerciseCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheckCircle: {
    backgroundColor: '#66BB6A',
    borderColor: '#66BB6A',
  },
  exerciseName: {
    color: '#fff',
    fontSize: screenWidth * 0.031,
    flex: 1,
  },
  completedText: {
    opacity: 1,
  },
  exerciseRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    justifyContent: 'space-between',
  },
  exerciseSets: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    textAlign: 'center',
    width: screenWidth * 0.08,
  },
  exerciseRepRange: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    textAlign: 'right',
    width: screenWidth * 0.15,
  },
  repRangePrefix: {
    fontSize: screenWidth * 0.035,
  },
  editButton: {
    padding: 8,
  },
  cancelButton: {
    marginBottom: screenHeight * 0.13,
    marginHorizontal: screenWidth * 0.1,
    padding: screenHeight * 0.016,
    backgroundColor: '#562424',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffff',
    fontWeight: '600',
    fontSize: screenWidth * 0.038,
  },
  bottomPadding: {
    height: 20,
  },
});

export default Exercise;