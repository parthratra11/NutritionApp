import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'; // Import FontAwesome6
import Navbar from '../components/navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define mood options with more visual properties
const moodOptions = [
  { id: 1, name: 'Sad', icon: 'sad-outline', iconType: 'ionicon', value: 1, color: '#607D8B' },
  { id: 2, name: 'Neutral', icon: 'face-meh', iconType: 'fontawesome6', value: 2, color: '#8E8E93' },
  { id: 3, name: 'Happy', icon: 'happy-outline', iconType: 'ionicon', value: 3, color: '#C7312B' },
];

// Week calendar component similar to ReportScreen
const WeekdayBar = () => {
  // Get current date and previous 6 days
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayLetters = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const dates = [];
    
    // Get previous 6 days and today
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push({
        day: dayLetters[date.getDay()],
        date: date.getDate().toString(),
        full: date,
        isToday: i === 0
      });
    }
    
    return dates;
  };

  const weekDates = getCurrentWeekDates();
  
  return (
    <View style={styles.calendarContainer}>
      {weekDates.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={[
            styles.dayContainer,
            item.isToday && styles.todayContainer
          ]}
        >
          <Text style={[
            styles.dayLetter,
            item.isToday && styles.todayText
          ]}>{item.day}</Text>
          <Text style={[
            styles.dayNumber,
            item.isToday && styles.todayText
          ]}>{item.date}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Mood graph showing mood history
const MoodGraph = () => {
  // Sample data for the mood graph
  const moodData = [
    { day: 'Mon', value: 1.5, size: 10 },
    { day: 'Tue', value: 2.8, size: 18 },
    { day: 'Wed', value: 1.2, size: 8 },
    { day: 'Thu', value: 2.5, size: 15 },
    { day: 'Fri', value: 3.0, size: 25 },
    { day: 'Sat', value: 2.2, size: 14 },
    { day: 'Sun', value: 2.7, size: 22 },
  ];

  return (
    <View style={styles.graphContainer}>
      <View style={styles.graphContent}>
        {moodData.map((item, index) => (
          <View key={index} style={styles.graphItem}>
            <View 
              style={[
                styles.moodDot, 
                { 
                  width: item.size * 2, 
                  height: item.size * 2,
                  backgroundColor: item.value > 2 ? '#C7312B' : '#607D8B',
                }
              ]} 
            />
            <Text style={styles.graphDayText}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const MoodScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(moodOptions[1]); // Default to neutral
  const [scrollY, setScrollY] = useState(0);
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const navbarRef = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);
  const moodItemHeight = 120; // Height of each mood item

  useEffect(() => {
    // Center the scroll view to the middle mood initially
    setTimeout(() => {
      if (scrollViewRef.current && !moodSubmitted) {
        scrollViewRef.current.scrollTo({ 
          y: moodItemHeight, // Scroll to middle mood (neutral)
          animated: false 
        });
      }
    }, 100);
  }, [moodSubmitted]);

  const handleMoodScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollY(offsetY);
    
    // Calculate which mood is centered based on the middle of the viewport, not just scroll position
    // The viewport center is at offsetY + (container height / 2)
    const viewportCenter = offsetY + (220 / 2); // 220 is the container height
    const index = Math.floor(viewportCenter / moodItemHeight) - 1; // Subtract 1 for the empty space at top
    
    const moodIndex = Math.max(0, Math.min(moodOptions.length - 1, index));
    setSelectedMood(moodOptions[moodIndex]);
  };

  const handleSubmit = async () => {
    try {
      // First set the mood as submitted to trigger the UI change
      setMoodSubmitted(true);
      
      // Save selected mood
      const newMoodEntry = {
        id: Date.now().toString(),
        mood: selectedMood,
        date: new Date().toISOString()
      };
      
      // Get existing mood history
      const existingHistory = await AsyncStorage.getItem('moodHistory');
      const moodHistory = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Add new entry and save
      const updatedHistory = [newMoodEntry, ...moodHistory];
      await AsyncStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
      
      // No navigation - stay on this screen to show the selected mood
      // setTimeout(() => {
      //   navigation.goBack();
      // }, 1500);
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  // Render items with 3D effect based on scroll position
  const renderMoodItem = (item, index) => {
    // Calculate viewport center
    const viewportCenter = scrollY + (220 / 2);
    
    // Calculate the center of this item
    const itemCenter = (index + 1) * moodItemHeight; // +1 to account for empty space at top
    
    // Distance from center now uses viewport center
    const distanceFromCenter = Math.abs(viewportCenter - itemCenter);
    const isActive = distanceFromCenter < moodItemHeight / 2;
    
    const scale = isActive ? 1.2 : 0.8;
    const opacity = isActive ? 1 : 0.5;
    
    // Render the appropriate icon based on its type
    return (
      <View 
        key={item.id}
        style={[
          styles.moodItem,
          { transform: [{ scale }], opacity }
        ]}
      >
        {item.iconType === 'fontawesome6' ? (
          <FontAwesome6
            name={item.icon}
            size={73}
            color={isActive ? 'white' : '#8E8E93'}
          />
        ) : (
          <Ionicons
            name={item.icon}
            size={85}
            color={isActive ? 'white' : '#8E8E93'}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.containerWithWhiteSpace}>
      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          {/* Calendar header */}
          <WeekdayBar />
          
          <Text style={styles.title}>How're you feeling today?</Text>

          {/* Either show scrollable mood selector or the selected mood */}
          <View style={styles.moodSelectorContainer}>
            {moodSubmitted ? (
              // Show only the selected mood after submission
              <View style={styles.selectedMoodContainer}>
                {selectedMood.iconType === 'fontawesome6' ? (
                  <FontAwesome6
                    name={selectedMood.icon}
                    size={100}
                    color="white"
                  />
                ) : (
                  <Ionicons
                    name={selectedMood.icon}
                    size={100}
                    color="white"
                  />
                )}
              </View>
            ) : (
              // Show scrollable mood selector
              <LinearGradient
                colors={[
                  'rgba(10, 43, 82, 0.41)', 
                  'rgba(43, 58, 76, 0.41)', 
                  'rgba(217, 217, 217, 0.41)', 
                  'rgba(42, 44, 46, 0.41)', 
                  'rgba(10, 43, 82, 0.41)'
                ]}
                locations={[0, 0.101, 0.4567, 0.899, 0.976]}
                style={styles.moodScrollGradient}
              >
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.moodScroll}
                  snapToInterval={moodItemHeight}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onScroll={handleMoodScroll}
                  scrollEventThrottle={16}
                >
                  {/* Add empty space at top for better scrolling experience */}
                  <View style={{ height: moodItemHeight }} />
                  
                  {/* Render mood options */}
                  {moodOptions.map((item, index) => renderMoodItem(item, index))}
                  
                  {/* Add empty space at bottom */}
                  <View style={{ height: moodItemHeight }} />
                </ScrollView>
              </LinearGradient>
            )}
          </View>
          
          {/* Enter button or placeholder space */}
          <View style={styles.buttonContainer}>
            {!moodSubmitted ? (
              <TouchableOpacity 
                style={styles.enterButton}
                onPress={handleSubmit}
              >
                <Text style={styles.enterButtonText}>Enter</Text>
              </TouchableOpacity>
            ) : (
              // Empty view to maintain spacing
              <View style={styles.buttonPlaceholder} />
            )}
          </View>
          
          {/* Mood graph */}
          <MoodGraph />
        </View>
      </View>

      <Navbar ref={navbarRef} activeScreen="WeeklyForm" opacityValue={navOpacity} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerWithWhiteSpace: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#081A2F',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    marginBottom: 270,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 30,
  },
  // Calendar styles from ReportScreen
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginTop: 15,
    marginBottom: 20,
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
    backgroundColor: '#878787',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 20,
    textAlign: 'center',
  },
  // 3D scroll for moods
  moodSelectorContainer: {
    height: 220,
    width: '55%',
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodScrollGradient: {
    height: '100%',
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  moodScroll: {
    width: '100%',
  },
  moodItem: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  // Selected mood after submission
  selectedMoodContainer: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#081A2F',
  },
  buttonContainer: {
    height: 60, // Fixed height to maintain consistent spacing
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  buttonPlaceholder: {
    height: 45, // Approximately the height of the button
    marginVertical: 10,
  },
  enterButton: {
    backgroundColor: '#C7312B',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  enterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Graph styles
  graphContainer: {
    width: '90%',
    marginTop: 80,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
  },
  graphContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingVertical: 10,
  },
  graphItem: {
    alignItems: 'center',
  },
  moodDot: {
    borderRadius: 50,
    backgroundColor: '#C7312B',
    marginBottom: 8,
  },
  graphDayText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MoodScreen;