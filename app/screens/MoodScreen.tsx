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
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Navbar from '../components/navbar';
import { LinearGradient } from 'expo-linear-gradient';
import WeekCalendar from '../components/WeekCalendar'; 
import { getCurrentWeekDates } from '../utils/dateUtils'; 
import { useAuth } from '../context/AuthContext'; // Import Auth context
import { db } from '../firebaseConfig'; // Import Firebase config
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Import Firestore functions

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define mood options with more visual properties
const moodOptions = [
  { id: 1, name: 'Sad', icon: 'sad-outline', iconType: 'ionicon', value: 1, color: '#607D8B' },
  { id: 2, name: 'Neutral', icon: 'face-meh', iconType: 'fontawesome6', value: 2, color: '#8E8E93' },
  { id: 3, name: 'Happy', icon: 'happy-outline', iconType: 'ionicon', value: 3, color: '#C7312B' },
];

// Helper to get the week and day for storing data
const getWeekAndDay = () => {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    day: dayNames[now.getDay()],
    date: now.toISOString().slice(0, 10) // YYYY-MM-DD format
  };
};

// Helper to calculate week number from first entry date
const getWeekNumber = (currentDate, firstEntryDate) => {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const firstDate = new Date(firstEntryDate);
  const diffTime = Math.abs(currentDate.getTime() - firstDate.getTime());
  const diffWeeks = Math.floor(diffTime / msPerWeek);
  return diffWeeks + 1; // Week numbers are 1-based
};

// Mood graph showing mood history
const MoodGraph = ({ moodHistory }) => {
  // Create data for the mood graph from the history
  const moodData = [
    { day: 'Mon', value: 0, size: 0 },
    { day: 'Tue', value: 0, size: 0 },
    { day: 'Wed', value: 0, size: 0 },
    { day: 'Thu', value: 0, size: 0 },
    { day: 'Fri', value: 0, size: 0 },
    { day: 'Sat', value: 0, size: 0 },
    { day: 'Sun', value: 0, size: 0 },
  ];

  // If there's history data, update the moodData
  if (moodHistory && moodHistory.length > 0) {
    // Sort by date (newest first) and take the last 7 days
    const sortedHistory = [...moodHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);

    // Update mood data for each entry
    sortedHistory.forEach(entry => {
      const date = new Date(entry.date);
      const dayIndex = date.getDay();
      const dayName = moodData[dayIndex].day;
      
      // Calculate dot size based on mood value (1-3)
      const value = entry.mood.value;
      const size = value * 7 + 8; // Scale factor for visualization
      
      moodData[dayIndex] = {
        day: dayName,
        value: value,
        size: size
      };
    });
  }

  return (
    <View style={styles.graphContainer}>
      <View style={styles.graphContent}>
        {moodData.map((item, index) => (
          <View key={index} style={styles.graphItem}>
            <View 
              style={[
                styles.moodDot, 
                { 
                  width: item.size > 0 ? item.size : 0, 
                  height: item.size > 0 ? item.size : 0,
                  backgroundColor: item.value > 2 ? '#C7312B' : '#607D8B',
                  opacity: item.size > 0 ? 0.8 : 0,
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
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);
  const [firstEntryDate, setFirstEntryDate] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navbarRef = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);
  const moodItemHeight = 120; // Height of each mood item
  const { user } = useAuth(); // Use auth context

  // Get the week dates using our utility function
  const weekDates = getCurrentWeekDates();
  
  // Handle date selection
  const handleDateSelect = (selectedDate) => {
    console.log('Selected date:', selectedDate.full);
    // You can add your logic here to update data based on the selected date
  };

  // Check if already submitted for today
  useEffect(() => {
    const checkIfSubmitted = async () => {
      if (!user?.email) return;
      
      try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
        const moodRef = doc(db, 'moods', user.email.toLowerCase());
        const moodSnap = await getDoc(moodRef);
        
        if (moodSnap.exists()) {
          const data = moodSnap.data();
          const history = data.history || [];
          setMoodHistory(history);
          
          // Check if there's an entry for today
          const todayEntry = history.find(entry => 
            entry.date.slice(0, 10) === today
          );
          
          if (todayEntry) {
            setAlreadySubmittedToday(true);
            setSelectedMood(moodOptions.find(m => m.value === todayEntry.mood.value) || moodOptions[1]);
            setMoodSubmitted(true);
          } else {
            setAlreadySubmittedToday(false);
            setMoodSubmitted(false);
          }
          
          // Set firstEntryDate if it exists
          if (data.firstEntryDate) {
            setFirstEntryDate(data.firstEntryDate);
          }
        } else {
          setAlreadySubmittedToday(false);
          setMoodSubmitted(false);
          setMoodHistory([]);
        }
      } catch (error) {
        console.error('Error checking submission status:', error);
      }
    };
    
    checkIfSubmitted();
  }, [user?.email]);

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
    
    // Calculate which mood is centered based on the middle of the viewport
    const viewportCenter = offsetY + (220 / 2); // 220 is the container height
    const index = Math.floor(viewportCenter / moodItemHeight) - 1; // Subtract 1 for the empty space at top
    
    const moodIndex = Math.max(0, Math.min(moodOptions.length - 1, index));
    setSelectedMood(moodOptions[moodIndex]);
  };

  // Helper to get color tag for a mood value
  const getMoodColorTag = (value) => {
    if (value <= 1) return 'red';
    if (value === 2) return 'amber';
    if (value >= 3) return 'green';
    return null;
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      setModalMessage('Please log in to save your mood.');
      setShowErrorModal(true);
      return;
    }
    
    if (alreadySubmittedToday) {
      setModalMessage('You have already submitted your mood for today.');
      setShowErrorModal(true);
      return;
    }
    
    try {
      // Set the mood as submitted to trigger UI change
      setMoodSubmitted(true);
      
      const now = new Date();
      const today = now.toISOString();
      const { day } = getWeekAndDay();
      
      // Create a new mood entry with color tag
      const moodColorTag = getMoodColorTag(selectedMood.value);
      const newMoodEntry = {
        mood: selectedMood,
        date: today,
        day: day,
        timestamp: now.getTime(),
        colorTag: moodColorTag
      };
      
      // === SAVE TO WEEKLY FORMS COLLECTION ===
      const weeklyFormRef = doc(db, 'weeklyForms', user.email.toLowerCase());
      const weeklyFormSnap = await getDoc(weeklyFormRef);
      
      let data = {};
      let entryDate = firstEntryDate;
      
      if (weeklyFormSnap.exists()) {
        data = weeklyFormSnap.data();
        
        // If this is the first entry ever, set firstEntryDate
        if (!data.firstEntryDate) {
          entryDate = today.slice(0, 10);
          data.firstEntryDate = entryDate;
          setFirstEntryDate(entryDate);
        } else {
          entryDate = data.firstEntryDate;
        }
        
        // Calculate which week this entry belongs to
        const weekNum = getWeekNumber(now, entryDate);
        const weekKey = `week${weekNum}`;
        
        // Prepare the update object - match the format in your image
        let update = {
          ...data,
          [weekKey]: {
            ...(data[weekKey] || {}),
            [day]: {
              ...(data[weekKey]?.[day] || {}),
              Mood: {
                value: selectedMood.value,
                color: moodColorTag
              }
            }
          },
          firstEntryDate: entryDate,
        };
        
        // Save to Firestore
        await setDoc(weeklyFormRef, update, { merge: true });
        
        // === ALSO SAVE TO MOODS COLLECTION (for history graph) ===
        // Get existing history or create a new array for the moods collection
        const moodRef = doc(db, 'moods', user.email.toLowerCase());
        const moodSnap = await getDoc(moodRef);
        
        if (moodSnap.exists()) {
          const moodData = moodSnap.data();
          const history = moodData.history || [];
          history.unshift(newMoodEntry);
          
          await setDoc(moodRef, {
            ...moodData,
            history: history,
            firstEntryDate: entryDate
          }, { merge: true });
          
          setMoodHistory(history);
        } else {
          // First entry for moods collection
          const history = [newMoodEntry];
          await setDoc(moodRef, {
            history: history,
            firstEntryDate: entryDate
          });
          
          setMoodHistory(history);
        }
        
      } else {
        // First ever entry for this user in weeklyForms
        entryDate = today.slice(0, 10);
        
        // Create new data object for weeklyForms - match the format in your image
        const newData = {
          firstEntryDate: entryDate,
          week1: {
            [day]: {
              Mood: {
                value: selectedMood.value,
                color: moodColorTag
              }
            }
          }
        };
        
        // Save to Firestore weeklyForms
        await setDoc(weeklyFormRef, newData);
        
        // Also save to moods collection for history tracking
        const history = [newMoodEntry];
        await setDoc(doc(db, 'moods', user.email.toLowerCase()), {
          history: history,
          firstEntryDate: entryDate
        });
        
        setFirstEntryDate(entryDate);
        setMoodHistory(history);
      }
      
      setAlreadySubmittedToday(true);
      
      // Show success modal instead of Alert
      setModalMessage('Your mood has been saved!');
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error saving mood:', error);
      setModalMessage('Failed to save your mood. Please try again.');
      setShowErrorModal(true);
      setMoodSubmitted(false);
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
          {/* Replace WeekdayBar with the reusable WeekCalendar component */}
          <WeekCalendar 
            weekDates={weekDates}
            onDatePress={handleDateSelect}
            containerStyle={styles.calendarContainerStyle}
          />
          
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
              // Show status message when already submitted
              <Text style={styles.submittedText}>
                {alreadySubmittedToday ? 'Mood submitted for today' : ''}
              </Text>
            )}
          </View>
          
          {/* Mood graph with actual data from Firebase */}
          <MoodGraph moodHistory={moodHistory} />
        </View>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#081A2F', '#0D2A4C', '#195295']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.modalTitle}>Success</Text>
            </LinearGradient>
            
            <View style={styles.modalBody}>
              <View style={styles.iconContainer}>
                {selectedMood && selectedMood.iconType === 'fontawesome6' ? (
                  <FontAwesome6 name={selectedMood.icon} size={48} color="#2EB67D" />
                ) : selectedMood && (
                  <Ionicons name={selectedMood.icon} size={48} color="#2EB67D" />
                )}
              </View>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#081A2F', '#0D2A4C', '#195295']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.modalTitle}>Error</Text>
            </LinearGradient>
            
            <View style={styles.modalBody}>
              <View style={styles.iconContainer}>
                <Ionicons name="alert-circle" size={48} color="#C7312B" />
              </View>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  // Add custom style for the calendar container in this screen
  calendarContainerStyle: {
    width: '90%',
    marginTop: 15,
    marginBottom: 20,
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
    paddingVertical: 10,
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
  submittedText: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 20,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#C7312B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    minWidth: 120,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MoodScreen;