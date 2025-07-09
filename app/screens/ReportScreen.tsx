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
  const [stepsData] = useState([8200, 8500, 9100, 9300, 9600, 9800, 8600]);
  const [weightData] = useState([75, 74, 74, 74, 74, 74, 73]);
  const [sleepData] = useState([7.5, 7.2, 6.8, 6.5, 6.7, 7.8, 8.1]);
  const [hungerData] = useState([3, 2, 4, 5, 6, 6.5, 7]);
  const [moodData] = useState([4, 5, 6, 5, 7, 8, 6]);

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
          <Text style={styles.headerSubTitle}>Keeping Moving Today!</Text>
          <Text style={styles.headerTitle}>Hi, {userFullName || 'Aria'}!</Text>
          <Text style={styles.dateText}>{`${currentMonth}, ${currentYear}`}</Text>
        </View>
        
        {/* Make the user avatar clickable */}
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={UserImage} style={styles.userAvatar} />
        </TouchableOpacity>
      </View>
      
      {/* Use the new WeekCalendar component */}
      <WeekCalendar 
        weekDates={weekDates} 
        onDatePress={handleDateSelect}
      />
    </View>
  );

  const renderWeightChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="scale-bathroom" size={20} color="#666" />
          <Text style={styles.cardTitle}>Weight</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      <LineChart
        data={{
          labels: ['', '', '', '', '', '', ''],
          datasets:
            [{
              data: weightData,
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 3,
            },
          ],
        }}
        width={screenWidth - 60}
        height={120}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, 0)`,
          propsForDots: {
            r: '4',
            strokeWidth: '0',
            fill: '#ff6384',
          },
          propsForBackgroundLines: {
            strokeWidth: 0,
          },
          paddingRight: 0,
          paddingLeft: 0,
        }}
        bezier
        withHorizontalLines={false}
        withVerticalLines={false}
        withInnerLines={false}
        style={styles.chart}
      />
    </View>
  );

  const renderStepsChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="run" size={20} color="#666" />
          <Text style={styles.cardTitle}>Steps</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      <Text style={styles.currentValue}>10,000</Text>
      <BarChart
        data={{
          labels: ['', '', '', '', '', '', ''],
          datasets: [
            {
              data: stepsData,
            },
          ],
        }}
        width={screenWidth - 60}
        height={140}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(96, 125, 139, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, 0)`,
          barPercentage: 0.7,
          barRadius: 4,
          fillShadowGradient: '#607d8b',
          fillShadowGradientOpacity: 1,
        }}
        style={styles.chart}
        withInnerLines={false}
        withHorizontalLines={false}
        withVerticalLines={false}
        fromZero
      />
    </View>
  );

  const renderHungerChart = () => (
    <View style={[styles.cardContainer, styles.halfCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="food-apple" size={20} color="#666" />
          <Text style={styles.cardTitle}>Hunger</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      <LineChart
        data={{
          labels: ['', '', '', '', '', '', ''],
          datasets: [
            {
              data: hungerData,
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 3,
            },
          ],
        }}
        width={(screenWidth - 80) / 2}
        height={100}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, 0)`,
          propsForDots: {
            r: '3',
            strokeWidth: '0',
            fill: '#ff6384',
          },
          propsForBackgroundLines: {
            strokeWidth: 0,
          },
        }}
        bezier
        withHorizontalLines={false}
        withVerticalLines={false}
        style={styles.smallChart}
      />
    </View>
  );

  const renderSleepChart = () => (
    <View style={[styles.cardContainer, styles.halfCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="sleep" size={20} color="#666" />
          <Text style={styles.cardTitle}>Sleep</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      {/* Sleep Quality Circles */}
      <View style={styles.sleepContainer}>
        <View style={styles.sleepLegend}>
          {['4:15', '6:30', '7:15', '8:00', '8:30'].map((time, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: index < 3 ? '#ff6384' : '#ddd' }]} />
              <Text style={styles.legendText}>{time}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.sleepCircles}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={[
              styles.sleepCircle,
              {
                width: 20 + i * 8,
                height: 20 + i * 8,
                borderColor: '#ff6384',
                borderWidth: i === 3 ? 3 : 1,
                opacity: i === 3 ? 1 : 0.3,
              }
            ]} />
          ))}
        </View>
      </View>
    </View>
  );

  const renderMoodChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="emoticon-happy" size={20} color="#666" />
          <Text style={styles.cardTitle}>Moods</Text>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.moodDotsContainer}>
        {moodData.map((mood, index) => (
          <View key={index} style={[
            styles.moodDotLarge,
            {
              width: mood * 8 + 15,
              height: mood * 8 + 15,
              backgroundColor: mood > 5 ? '#ff6384' : '#ffb3ba',
            }
          ]} />
        ))}
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
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>Loading...</Text>
      </View>
    );
  }

  // Update the return statement to fix the SafeAreaView issue
  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#081A2F"
        translucent
      />
      
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
      <Navbar 
        ref={navbarRef} 
        activeScreen="Home" 
        opacityValue={navOpacity} 
      />
    </View>
  );
}

// Update the styles to fix the border radius and spacing issues
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
    top:15,
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
    marginTop: 10, // Adjust to overlap with the header
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  halfCard: {
    flex: 1,
    marginRight: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -16,
  },
  smallChart: {
    borderRadius: 8,
    marginLeft: -16,
  },
  sleepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sleepLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  sleepCircles: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepCircle: {
    position: 'absolute',
    borderRadius: 50,
    borderStyle: 'solid',
  },
  moodDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  moodDotLarge: {
    borderRadius: 50,
    opacity: 0.8,
  },
  // These styles are only for the loading screen
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  loadingText: {
    fontSize: 18,
    color: '#000',
  },
  textDark: {
    color: '#fff',
  },
});