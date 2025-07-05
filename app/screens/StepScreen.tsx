import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import * as HealthConnectLibrary from 'react-native-health-connect';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Navbar from '../components/navbar';
import { Ionicons } from '@expo/vector-icons';

const REQUIRED_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'Distance' },
];
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Days of week component
const WeekdayBar = () => {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const dayOfMonth = currentDate.getDate();
  
  // Generate array of 7 days starting from Sunday (3 days before current day to 3 days after)
  const days = [];
  const weekdays = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
  
  for (let i = -3; i <= 3; i++) {
    const date = new Date(currentDate);
    date.setDate(dayOfMonth + i);
    const day = date.getDate();
    const isToday = i === 0;
    
    days.push({
      dayOfMonth: day,
      weekday: weekdays[(dayOfWeek + i + 7) % 7],
      isToday,
    });
  }
  

  return (
    <View style={styles.weekdayContainer}>
      {days.map((day, index) => (
        <View key={index} style={styles.dayColumn}>
          <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>{day.dayOfMonth}</Text>
          <View style={[styles.circleProgress, day.isToday && styles.todayCircle]}>
            {/* Progress circle with random progress for visualization */}
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Circle
                cx="12"
                cy="12"
                r="10"
                stroke="#1D2740"
                strokeWidth="5"
                fill="transparent"
              />
              <Circle
                cx="12"
                cy="12"
                r="10"
                stroke="#C7312B"
                strokeWidth="5"
                strokeDasharray={`${Math.random() * 40 + 20} 100`}
                strokeLinecap="round"
                fill="transparent"
              />
            </Svg>
          </View>
          <Text style={[styles.dayLetter, day.isToday && styles.todayText]}>{day.weekday}</Text>
        </View>
      ))}
    </View>
  );
};

// Circular progress component
const CircularProgress = ({ steps = 0, goal = 10000 }) => {
  const percentage = Math.min(steps / goal, 1);
  const radius = 110;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage);
  
  return (
    <View style={styles.progressContainer}>
      <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth} viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}>
        {/* Background Circle */}
        <Circle
          cx={radius + strokeWidth/2}
          cy={radius + strokeWidth/2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgba(199, 49, 43, 0.2)"
          fill="transparent"
        />
        
        {/* Progress Arc */}
        <Circle
          cx={radius + strokeWidth/2}
          cy={radius + strokeWidth/2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#C7312B"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${radius + strokeWidth/2}, ${radius + strokeWidth/2})`}
        />
        
        {/* Arrow at the end of progress */}
        <G
          transform={`rotate(${percentage * 360 - 90}, ${radius + strokeWidth/2}, ${radius + strokeWidth/2}) translate(${radius + strokeWidth/2}, ${strokeWidth/2})`}
        >
          <Path
            d="M0,0 L10,10 L0,20 Z"
            fill="#C7312B"
          />
        </G>
      </Svg>
      
      <View style={styles.progressContent}>
        <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
        <Text style={styles.stepsLabel}>Steps</Text>
        <Text style={styles.stepsGoal}>Out of {goal.toLocaleString()} steps</Text>
      </View>
    </View>
  );
};

const StepScreen = () => {
  const [healthData, setHealthData] = useState({
    steps: 0,
    calories: null,
    caloriesSource: 'measured',
    distance: null,
    exerciseSessions: null,
    heartRate: null,
  });

  
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [appInfo, setAppInfo] = useState('');
  const poller = useRef(null);
  const navbarRef = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;

  // All the logic functions remain unchanged
  const ensurePermissions = async () => {
    try {
      setPermissionError('');

      if (Platform.OS === 'android') {
        const { NativeModules } = require('react-native');
        const appPackage = NativeModules.PlatformConstants?.PackageName || 'unknown';
        const appName = NativeModules.PlatformConstants?.ApplicationName || 'unknown';
        setAppInfo(`App: ${appName} (${appPackage})`);
        console.log(`App package: ${appPackage}, name: ${appName}`);

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: 'Activity Recognition Permission',
            message: 'We need access to your physical activity to track steps.',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionError('Activity recognition permission denied');
          Alert.alert('Permission required', 'Cannot track steps without permission.');
          return false;
        }
      }

      if (typeof HealthConnectLibrary.initialize === 'function') {
        await HealthConnectLibrary.initialize();
        console.log('Health Connect initialized');
      }

      const sdkStatus = await HealthConnectLibrary.getSdkStatus();
      console.log('SDK Status:', sdkStatus);
      if (sdkStatus !== HealthConnectLibrary.SdkAvailabilityStatus.SDK_AVAILABLE) {
        setPermissionError('Health Connect not available. Status: ' + sdkStatus);
        Alert.alert('Unavailable', 'Health Connect is not available on this device.');
        return false;
      }

      const grantedPerms = await HealthConnectLibrary.getGrantedPermissions();
      console.log('Granted permissions:', JSON.stringify(grantedPerms));

      const allGranted = REQUIRED_PERMISSIONS.every((perm) =>
        grantedPerms.some(
          (g) => g.recordType === perm.recordType && g.accessType === perm.accessType
        )
      );

      if (!allGranted) {
        console.log('Not all permissions granted');
        return false;
      }
      console.log('All permissions granted');
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionError('Error: ' + error.message);
      return false;
    }
  };

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const endTime = new Date();
      // Set startTime to today at midnight
      const startTime = new Date(endTime);
      startTime.setHours(0, 0, 0, 0);

      console.log(
        `Fetching data for today: ${startTime.toISOString()} to ${endTime.toISOString()}`
      );

      const grantedPerms = await HealthConnectLibrary.getGrantedPermissions();
      if (
        !REQUIRED_PERMISSIONS.every((perm) =>
          grantedPerms.some(
            (g) => g.recordType === perm.recordType && g.accessType === perm.accessType
          )
        )
      ) {
        throw new Error('Missing permissions');
      }

      const healthData = {};
      for (const perm of REQUIRED_PERMISSIONS) {
        try {
          console.log(`Fetching ${perm.recordType} data...`);
          const records = await HealthConnectLibrary.readRecords(perm.recordType, {
            timeRangeFilter: {
              operator: 'between',
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
            },
          });
          console.log(`${perm.recordType} records:`, JSON.stringify(records));
          healthData[perm.recordType] = records;
        } catch (err) {
          console.error(`Error reading ${perm.recordType}:`, err);
        }
      }

      // Process steps
      let totalSteps = 0;
      const stepsData = healthData.Steps || {};
      if (stepsData.records && Array.isArray(stepsData.records)) {
        console.log('Steps records:', stepsData.records.length);
        totalSteps = stepsData.records.reduce((sum, rec) => sum + (rec.count ?? 0), 0);
      }

      // Process distance
      let totalDistance = 0;
      const distanceData = healthData.Distance || {};
      if (distanceData.records && Array.isArray(distanceData.records)) {
        console.log('Distance records:', distanceData.records.length);
        totalDistance = distanceData.records.reduce(
          (sum, rec) => sum + (rec.distance?.inKilometers ?? 0),
          0
        );
      }

      // Process calories
      let totalCalories = 0;
      let caloriesSource = 'measured';
      const caloriesData = healthData.ActiveCaloriesBurned || {};
      if (
        caloriesData.records &&
        Array.isArray(caloriesData.records) &&
        caloriesData.records.length > 0
      ) {
        console.log('Calories records:', caloriesData.records.length);
        totalCalories = caloriesData.records.reduce(
          (sum, rec) => sum + (rec.energy?.kilocalories ?? 0),
          0
        );
      } else if (totalDistance > 0) {
        totalCalories = totalDistance * 65; // Estimate: 65 kcal per km
        caloriesSource = 'estimated from distance';
        console.log(`Estimated calories from distance: ${totalCalories.toFixed(2)} kcal`);
      } else if (totalSteps > 0) {
        totalCalories = totalSteps * 0.04; // Estimate: 0.04 kcal per step
        caloriesSource = 'estimated from steps';
        console.log(`Estimated calories from steps: ${totalCalories.toFixed(2)} kcal`);
      }

      setHealthData({
        steps: totalSteps,
        calories: totalCalories,
        caloriesSource,
        distance: totalDistance,
        exerciseSessions: healthData.ExerciseSession,
        heartRate: healthData.HeartRate,
      });
      console.log('Updated health data:', {
        steps: totalSteps,
        distance: totalDistance,
        calories: totalCalories,
        caloriesSource,
      });
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const ok = await ensurePermissions();
      setHasPermission(ok);
      if (ok) {
        await fetchHealthData();
        poller.current = setInterval(fetchHealthData, POLL_INTERVAL_MS);
      }
    })();

    return () => {
      if (poller.current) clearInterval(poller.current);
    };
  }, []);

  // Updated UI rendering - permission screen
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.containerWithWhiteSpace}>
        <View style={styles.contentWrapper}>
          <View style={styles.contentContainer}>
            <WeekdayBar />
            
            <CircularProgress steps={0} goal={10000} />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() =>
                  Linking.openURL('package:com.google.android.apps.healthdata').catch(() =>
                    Linking.openURL('market://details?id=com.google.android.apps.healthdata')
                  )
                }
              >
                <Ionicons name="medkit-outline" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.connectButtonText}>Connect Health Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <Navbar ref={navbarRef} activeScreen="WeeklyForm" opacityValue={navOpacity} />
      </SafeAreaView>
    );
  }

  // Updated UI rendering - data display screen

};

const styles = StyleSheet.create({
  // Add these new styles
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
    marginBottom: 230, // Create white space at the bottom
  },
  
  // Update this style
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 30,
  },
  
  // Keep the rest of your styles
  container: {
    flex: 1,
    backgroundColor: '#081A2F',
  },
  weekdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    paddingVertical: 20,
    marginBottom: 20,
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  dayLetter: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  circleProgress: {
    width: 24,
    height: 24,
  },
  todayText: {
    color: '#C7312B',
    fontWeight: 'bold',
  },
  todayCircle: {
    // Additional styling for today's circle if needed
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  stepsLabel: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  stepsGoal: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 180,
  },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: '#081A2F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1D2740',
  },
  buttonIcon: {
    marginRight: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C7312B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});

export default StepScreen;