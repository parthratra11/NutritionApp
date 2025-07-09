import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import WeekCalendar from '../components/WeekCalendar'; // Import the WeekCalendar component
import { getCurrentWeekDates } from '../utils/dateUtils'; // Import the date utility

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper functions for unit conversion
const kgToLbs = (kg) => {
  return Math.round(kg * 2.20462);
};

const lbsToKg = (lbs) => {
  return Math.round(lbs / 2.20462);
};

const WeightScreen = ({ navigation }) => {
  const [weight, setWeight] = useState(53);
  const [weightUnit, setWeightUnit] = useState('Kgs'); // 'Kgs' or 'Lbs'
  const [weightHistory, setWeightHistory] = useState([]);
  const navbarRef = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;

  // For graph data
  const [chartData, setChartData] = useState({
    labels: ['S', 'M', 'T', 'W', 'Th', 'F', 'S'],
    datasets: [
      {
        data: [76, 75, 77, 78, 76, 75, 77],
      },
    ],
  });

  // Get the week dates using our utility function
  const weekDates = getCurrentWeekDates();

  // Handle date selection
  const handleDateSelect = (selectedDate) => {
    console.log('Selected date:', selectedDate.full);
    // You can add your logic here to update data based on the selected date
  };

  useEffect(() => {
    loadWeightHistory();
  }, []);

  const loadWeightHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('weightHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setWeightHistory(parsedHistory);

        // Update chart with recent weights if available
        if (parsedHistory.length > 0) {
          const recentWeights = parsedHistory
            .slice(0, 7)
            .map((entry) => entry.weight)
            .reverse();

          // Ensure we have 7 data points for the chart
          while (recentWeights.length < 7) {
            recentWeights.push(parsedHistory[0]?.weight || 0);
          }

          setChartData({
            labels: ['S', 'M', 'T', 'W', 'Th', 'F', 'S'],
            datasets: [{ data: recentWeights }],
          });
        }
      }
    } catch (error) {
      console.error('Failed to load weight history:', error);
    }
  };

  const saveWeight = async () => {
    try {
      const newEntry = {
        id: Date.now().toString(),
        weight: weight,
        unit: weightUnit,
        date: new Date().toISOString(),
      };

      const updatedHistory = [newEntry, ...weightHistory];
      setWeightHistory(updatedHistory);
      await AsyncStorage.setItem('weightHistory', JSON.stringify(updatedHistory));

      // Update chart data
      const recentWeights = updatedHistory
        .slice(0, 7)
        .map((entry) => entry.weight)
        .reverse();

      while (recentWeights.length < 7) {
        recentWeights.push(updatedHistory[0]?.weight || 0);
      }

      setChartData({
        labels: ['S', 'M', 'T', 'W', 'Th', 'F', 'S'],
        datasets: [{ data: recentWeights }],
      });
    } catch (error) {
      console.error('Failed to save weight:', error);
    }
  };

  const incrementWeight = () => {
    setWeight((prev) => prev + 1);
  };

  const decrementWeight = () => {
    setWeight((prev) => Math.max(prev - 1, 0));
  };

  // Add this function to handle unit change with conversion
  const handleUnitChange = (newUnit) => {
    if (newUnit === weightUnit) return; // No change needed

    if (newUnit === 'Lbs') {
      // Convert kg to lbs
      setWeight(kgToLbs(weight));
    } else {
      // Convert lbs to kg
      setWeight(lbsToKg(weight));
    }

    setWeightUnit(newUnit);
  };

  return (
    <SafeAreaView style={styles.containerWithWhiteSpace}>
      <View style={styles.contentWrapper}>
        <View style={styles.blueHeader}>
          <Text style={styles.headerTitle}>Weight</Text>

          {/* Use the reusable WeekCalendar component */}
          <WeekCalendar
            weekDates={weekDates}
            onDatePress={handleDateSelect}
            containerStyle={styles.calendarContainerStyle}
          />
        </View>

        <View style={styles.whiteContent}>
          {/* Unit selector buttons */}
          <View style={styles.unitSelectorContainer}>
            <TouchableOpacity
              style={[styles.unitButton, weightUnit === 'Kgs' && styles.activeUnitButton]}
              onPress={() => handleUnitChange('Kgs')}>
              <Text style={[styles.unitButtonText, weightUnit === 'Kgs' && styles.activeUnitText]}>
                Kgs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, weightUnit === 'Lbs' && styles.activeUnitButton]}
              onPress={() => handleUnitChange('Lbs')}>
              <Text style={[styles.unitButtonText, weightUnit === 'Lbs' && styles.activeUnitText]}>
                Lbs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Weight selector wheel */}
          <View style={styles.weightSelectorContainer}>
            <TouchableOpacity style={styles.weightControlButton} onPress={decrementWeight}>
              <Feather name="minus" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.weightDisplayContainer}>
              <Text style={styles.weightValue}>{weight}</Text>
              <Text style={styles.weightUnit}>{weightUnit === 'Kgs' ? 'kg' : 'lb'}</Text>

              {/* Save button inside the weight selector */}
              <TouchableOpacity style={styles.saveButton} onPress={saveWeight}>
                <Feather name="chevron-right" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.weightControlButton} onPress={incrementWeight}>
              <Feather name="plus" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Frequency selector */}
          <View style={styles.frequencySelector}>
            <TouchableOpacity style={[styles.frequencyOption, styles.activeFrequency]}>
              <Text style={[styles.frequencyText, styles.activeFrequencyText]}>D</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.frequencyOption}>
              <Text style={styles.frequencyText}>W</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.frequencyOption}>
              <Text style={styles.frequencyText}>M</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.frequencyOption}>
              <Text style={styles.frequencyText}>6M</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.frequencyOption}>
              <Text style={styles.frequencyText}>Y</Text>
            </TouchableOpacity>
          </View>

          {/* Weight chart */}
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={screenWidth - 20}
              height={120}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'white',
                backgroundGradientTo: 'white',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(199, 49, 43, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '2',
                  strokeWidth: '2',
                  stroke: '#C7312B',
                },
                fillShadowGradient: '#C7312B',
                fillShadowGradientOpacity: 0.3,
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withShadow={false}
              withScrollableDot={false}
            />
          </View>
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
    marginBottom: 80, // Space for navbar
  },
  blueHeader: {
    backgroundColor: '#081A2F',
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 46,
    borderBottomRightRadius: 46,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  // Add custom style for the calendar container in this screen
  calendarContainerStyle: {
    width: '100%',
    marginTop: 10,
  },
  whiteContent: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  unitSelectorContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
    padding: 5,
    width: 180,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeUnitButton: {
    backgroundColor: '#0E2240',
  },
  unitButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  activeUnitText: {
    color: 'white',
  },
  weightSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    width: 242,
    height: 242,
    borderRadius: 120,
  },
  weightControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 23,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  weightDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '110%',
    position: 'relative', // To position the save button absolutely
  },
  weightValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0E2240',
    marginBottom: 1,
  },
  weightUnit: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2, // Add space for the button below
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C7312B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30, // Position from bottom
  },
  frequencySelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 4,
    marginBottom: 10,
    width: '90%',
    marginTop: 17,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeFrequency: {
    backgroundColor: '#C7312B',
  },
  frequencyText: {
    color: '#666',
    fontWeight: 'bold',
  },
  activeFrequencyText: {
    color: 'white',
  },
  chartContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingHorizontal: 0, // Remove any horizontal padding
  },
  chart: {
    borderRadius: 16,
    width: '120%', // Ensure chart uses full width
    marginHorizontal: 0, // Remove horizontal margins
  },
});

export default WeightScreen;
