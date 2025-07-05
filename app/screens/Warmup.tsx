import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type WarmupItemProps = {
  name: string;
  sets: string;
  repsBreaths: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
};

const WarmupItem = ({ 
  name, 
  sets, 
  repsBreaths, 
  isCompleted, 
  onToggleComplete 
}: WarmupItemProps) => (
  <TouchableOpacity 
    style={[styles.warmupItem, isCompleted && styles.completedWarmup]} 
    onPress={onToggleComplete}
    activeOpacity={0.7}
  >
    <View style={styles.warmupRow}>
      <View style={styles.warmupLeftSection}>
        <View style={[styles.warmupCheckCircle, isCompleted && styles.completedCheckCircle]}>
          {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={[styles.warmupName, isCompleted && styles.completedText]}>
          {name}
        </Text>
      </View>
      
      <View style={styles.warmupRightSection}>
        <Text style={[styles.warmupSets, isCompleted && styles.completedText]}>
          {sets}
        </Text>
        <Text style={[styles.warmupRepsBreaths, isCompleted && styles.completedText]}>
          {repsBreaths}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const Warmup = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useTheme();
  const [startTime, setStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const dragThreshold = screenHeight * 0.2;
  const scrollViewRef = useRef(null);
  const isScrolling = useRef(false);
  
  // Hardcoded warmup exercises
  const [warmupExercises, setWarmupExercises] = useState([
    { name: 'Foam Roller Walkover', sets: '1', repsBreaths: '8 Reps/Breaths', isCompleted: true },
    { name: 'Hooklying Low Reach', sets: '1', repsBreaths: '8 Reps/Breaths', isCompleted: true },
    { name: 'Side-Lying Split Squat', sets: '1', repsBreaths: '8 Reps/Breaths', isCompleted: true },
    { name: '1/4 Wall Squat w/Reach', sets: '1', repsBreaths: '8 Reps/Breaths', isCompleted: true },
    { name: 'Toe Touch to Bench', sets: '1', repsBreaths: '8 Reps/Breaths', isCompleted: true },
  ]);
  
  // Pan responder for drag down to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const isDraggingDown = gestureState.dy > 5;
      const isAtTop = isScrolling.current === false || gestureState.vy > 0;
      return isAtTop && isDraggingDown;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > dragThreshold) {
        handleGoBack();
      } else {
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
    const offsetY = event.nativeEvent.contentOffset.y;
    isScrolling.current = offsetY > 0;
  };
  
  useEffect(() => {
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
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };
  
  const handleToggleComplete = (index) => {
    const updatedExercises = [...warmupExercises];
    updatedExercises[index].isCompleted = !updatedExercises[index].isCompleted;
    setWarmupExercises(updatedExercises);
  };
  
  const handleFinish = () => {
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
        
        <View style={styles.warmupHeader}>
          <Text style={styles.warmupTitle}>Warm Up</Text>
        </View>
        
      
        
        <ScrollView 
          style={styles.scrollView}
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {warmupExercises.map((exercise, index) => (
            <WarmupItem
              key={index}
              name={exercise.name}
              sets={exercise.sets}
              repsBreaths={exercise.repsBreaths}
              isCompleted={exercise.isCompleted}
              onToggleComplete={() => handleToggleComplete(index)}
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 25,
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
  warmupHeader: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  warmupTitle: {
    color: '#fff',
    fontSize: screenWidth * 0.05,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  warmupListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenWidth * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#081A2F',
  },
  warmupHeaderText: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    fontWeight: '600',
    opacity: 1,
  },
  warmupHeaderRight: {
    flexDirection: 'row',
    width: '50%',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  warmupItem: {
    paddingVertical: screenHeight * 0.018,
    paddingHorizontal: screenWidth * 0.05,
    marginVertical: screenHeight * 0.005,
    borderBottomWidth: 0,
    marginHorizontal: screenWidth * 0.02,
    borderRadius: 10,
  },
  completedWarmup: {
    backgroundColor: '#D9D9D959',
    marginHorizontal: screenWidth * 0.02,
    marginVertical: screenHeight * 0.005,
    borderRadius: 20,
  },
  warmupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warmupLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  warmupCheckCircle: {
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
  warmupName: {
    color: '#fff',
    fontSize: screenWidth * 0.031,
    flex: 1,
  },
  completedText: {
    opacity: 1,
  },
  warmupRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    justifyContent: 'space-between',
  },
  warmupSets: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    textAlign: 'center',
    width: screenWidth * 0.08,
  },
  warmupRepsBreaths: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    textAlign: 'right',
    width: screenWidth * 0.3,
  },
  cancelButton: {
    marginBottom: screenHeight * 0.23,
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

export default Warmup;