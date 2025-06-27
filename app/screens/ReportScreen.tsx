import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions, Image, SafeAreaView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LineChart,BarChart } from 'react-native-chart-kit';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// Import assets
const UserImage = require('../assets/User.png');
const GreetRectangle = require('../assets/GreetRectangle.png');
const HomeIcon = require('../assets/home.png');
const ChatIcon = require('../assets/chat.png');
const AddIcon = require('../assets/add.png');
const WorkoutIcon = require('../assets/workout.png');
const NavRectangle = require('../assets/NavRectangle.png');

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

export default function ReportScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepsData] = useState(() => {
    // Generate random steps data between 2000 and 10000
    return Array(7)
      .fill(0)
      .map(() => Math.floor(Math.random() * 8000) + 2000);
  });
  const [userFullName, setUserFullName] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

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

  const processDataForMetric = (metric) => {
    if (!weeklyData) return { labels: [], data: [], colors: [] };

    const labels = [];
    const data = [];
    const colors = [];

    Object.keys(weeklyData)
      .filter((key) => key.startsWith('week'))
      .sort((a, b) => a.localeCompare(b))
      .forEach((weekKey) => {
        const weekData = weeklyData[weekKey];
        Object.keys(weekData)
          .filter((day) =>
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(
              day
            )
          )
          .forEach((day) => {
            const dayData = weekData[day];
            if (dayData[metric]?.value) {
              labels.push(`${weekKey}-${day}`);
              data.push(dayData[metric].value);
              colors.push(dayData[metric].color || '#000000');
            }
          });
      });

    return { labels, data, colors };
  };

  const processWeightData = () => {
    if (!weeklyData) return { labels: [], data: [] };

    const labels = [];
    const data = [];

    Object.keys(weeklyData)
      .filter((key) => key.startsWith('week'))
      .sort((a, b) => a.localeCompare(b))
      .forEach((weekKey) => {
        const weekData = weeklyData[weekKey];
        Object.keys(weekData)
          .filter((day) =>
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(
              day
            )
          )
          .forEach((day) => {
            if (weekData[day]?.weight) {
              labels.push(`${weekKey}-${day}`);
              data.push(parseFloat(weekData[day].weight));
            }
          });
      });

    return { labels, data };
  };

  const renderGreeting = () => (
  <View style={styles.bannerContainer}>
    <Image source={GreetRectangle} style={styles.bannerBg} />
    <View style={styles.bannerContent}>
      <View>
        <Text style={styles.bannerSubTitle}>Keeping Moving Today!</Text>
        <Text style={styles.bannerTitle}>
          Hi, <Text style={{ fontWeight: 'bold' }}>{userFullName || 'User'}</Text>!
        </Text>
      </View>
      <Image source={UserImage} style={styles.bannerUserImage} />
    </View>
  </View>
);
  const renderChart = (metric) => {
    const { labels, data, colors } = processDataForMetric(metric);
    if (data.length === 0) return null;

    const getColorForMetric = (opacity = 1) => {
      const baseColor =
        {
          'Sleep Quality': '#6366f1', // Indigo
          Mood: '#ec4899', // Pink
          'Hunger Level': '#14b8a6', // Teal
        }[metric] || '#8b5cf6'; // Default Purple

      return isDarkMode ? `rgba(${hexToRgb(baseColor)}, ${opacity})` : baseColor;
    };

    return (
      <View
        style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc' }]}>
        <Text style={[styles.chartTitle, isDarkMode && styles.textDark]}>
          {metric} ({data[data.length - 1]}/5)
        </Text>
        <LineChart
          data={{
            labels: labels.map((l) => l.split('-')[1].substring(0, 3)),
            datasets: [
              {
                data,
                color: getColorForMetric,
                strokeWidth: 3,
              },
            ],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: isDarkMode ? '#1f2937' : '#f8fafc',
            backgroundGradientTo: isDarkMode ? '#1f2937' : '#f8fafc',
            decimalPlaces: 0,
            color: getColorForMetric,
            labelColor: () => (isDarkMode ? '#9ca3af' : '#64748b'),
            style: {
              borderRadius: 16,
            },
            propsForBackgroundLines: {
              strokeDasharray: '', // Solid lines
              stroke: isDarkMode ? '#374151' : '#e2e8f0',
              strokeWidth: 1,
            },
            propsForDots: {
              r: '5',
              strokeWidth: '2',
              stroke: getColorForMetric(1),
            },
            yAxisInterval: 1,
            yAxisSuffix: '',
            yAxisMinValue: 0,
            yAxisMaxValue: 5,
          }}
          style={styles.chart}
          bezier
        />
        <Text style={[styles.chartSubtitle, isDarkMode && styles.textDark]}>
          Last updated: {new Date(weeklyData.timestamp).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const renderWeightChart = () => {
    const { labels, data } = processWeightData();
    if (data.length === 0) return null;

    return (
      <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc' }]}>
        <Text style={[styles.chartTitle, isDarkMode && styles.textDark]}>
          Weight ({data[data.length - 1]} kg)
        </Text>
        <LineChart
          data={{
            labels: labels.map((l) => l.split('-')[1].substring(0, 3)),
            datasets: [
              {
                data,
                color: (opacity = 1) => (isDarkMode ? `rgba(249, 115, 22, ${opacity})` : '#f97316'), // Orange
                strokeWidth: 3,
              },
            ],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: isDarkMode ? '#1f2937' : '#f8fafc',
            backgroundGradientTo: isDarkMode ? '#1f2937' : '#f8fafc',
            decimalPlaces: 1,
            color: (opacity = 1) => (isDarkMode ? `rgba(249, 115, 22, ${opacity})` : '#f97316'),
            labelColor: () => (isDarkMode ? '#9ca3af' : '#64748b'),
            style: { borderRadius: 16 },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: isDarkMode ? '#374151' : '#e2e8f0',
              strokeWidth: 1,
            },
          }}
          style={styles.chart}
          bezier
        />
      </View>
    );
  };

  const renderStepsChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc' }]}>
        <Text style={[styles.chartTitle, isDarkMode && styles.textDark]}>Steps</Text>
        <BarChart
          data={{
            labels: days,
            datasets: [
              {
                data: stepsData,
              },
            ],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: isDarkMode ? '#1f2937' : '#f8fafc',
            backgroundGradientTo: isDarkMode ? '#1f2937' : '#f8fafc',
            decimalPlaces: 0,
            color: (opacity = 1) => (isDarkMode ? `rgba(59, 130, 246, ${opacity})` : '#3b82f6'), // Blue
            labelColor: () => (isDarkMode ? '#9ca3af' : '#64748b'),
            style: { borderRadius: 16 },
            barPercentage: 0.7,
          }}
          style={styles.chart}
          showValuesOnTopOfBars={true}
        />
      </View>
    );
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
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
    }
  );

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
        <Pressable onPress={() => navigation.navigate('Chat')} style={styles.navItem}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#fff' }}>
      <ScrollView 
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderGreeting()}
        {renderWeightChart()}
        {renderStepsChart && renderStepsChart()}
        {renderChart('Sleep Quality')}
        {renderChart('Hunger Level')}
        {renderChart('Mood')}
      </ScrollView>
      {renderBottomNav()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
  },
  chartSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 12,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    color: '#000000',
  },
  textDark: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDark: {
    backgroundColor: '#374151',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  bannerContainer: {
    height: 280,
    marginBottom: -55,
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
    paddingBottom: 50,
    height: '100%',
  },
  bannerSubTitle: {
    color: 'black',
    fontSize: 13,
    marginBottom: 2,
    opacity: 0.85,
  },
  bannerTitle: {
    color: 'black',
    fontSize: 26,
    fontWeight: '400',
    marginBottom: 10,
  },
  bannerUserImage: {
    width: 73,
    height: 75,
    borderRadius: 50,
    borderWidth: 0,
    borderColor: '#fff',
    backgroundColor: '#eee',
    marginBottom:55
  },
  bottomNavContainer: {
    height: 45,
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
