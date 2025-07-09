import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import WeekCalendar from '../components/WeekCalendar';
import { getCurrentWeekDates } from '../utils/dateUtils';

// Import assets
const UserImage = require('../assets/User.png');
const HomeIcon = require('../assets/home.png');
const ChatIcon = require('../assets/chat.png');
const AddIcon = require('../assets/add.png');
const WorkoutIcon = require('../assets/workout.png');
const NutritionIcon = require('../assets/nutrition.png');
const NavRectangle = require('../assets/NavRectangle.png');

export default function ReportScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;
  const navbarRef = useRef(null); // Add this ref to control the navbar
  const screenWidth = Dimensions.get('window').width;
  // Sample data for demonstration
  const [stepsData] = useState([9000, 8200, 8600, 9100, 9500, 9800, 8700]);
  const [weightData] = useState([74.8, 74.3, 75.1, 76.5, 76.2, 75.8, 74.9]);
  const [sleepData] = useState({
    deep: 45,
    light: 32,
    awake: 28,
    quality: 87,
  });
  const [hungerData] = useState([5, 3, 4, 4, 5, 8, 6]);
  const [moodData] = useState([2, 1, 3, 4, 5, 7, 6]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        // Fetch weekly data
        const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setWeeklyData(userDocSnap.data());
        }

        // Fetch user's full name from intakeForms
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
  }, [user?.email]);

  // Replace the getCurrentWeekDates function with the import
  const weekDates = getCurrentWeekDates();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // Handle date selection
  const handleDateSelect = (selectedDate) => {
    console.log('Selected date:', selectedDate.full);
    // You can add your logic here to update data based on the selected date
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerSubTitle}>Keep Moving Today!</Text>
          <Text style={styles.headerTitle}>Hi, {userFullName || 'Aria'}!</Text>
          <Text style={styles.dateText}>{`${currentMonth}, ${currentYear}`}</Text>
        </View>

        {/* Make the user avatar clickable */}
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={UserImage} style={styles.userAvatar} />
        </TouchableOpacity>
      </View>

      {/* Use the new WeekCalendar component */}
      <WeekCalendar weekDates={weekDates} onDatePress={handleDateSelect} />
    </View>
  );

  const renderWeightChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="scale-bathroom" size={20} color="#333" />
          <Text style={styles.cardTitle}>Weight</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      <LineChart
        data={{
          labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
          datasets: [
            {
              data: weightData,
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 3,
            },
          ],
        }}
        width={screenWidth - 60}
        height={80}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
          propsForDots: {
            r: '5',
            strokeWidth: '0',
            fill: '#ff6384',
          },
          propsForBackgroundLines: {
            strokeWidth: 1,
            strokeDasharray: null,
            stroke: '#f0f0f0',
          },
          propsForLabels: {
            fontSize: 12,
          },
          fillShadowGradient: 'rgba(255, 99, 132, 0.2)',
          fillShadowGradientOpacity: 0.6,
          style: {
            borderRadius: 16,
          },
          yAxisSuffix: 'kg',
          yAxisMin: 73,
          yAxisMax: 77,
        }}
        bezier
        style={styles.chart}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        fromZero={false}
        yAxisInterval={1}
      />
    </View>
  );

  const renderStepsChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="run" size={20} color="#333" />
          <Text style={styles.cardTitle}>Steps</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      <Text style={styles.currentValue}>9,800</Text>
      <BarChart
        data={{
          labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
          datasets: [
            {
              data: stepsData,
              colors: [
                (opacity = 1) => `rgba(120, 120, 120, ${opacity})`,
                (opacity = 1) => `rgba(130, 130, 130, ${opacity})`,
                (opacity = 1) => `rgba(140, 140, 140, ${opacity})`,
                (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
                (opacity = 1) => `rgba(160, 160, 160, ${opacity})`,
                (opacity = 1) => `rgba(170, 170, 170, ${opacity})`,
                (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Saturday in red
              ],
            },
          ],
        }}
        width={screenWidth - 60}
        height={80}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1, index) => {
            // Custom colors for each bar
            const colors = [
              `rgba(120, 120, 120, ${opacity})`,
              `rgba(130, 130, 130, ${opacity})`,
              `rgba(140, 140, 140, ${opacity})`,
              `rgba(150, 150, 150, ${opacity})`,
              `rgba(160, 160, 160, ${opacity})`,
              `rgba(170, 170, 170, ${opacity})`,
              `rgba(255, 99, 132, ${opacity})`, // Saturday in red
            ];
            return colors[index] || colors[0];
          },
          labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
          barPercentage: 0.7,
          barRadius: 8,
          propsForLabels: {
            fontSize: 8,
          },
        }}
        style={styles.chart}
        withInnerLines={false}
        withHorizontalLines={true}
        withVerticalLines={false}
        fromZero
        showBarTops={false}
        flatColor={true}
        withCustomBarColors={true}
        yAxisSuffix=""
      />
    </View>
  );

  const renderHungerChart = () => (
    <View style={[styles.cardContainer, styles.halfCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="food-fork-drink" size={20} color="#333" />
          <Text style={styles.cardTitle}>Hunger</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      <LineChart
        data={{
          labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
          datasets: [
            {
              data: hungerData,
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 3,
            },
          ],
        }}
        width={(screenWidth - 80) / 2}
        height={120}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(102, 102, 102, 0.5)`,
          propsForDots: {
            r: '3',
            strokeWidth: '0',
            fill: '#ff6384',
          },
          propsForBackgroundLines: {
            strokeWidth: 1,
            strokeDasharray: null,
            stroke: '#f0f0f0',
          },
          propsForLabels: {
            fontSize: 8,
          },
          fillShadowGradient: 'rgba(255, 99, 132, 0.2)',
          fillShadowGradientOpacity: 0.5,
          style: {
            borderRadius: 16,
          },
          yAxisMin: 0,
          yAxisMax: 10,
        }}
        bezier
        style={styles.smallChart}
        withVerticalLabels={false}
        withHorizontalLabels={true}
        withInnerLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
    </View>
  );

  const renderSleepChart = () => (
    <View style={[styles.cardContainer, styles.halfCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="sleep" size={20} color="#333" />
          <Text style={styles.cardTitle}>Sleep</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.sleepContainer}>
        <View style={styles.sleepLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff6384' }]} />
            <Text style={styles.legendText}>Deep - {sleepData.deep}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff8c9e' }]} />
            <Text style={styles.legendText}>Light - {sleepData.light}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ffb6c1' }]} />
            <Text style={styles.legendText}>Awake - {sleepData.awake}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Quality - {sleepData.quality}%</Text>
          </View>
        </View>

        <View style={styles.donutContainer}>
          {/* Render concentric circles to represent sleep data */}
          <View style={styles.donutRings}>
            <View style={[styles.donutRing, styles.deepSleepRing]} />
            <View style={[styles.donutRing, styles.lightSleepRing]} />
            <View style={[styles.donutRing, styles.awakeSleepRing]} />
            <View
              style={[
                styles.donutRing,
                styles.qualitySleepRing,
                { width: 30, height: 30, borderRadius: 15 },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderMoodChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="brain" size={20} color="#333" />
          <Text style={styles.cardTitle}>Moods</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.moodDotsContainer}>
        {moodData.map((mood, index) => {
          const size = mood * 5 + 10;
          const opacity = 0.7 + mood * 0.04;
          return (
            <View key={index} style={styles.moodDotWrapper}>
              <View
                style={[
                  styles.moodDotLarge,
                  {
                    width: size,
                    height: size,
                    backgroundColor: `rgba(255, ${99 - mood * 10}, ${132 - mood * 8}, ${opacity})`,
                  },
                ]}
              />
              <Text style={styles.moodDayLabel}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // Update handleScroll to use the navbarRef methods
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Update the return statement to fix the SafeAreaView issue
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#081A2F" translucent />

      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollViewContent}>
        {renderHeader()}

        <View style={styles.chartsContainer}>
          {renderWeightChart()}
          {renderStepsChart()}

          <View style={styles.rowContainer}>
            {renderHungerChart()}
            {renderSleepChart()}
          </View>

          {renderMoodChart()}
        </View>
      </ScrollView>

      {/* Pass the opacity value and ref to the navbar */}
      <Navbar ref={navbarRef} activeScreen="Home" opacityValue={navOpacity} />
    </View>
  );
}

// Update the styles to accommodate the new chart designs
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Match the header color
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 0, // Space for the navbar
  },
  headerContainer: {
    backgroundColor: '#081A2F',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    zIndex: 1,
    // Change overflow to 'hidden' to ensure the border radius is visible
    overflow: 'hidden',
    // Important for the border radius to show properly
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    marginTop: 5,
  },
  headerSubTitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 0,
    top: 15,
    borderColor: '#fff',
  },
  chartsContainer: {
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
    paddingHorizontal: 20,
    flex: 1,
    paddingBottom: 10,
    borderTopLeftRadius: 0, // Make sure there's no conflicting border radius
    borderTopRightRadius: 0,
    marginTop: 0, // Adjust to overlap with the header
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  halfCard: {
    flex: 1,
    marginRight: 10,
    marginLeft: 0,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  currentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -12,
    paddingRight: 30,
  },
  smallChart: {
    borderRadius: 8,
    marginLeft: -12,
    paddingRight: 30,
  },
  sleepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
  },
  sleepLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 8,
    color: '#666',
  },
  donutContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutRings: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
  },
  donutRing: {
    position: 'absolute',
    borderStyle: 'solid',
    borderWidth: 5,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deepSleepRing: {
    width: 80,
    height: 80,
    borderColor: '#ff6384',
  },
  lightSleepRing: {
    width: 60,
    height: 60,
    borderColor: '#ff8c9e',
  },
  awakeSleepRing: {
    width: 40,
    height: 40,
    borderColor: '#ffb6c1',
  },
  qualitySleepRing: {
    backgroundColor: '#4CAF50',
  },
  moodDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 10,
    height: 80,
  },
  moodDotWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 70,
  },
  moodDotLarge: {
    borderRadius: 50,
    marginBottom: 5,
  },
  moodDayLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
  },
  // These styles are only for the loading screen
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
});
