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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LineChart, BarChart, ScatterChart } from 'react-native-chart-kit';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';

// Import assets
const UserImage = require('../assets/User.png');
const GreetRectangle = require('../assets/GreetRectangle.png');
const HomeIcon = require('../assets/home.png');
const ChatIcon = require('../assets/chat.png');
const AddIcon = require('../assets/add.png');
const WorkoutIcon = require('../assets/workout.png');
const NavRectangle = require('../assets/NavRectangle.png');

export default function ReportScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  // Sample data for demonstration
  const [stepsData] = useState([8200, 8500, 9100, 9300, 9600, 9800, 8600]);
  const [weightData] = useState([752, 748, 745, 740, 745, 742, 738]);
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

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const screenWidth = Dimensions.get('window').width;

  const renderGreeting = () => (
    <View style={styles.bannerContainer}>
      <Image source={GreetRectangle} style={styles.bannerBg} />
      <View style={styles.bannerContent}>
        <View>
          <Text style={styles.bannerSubTitle}>Keeping Moving Today!</Text>
          <Text style={styles.bannerTitle}>
            Hi, <Text style={{ fontWeight: 'bold' }}>{userFullName || 'Aria'}</Text>!
          </Text>
        </View>
        <Image source={UserImage} style={styles.bannerUserImage} />
      </View>
    </View>
  );

  const renderWeightChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Weight</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: days,
            datasets: [
              {
                data: weightData,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={Math.max(screenWidth - 40, days.length * 60)}
          height={180}
          chartConfig={{
            backgroundColor: '#f5f5f5',
            backgroundGradientFrom: '#f5f5f5',
            backgroundGradientTo: '#f5f5f5',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(70, 70, 70, ${opacity})`,
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#000',
              fill: '#000',
            },
            propsForBackgroundLines: {
              strokeWidth: 1,
              stroke: '#e0e0e0',
            },
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
      <TouchableOpacity style={styles.infoButton}>
        <Feather name="info" size={16} color="#888" />
      </TouchableOpacity>
    </View>
  );

  const renderStepsChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Steps</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={{
            labels: days,
            datasets: [
              {
                data: stepsData,
              },
            ],
          }}
          width={Math.max(screenWidth - 40, days.length * 60)}
          height={180}
          chartConfig={{
            backgroundColor: '#f5f5f5',
            backgroundGradientFrom: '#f5f5f5',
            backgroundGradientTo: '#f5f5f5',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(14, 65, 148, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(70, 70, 70, ${opacity})`,
            barPercentage: 0.7,
            barRadius: 5,
            fillShadowGradient: '#1a56db',
            fillShadowGradientOpacity: 1,
          }}
          style={styles.chart}
          showValuesOnTopOfBars={true}
          fromZero
        />
      </ScrollView>
      <TouchableOpacity style={styles.infoButton}>
        <Feather name="info" size={16} color="#888" />
      </TouchableOpacity>
    </View>
  );

  const renderSleepChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitleRight}>Sleep</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: days,
            datasets: [
              {
                data: sleepData,
                color: (opacity = 1) => `rgba(25, 47, 89, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={Math.max(screenWidth - 40, days.length * 60)}
          height={180}
          chartConfig={{
            backgroundColor: '#f5f5f5',
            backgroundGradientFrom: '#f5f5f5',
            backgroundGradientTo: '#f5f5f5',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(25, 47, 89, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(70, 70, 70, ${opacity})`,
            propsForDots: {
              r: (dataPoint) => dataPoint * 1.5, // Scale circle size by sleep hours
              strokeWidth: '1',
              stroke: '#192f59',
              fill: '#192f59',
            },
            propsForBackgroundLines: {
              strokeWidth: 1,
              stroke: '#e0e0e0',
            },
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
      <TouchableOpacity style={styles.infoButton}>
        <Feather name="info" size={16} color="#888" />
      </TouchableOpacity>
    </View>
  );

  const renderHungerChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Hunger</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: days,
            datasets: [
              {
                data: hungerData,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={Math.max(screenWidth - 40, days.length * 60)}
          height={180}
          chartConfig={{
            backgroundColor: '#f5f5f5',
            backgroundGradientFrom: '#f5f5f5',
            backgroundGradientTo: '#f5f5f5',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(70, 70, 70, ${opacity})`,
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#000',
              fill: '#000',
            },
            propsForBackgroundLines: {
              strokeWidth: 1,
              stroke: '#e0e0e0',
            },
            yAxisSuffix: '',
            yAxisMin: 0,
            yAxisMax: 10,
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
      <TouchableOpacity style={styles.infoButton}>
        <Feather name="info" size={16} color="#888" />
      </TouchableOpacity>
    </View>
  );

  const renderMoodChart = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitleRight}>Mood</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ padding: 10, width: Math.max(screenWidth - 40, days.length * 60) }}>
          {days.map((day, index) => (
            <View key={day} style={styles.moodRow}>
              <Text style={styles.moodDay}>{day}</Text>
              <View style={styles.moodLine}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.moodDot, { opacity: i < moodData[index] ? 1 : 0.2 }]}
                  />
                ))}
                <View
                  style={[
                    styles.moodBubble,
                    {
                      left: `${moodData[index] * 10}%`,
                      width: moodData[index] * 2 + 10,
                      height: moodData[index] * 2 + 10,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.infoButton}>
        <Feather name="info" size={16} color="#888" />
      </TouchableOpacity>
    </View>
  );

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

  const renderBottomNav = () => (
    <Animated.View style={[styles.bottomNavContainer, { opacity: navOpacity }]}>
      <Image source={NavRectangle} style={styles.bottomNavBg} />
      <View style={styles.bottomNavContent}>
        <Pressable onPress={() => navigation.navigate('Home')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={HomeIcon} style={styles.bottomNavIcon} />
            <View style={styles.activeEclipse} />
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('WeeklyForm')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={AddIcon} style={styles.bottomNavIcon} />
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
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollViewContent}>
        {renderGreeting()}
        <View style={styles.cardsContainer}>
          {renderWeightChart()}
          {renderStepsChart()}
          {renderSleepChart()}
          {renderHungerChart()}
          {renderMoodChart()}
        </View>
      </ScrollView>
      {renderBottomNav()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  cardsContainer: {
    paddingTop: 0,
  },
  cardContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardTitleRight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#777',
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  infoButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    marginVertical: 5,
  },
  moodDay: {
    width: 40,
    fontSize: 14,
    color: '#666',
  },
  moodLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    flexDirection: 'row',
    position: 'relative',
    marginLeft: 10,
  },
  moodDot: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
  },
  moodBubble: {
    position: 'absolute',
    backgroundColor: '#192f59',
    borderRadius: 50,
    top: -10,
    transform: [{ translateX: -10 }],
  },
  bannerContainer: {
    height: 200,
    marginBottom: -50,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bannerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    top: 0,
    left: 0,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 75,
    height: '100%',
  },
  bannerSubTitle: {
    color: 'black',
    fontSize: 12,
    marginBottom: 0,
    opacity: 0.85,
  },
  bannerTitle: {
    color: 'black',
    fontSize: 30,
    fontWeight: '400',
    marginBottom: 10,
  },
  bannerUserImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    marginTop: 40,
  },
  textDark: {
    color: '#ffffff',
  },
  bottomNavContainer: {
    height: 55,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    backgroundColor: '#BABABA',
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
