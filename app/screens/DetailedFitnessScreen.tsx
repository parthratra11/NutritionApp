import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Svg, { Circle, G, Path, Rect, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const TimeFilterButton = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.timeFilterButton, isActive ? styles.timeFilterButtonActive : null]}
    onPress={onPress}>
    <Text
      style={[styles.timeFilterButtonText, isActive ? styles.timeFilterButtonTextActive : null]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const WeeklyStepRings = () => {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const dayOfMonth = currentDate.getDate();

  // Generate array of 7 days starting from previous Sunday
  const days = [];
  const weekdays = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
  const dayNumbers = [];

  // Get day numbers (22-28 for example)
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    // Adjust to get day numbers from 22-28 for example
    date.setDate(dayOfMonth - dayOfWeek + i);
    dayNumbers.push(date.getDate());
  }

  // Sample progress data (percentages)
  const progressData = [0.7, 0.5, 0.8, 0.9, 0.6, 0.4, 0.3];

  // Today's index (0-6, where 0 is Sunday)
  const todayIndex = dayOfWeek;

  for (let i = 0; i < 7; i++) {
    const isToday = i === todayIndex;
    days.push({
      dayOfMonth: dayNumbers[i],
      weekday: weekdays[i],
      progress: progressData[i],
      isToday,
    });
  }

  return (
    <View style={styles.weeklyRingsContainer}>
      {days.map((day, index) => (
        <View key={index} style={styles.dayRingColumn}>
          <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>{day.dayOfMonth}</Text>
          <View style={styles.ringContainer}>
            <Svg width={36} height={36} viewBox="0 0 36 36">
              {/* Background Circle */}
              <Circle
                cx="18"
                cy="18"
                r="16"
                stroke={day.isToday ? 'rgba(255, 59, 48, 0.3)' : '#1D2740'}
                strokeWidth="3"
                fill={day.isToday ? '#FF3B30' : 'transparent'}
              />

              {/* Progress Circle */}
              {!day.isToday && (
                <Circle
                  cx="18"
                  cy="18"
                  r="16"
                  stroke="#FF3B30"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 16 * day.progress} ${2 * Math.PI * 16 * (1 - day.progress)}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  fill="transparent"
                  transform="rotate(-90, 18, 18)"
                />
              )}
            </Svg>
          </View>
          <Text style={[styles.dayLetter, day.isToday && styles.todayText]}>{day.weekday}</Text>
        </View>
      ))}
    </View>
  );
};

const BarChart = () => {
  // Sample data for the bar chart
  const barData = [6500, 5200, 7800, 9200, 8500, 9800, 5000];
  const maxValue = 10000; // Max step goal

  return (
    <View style={styles.barChartContainer}>
      {/* Y-axis ticks */}
      <View style={styles.yAxis}>
        <Text style={styles.axisLabel}>10k</Text>
        <Text style={styles.axisLabel}>5k</Text>
        <Text style={styles.axisLabel}>0</Text>
      </View>

      {/* Bars */}
      <View style={styles.barsContainer}>
        {barData.map((value, index) => {
          const isToday = index === new Date().getDay(); // Sunday is 0
          const barHeight = (value / maxValue) * 150; // 150 is the max height of our bar chart

          return (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.bar, { height: barHeight }, isToday ? styles.todayBar : null]} />
              <Text style={styles.barLabel}>{['S', 'M', 'T', 'W', 'Th', 'F', 'S'][index]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const DetailedFitnessScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTimeFilter, setActiveTimeFilter] = useState('D');
  const [steps, setSteps] = useState(5000);
  const stepGoal = 10000;
  const percentage = steps / stepGoal;

  // For the circular progress
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fitness Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Weekly Steps Ring Strip */}
      <WeeklyStepRings />

      {/* Large Circular Step Progress */}
      <View style={styles.circularProgressContainer}>
        <Svg
          height={radius * 2 + strokeWidth}
          width={radius * 2 + strokeWidth}
          viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}>
          {/* Background Circle */}
          <Circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="rgba(255, 59, 48, 0.2)"
            fill="transparent"
          />

          {/* Progress Circle */}
          <Circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="#C7312B"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90, ${radius + strokeWidth / 2}, ${radius + strokeWidth / 2})`}
          />
        </Svg>

        {/* Steps Counter */}
        <View style={styles.stepsTextContainer}>
          <Text style={styles.stepsText}>{steps.toLocaleString()} Steps</Text>
          <Text style={styles.stepsSubtext}>Out of {stepGoal.toLocaleString()} steps</Text>
        </View>
      </View>

      {/* Time Filter Tabs */}
      <View style={styles.timeFilterContainer}>
        {['D', 'W', 'M', '6M', 'Y'].map((filter) => (
          <TimeFilterButton
            key={filter}
            label={filter}
            isActive={filter === activeTimeFilter}
            onPress={() => setActiveTimeFilter(filter)}
          />
        ))}
      </View>

      {/* Bar Chart */}
      <BarChart />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081A2F', // Updated to match StepScreen dark blue
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24, // To balance the header
  },
  weeklyRingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dayRingColumn: {
    alignItems: 'center',
  },
  dayNumber: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  ringContainer: {
    marginVertical: 5,
  },
  dayLetter: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  todayText: {
    color: '#C7312B', // Updated to match StepScreen red
    fontWeight: 'bold',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  stepsTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  stepsText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stepsSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  timeFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: '#1D2740', // Updated to match StepScreen darker blue
  },
  timeFilterButtonActive: {
    backgroundColor: '#C7312B', // Updated to match StepScreen red
  },
  timeFilterButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  timeFilterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  yAxis: {
    width: 30,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 5,
    paddingVertical: 10,
  },
  axisLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 30,
  },
  bar: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
  },
  todayBar: {
    backgroundColor: '#C7312B', // Updated to match StepScreen red
  },
  barLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
});

export default DetailedFitnessScreen;
