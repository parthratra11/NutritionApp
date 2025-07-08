import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Fixed item height for all picker items
const ITEM_HEIGHT = 54;

const SleepScreen = ({ navigation }) => {
  // State for time selection
  const [sleepHour, setSleepHour] = useState(8);
  const [sleepMinute, setSleepMinute] = useState(30);
  const [sleepAmPm, setSleepAmPm] = useState('PM');
  
  const [wakeHour, setWakeHour] = useState(5);
  const [wakeMinute, setWakeMinute] = useState(30);
  const [wakeAmPm, setWakeAmPm] = useState('AM');

  // Refs for scroll positions
  const sleepHourRef = useRef(null);
  const sleepMinuteRef = useRef(null);
  const sleepAmPmRef = useRef(null);
  const wakeHourRef = useRef(null);
  const wakeMinuteRef = useRef(null);
  const wakeAmPmRef = useRef(null);

  // Navbar animation
  const navbarRef = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;

  // Get current date and week days
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayLetters = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const dates = [];
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push({
        day: dayLetters[date.getDay()],
        date: date.getDate().toString(),
        isToday: i === 0,
      });
    }
    
    return dates;
  };

  const weekDates = getCurrentWeekDates();

  // Generate hours, minutes and am/pm for pickers
  const generateHours = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const hour = i + 1;
      return { value: hour, label: hour.toString().padStart(2, '0') };
    });
  };

  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => {
      return { value: i, label: i.toString().padStart(2, '0') };
    });
  };

  const amPmOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ];

  const hours = generateHours();
  const minutes = generateMinutes();

  // Function to handle data submission
  const handleSubmit = async () => {
    try {
      const sleepData = {
        date: new Date().toISOString().split('T')[0],
        sleepTime: `${sleepHour}:${sleepMinute} ${sleepAmPm}`,
        wakeTime: `${wakeHour}:${wakeMinute} ${wakeAmPm}`,
      };
      
      // Get existing history
      const existingData = await AsyncStorage.getItem('sleepHistory');
      const sleepHistory = existingData ? JSON.parse(existingData) : [];
      
      // Add new entry
      sleepHistory.unshift(sleepData);
      
      // Save to storage
      await AsyncStorage.setItem('sleepHistory', JSON.stringify(sleepHistory));
      
      // Show success feedback
      // You could add some UI feedback here
    } catch (error) {
      console.error('Error saving sleep data:', error);
    }
  };

  // getItemLayout for all pickers - required for scrollToIndex
  const getItemLayout = (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  // Handle failed scroll attempts
  const handleScrollToIndexFailed = (info) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (info.averageItemLength) {
        const index = Math.min(
          info.highestMeasuredFrameIndex,
          Math.max(0, info.index)
        );
        info.viewRef.scrollToIndex({
          index,
          animated: false
        });
      }
    });
  };

  // Initialize scrolling positions
  useEffect(() => {
    const scrollToInitialPositions = () => {
      // Set timeout to ensure the FlatList is fully mounted
      setTimeout(() => {
        // Sleep time pickers
        if (sleepHourRef.current) {
          sleepHourRef.current.scrollToIndex({
            index: sleepHour - 1, // Hour is 1-12, but array is 0-indexed
            animated: false,
          });
        }
        
        if (sleepMinuteRef.current) {
          sleepMinuteRef.current.scrollToIndex({
            index: sleepMinute,
            animated: false,
          });
        }
        
        if (sleepAmPmRef.current) {
          sleepAmPmRef.current.scrollToIndex({
            index: sleepAmPm === 'AM' ? 0 : 1,
            animated: false,
          });
        }
        
        // Wake time pickers
        if (wakeHourRef.current) {
          wakeHourRef.current.scrollToIndex({
            index: wakeHour - 1, // Hour is 1-12, but array is 0-indexed
            animated: false,
          });
        }
        
        if (wakeMinuteRef.current) {
          wakeMinuteRef.current.scrollToIndex({
            index: wakeMinute,
            animated: false,
          });
        }
        
        if (wakeAmPmRef.current) {
          wakeAmPmRef.current.scrollToIndex({
            index: wakeAmPm === 'AM' ? 0 : 1,
            animated: false,
          });
        }
      }, 300); // Slightly longer timeout for reliability
    };
    
    scrollToInitialPositions();
  }, []);

  // Handle scroll end for each picker
  const handleScrollEndHour = (ref, setValue, data) => (info) => {
    const index = Math.round(info.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    if (index >= 0 && index < data.length) {
      setValue(data[index].value);
    }
  };

  const renderHourItem = ({ item }) => {
    return (
      <View style={styles.pickerItem}>
        <Text style={styles.pickerItemText}>{item.label}</Text>
      </View>
    );
  };

  const renderMinuteItem = ({ item }) => {
    return (
      <View style={styles.pickerItem}>
        <Text style={styles.pickerItemText}>{item.label}</Text>
      </View>
    );
  };

  const renderAmPmItem = ({ item }) => {
    return (
      <View style={styles.pickerItem}>
        <Text style={styles.pickerItemText}>{item.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.containerWithWhiteSpace}>
      <View style={styles.blueContent}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
        >
          <View style={styles.contentWrapper}>
            {/* Calendar row */}
            <View style={styles.calendarContainer}>
              {weekDates.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.dayContainer, item.isToday && styles.todayContainer]}
                >
                  <Text style={[styles.dayLetter, item.isToday && styles.todayText]}>
                    {item.day}
                  </Text>
                  <Text style={[styles.dayNumber, item.isToday && styles.todayText]}>
                    {item.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sleep time section */}
            <View style={styles.sleepSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="moon" size={24} color="white" />
                <Text style={styles.sectionTitle}>When did you sleep last night?</Text>
              </View>
              
              <View style={styles.timePickersRow}>
                {/* Hour picker */}
                <View style={styles.pickerOuterContainer}>
                  <LinearGradient
                    colors={[
                      'rgba(10, 43, 82, 0.41)',
                      'rgba(43, 58, 76, 0.41)',
                      'rgba(217, 217, 217, 0.41)',
                      'rgba(42, 44, 46, 0.41)',
                      'rgba(10, 43, 82, 0.41)'
                    ]}
                    locations={[0, 0.101, 0.4567, 0.899, 0.976]}
                    style={styles.pickerGradient}
                  >
                    <View style={styles.pickerHighlight} />
                    <FlatList
                      ref={sleepHourRef}
                      data={hours}
                      renderItem={renderHourItem}
                      keyExtractor={(item) => `sleep-hour-${item.value}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleScrollEndHour(sleepHourRef, setSleepHour, hours)}
                      contentContainerStyle={styles.pickerListContent}
                      ListHeaderComponent={<View style={styles.pickerSpacerHeader} />}
                      ListFooterComponent={<View style={styles.pickerSpacerFooter} />}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={handleScrollToIndexFailed}
                      nestedScrollEnabled
                    />
                  </LinearGradient>
                </View>
                
                {/* Minute picker */}
                <View style={styles.pickerOuterContainer}>
                  <LinearGradient
                    colors={[
                      'rgba(10, 43, 82, 0.41)',
                      'rgba(43, 58, 76, 0.41)',
                      'rgba(217, 217, 217, 0.41)',
                      'rgba(42, 44, 46, 0.41)',
                      'rgba(10, 43, 82, 0.41)'
                    ]}
                    locations={[0, 0.101, 0.4567, 0.899, 0.976]}
                    style={styles.pickerGradient}
                  >
                    <View style={styles.pickerHighlight} />
                    <FlatList
                      ref={sleepMinuteRef}
                      data={minutes}
                      renderItem={renderMinuteItem}
                      keyExtractor={(item) => `sleep-minute-${item.value}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleScrollEndHour(sleepMinuteRef, setSleepMinute, minutes)}
                      contentContainerStyle={styles.pickerListContent}
                      ListHeaderComponent={<View style={styles.pickerSpacerHeader} />}
                      ListFooterComponent={<View style={styles.pickerSpacerFooter} />}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={handleScrollToIndexFailed}
                      nestedScrollEnabled
                    />
                  </LinearGradient>
                </View>
                
                {/* AM/PM picker */}
                <View style={styles.pickerOuterContainer}>
                  <LinearGradient
                    colors={[
                      'rgba(10, 43, 82, 0.41)',
                      'rgba(43, 58, 76, 0.41)',
                      'rgba(217, 217, 217, 0.41)',
                      'rgba(42, 44, 46, 0.41)',
                      'rgba(10, 43, 82, 0.41)'
                    ]}
                    locations={[0, 0.101, 0.4567, 0.899, 0.976]}
                    style={styles.pickerGradient}
                  >
                    <View style={styles.pickerHighlight} />
                    <FlatList
                      ref={sleepAmPmRef}
                      data={amPmOptions}
                      renderItem={renderAmPmItem}
                      keyExtractor={(item) => `sleep-ampm-${item.value}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleScrollEndHour(sleepAmPmRef, setSleepAmPm, amPmOptions)}
                      contentContainerStyle={styles.pickerListContent}
                      ListHeaderComponent={<View style={styles.pickerSpacerHeader} />}
                      ListFooterComponent={<View style={styles.pickerSpacerFooter} />}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={handleScrollToIndexFailed}
                      nestedScrollEnabled
                    />
                  </LinearGradient>
                </View>
              </View>
            </View>
            
            {/* Wake up time section */}
            <View style={styles.wakeSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sunny" size={24} color="white" />
                <Text style={styles.sectionTitle}>When did wake up this morning?</Text>
              </View>
              
              <View style={styles.timePickersRow}>
                {/* Hour picker */}
                <View style={styles.pickerOuterContainer}>
                  <LinearGradient
                    colors={[
                      'rgba(10, 43, 82, 0.41)',
                      'rgba(43, 58, 76, 0.41)',
                      'rgba(217, 217, 217, 0.41)',
                      'rgba(42, 44, 46, 0.41)',
                      'rgba(10, 43, 82, 0.41)'
                    ]}
                    locations={[0, 0.101, 0.4567, 0.899, 0.976]}
                    style={styles.pickerGradient}
                  >
                    <View style={styles.pickerHighlight} />
                    <FlatList
                      ref={wakeHourRef}
                      data={hours}
                      renderItem={renderHourItem}
                      keyExtractor={(item) => `wake-hour-${item.value}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleScrollEndHour(wakeHourRef, setWakeHour, hours)}
                      contentContainerStyle={styles.pickerListContent}
                      ListHeaderComponent={<View style={styles.pickerSpacerHeader} />}
                      ListFooterComponent={<View style={styles.pickerSpacerFooter} />}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={handleScrollToIndexFailed}
                      nestedScrollEnabled
                    />
                  </LinearGradient>
                </View>
                
                {/* Minute picker */}
                <View style={styles.pickerOuterContainer}>
                  <LinearGradient
                    colors={[
                      'rgba(10, 43, 82, 0.41)',
                      'rgba(43, 58, 76, 0.41)',
                      'rgba(217, 217, 217, 0.41)',
                      'rgba(42, 44, 46, 0.41)',
                      'rgba(10, 43, 82, 0.41)'
                    ]}
                    locations={[0, 0.101, 0.4567, 0.899, 0.976]}
                    style={styles.pickerGradient}
                  >
                    <View style={styles.pickerHighlight} />
                    <FlatList
                      ref={wakeMinuteRef}
                      data={minutes}
                      renderItem={renderMinuteItem}
                      keyExtractor={(item) => `wake-minute-${item.value}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleScrollEndHour(wakeMinuteRef, setWakeMinute, minutes)}
                      contentContainerStyle={styles.pickerListContent}
                      ListHeaderComponent={<View style={styles.pickerSpacerHeader} />}
                      ListFooterComponent={<View style={styles.pickerSpacerFooter} />}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={handleScrollToIndexFailed}
                      nestedScrollEnabled
                    />
                  </LinearGradient>
                </View>
                
                {/* AM/PM picker */}
                <View style={styles.pickerOuterContainer}>
                  <LinearGradient
                    colors={[
                      'rgba(10, 43, 82, 0.41)',
                      'rgba(43, 58, 76, 0.41)',
                      'rgba(217, 217, 217, 0.41)',
                      'rgba(42, 44, 46, 0.41)',
                      'rgba(10, 43, 82, 0.41)'
                    ]}
                    locations={[0, 0.101, 0.4567, 0.899, 0.976]}
                    style={styles.pickerGradient}
                  >
                    <View style={styles.pickerHighlight} />
                    <FlatList
                      ref={wakeAmPmRef}
                      data={amPmOptions}
                      renderItem={renderAmPmItem}
                      keyExtractor={(item) => `wake-ampm-${item.value}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleScrollEndHour(wakeAmPmRef, setWakeAmPm, amPmOptions)}
                      contentContainerStyle={styles.pickerListContent}
                      ListHeaderComponent={<View style={styles.pickerSpacerHeader} />}
                      ListFooterComponent={<View style={styles.pickerSpacerFooter} />}
                      getItemLayout={getItemLayout}
                      onScrollToIndexFailed={handleScrollToIndexFailed}
                      nestedScrollEnabled
                    />
                  </LinearGradient>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Enter button placed at the bottom of the blue section */}
        <TouchableOpacity style={styles.enterButton} onPress={handleSubmit}>
          <Text style={styles.enterButtonText}>Enter</Text>
        </TouchableOpacity>
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
  blueContent: {
    flex: 1,
    backgroundColor: '#081A2F',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    marginBottom: 120, // Create white space above the navbar
    overflow: 'hidden',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80, // Space for enter button
    alignItems: 'center',
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
    marginBottom: 40,
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
  sleepSection: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  wakeSection: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  timePickersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pickerOuterContainer: {
    width: 80,
    height: 162, // 3 items visible (54px each)
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  pickerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative', // For highlight positioning
  },
  pickerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '35%',  // Position to highlight the middle item
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1,
  },
  pickerListContent: {
    paddingTop: 0,
  },
  pickerSpacerHeader: {
    height: ITEM_HEIGHT,
  },
  pickerSpacerFooter: {
    height: ITEM_HEIGHT,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pickerItemText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  enterButton: {
    backgroundColor: '#C7312B',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 35,
    alignSelf: 'center',
    marginBottom: 20,
    width: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  enterButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SleepScreen;