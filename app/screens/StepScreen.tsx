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
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import * as HealthConnectLibrary from 'react-native-health-connect';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Navbar from '../components/navbar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
              <Circle cx="12" cy="12" r="10" stroke="#1D2740" strokeWidth="5" fill="transparent" />
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
const CircularProgress = ({ steps = 0, goal = 10000, onEditSteps, showEditButton = false }) => {
  const percentage = Math.min(steps / goal, 1);
  const radius = 110;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  // Arrow positioning fixed to start from the top (0 degrees) and move clockwise
  const angle = percentage * 360; // Now starts at top (0°) and goes clockwise

  return (
    <View style={styles.progressContainer}>
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
          stroke="rgba(199, 49, 43, 0.2)"
          fill="transparent"
        />

        {/* Progress Arc - adjusted transform to start from right (90 degrees) */}
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

        {/* Arrow at the end of progress - positioned slightly ahead of the progress */}
        <G
          transform={`rotate(${angle + 5}, ${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}) translate(${radius + strokeWidth / 2}, ${-strokeWidth / 2})`}>
          <Path d="M0,0 L10,10 L0,20 Z" fill="#C7312B" />
        </G>
      </Svg>

      <View style={styles.progressContent}>
        {/* Updated step count display with inline "Steps" and bottom border */}
        <View style={styles.stepsInlineContainer}>
          <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
        </View>

        <Text style={styles.stepsGoal}>Out of {goal.toLocaleString()} steps</Text>

        {showEditButton && (
          <TouchableOpacity style={styles.editButton} onPress={onEditSteps}>
            <Ionicons name="pencil" size={18} color="white" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const StepScreen = ({ navigation }) => {
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
  const [isConnectedToHealthServices, setIsConnectedToHealthServices] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [appInfo, setAppInfo] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [manualSteps, setManualSteps] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const poller = useRef(null);
  const navbarRef = useRef(null);
  const navOpacity = useRef(new Animated.Value(1)).current;

  // Function to navigate to the detailed fitness screen
  const navigateToDetailedFitnessScreen = () => {
    navigation.navigate('DetailedFitnessScreen');
  };

  // Function to handle manual step count edit
  const handleEditSteps = () => {
    setManualSteps(healthData.steps.toString());
    setEditModalVisible(true);
  };

  // Function to save edited step count
  const saveEditedSteps = async () => {
    try {
      const steps = parseInt(manualSteps);
      if (isNaN(steps) || steps < 0) {
        Alert.alert('Invalid Input', 'Please enter a valid step count.');
        return;
      }

      // Get today's date as a string for storage key
      const today = new Date().toISOString().split('T')[0];

      // Save manually edited steps to AsyncStorage
      await AsyncStorage.setItem('manualSteps_' + today, steps.toString());
      setEditedDate(today);

      // Update health data with manually edited steps
      setHealthData((prev) => ({
        ...prev,
        steps: steps,
      }));

      setEditModalVisible(false);
    } catch (error) {
      console.error('Error saving edited steps:', error);
      Alert.alert('Error', 'Failed to save step count.');
    }
  };

  // Function to check for previously edited steps
  const checkForEditedSteps = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedSteps = await AsyncStorage.getItem('manualSteps_' + today);

      if (savedSteps !== null) {
        const steps = parseInt(savedSteps);
        if (!isNaN(steps)) {
          console.log('Found manually edited steps:', steps);
          setHealthData((prev) => ({
            ...prev,
            steps: steps,
          }));
          setEditedDate(today);
        }
      }
    } catch (error) {
      console.error('Error checking for edited steps:', error);
    }
  };

  // All the logic functions remain unchanged
  const ensurePermissions = async () => {
    try {
      setPermissionError('');
      let isConnected = false;

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

      // Check if Health Connect is available and has permissions
      if (typeof HealthConnectLibrary.initialize === 'function') {
        await HealthConnectLibrary.initialize();
        console.log('Health Connect initialized');

        const sdkStatus = await HealthConnectLibrary.getSdkStatus();
        console.log('SDK Status:', sdkStatus);
        if (sdkStatus === HealthConnectLibrary.SdkAvailabilityStatus.SDK_AVAILABLE) {
          const grantedPerms = await HealthConnectLibrary.getGrantedPermissions();
          console.log('Granted permissions:', JSON.stringify(grantedPerms));

          const allGranted = REQUIRED_PERMISSIONS.every((perm) =>
            grantedPerms.some(
              (g) => g.recordType === perm.recordType && g.accessType === perm.accessType
            )
          );

          if (allGranted) {
            isConnected = true;
            console.log('Connected to Health Services');
          }
        }
      }

      setIsConnectedToHealthServices(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionError('Error: ' + error.message);
      setIsConnectedToHealthServices(false);
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

      const today = endTime.toISOString().split('T')[0];
      // If date changed, clear edited steps
      if (editedDate && editedDate !== today) {
        setEditedDate('');
      }

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

      // Process steps - Only update if there's no manual edit for today
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

      // Only update steps if there's no manual edit for today
      if (editedDate !== today) {
        setHealthData((prev) => ({
          ...prev,
          steps: totalSteps,
          calories: totalCalories,
          caloriesSource,
          distance: totalDistance,
          exerciseSessions: healthData.ExerciseSession,
          heartRate: healthData.HeartRate,
        }));
      } else {
        // Keep edited steps, update only other data
        setHealthData((prev) => ({
          ...prev,
          calories: totalCalories,
          caloriesSource,
          distance: totalDistance,
          exerciseSessions: healthData.ExerciseSession,
          heartRate: healthData.HeartRate,
        }));
      }

      console.log('Updated health data:', {
        steps: editedDate === today ? healthData.steps : totalSteps,
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
      await checkForEditedSteps();
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

            <CircularProgress
              steps={0}
              goal={10000}
              onEditSteps={handleEditSteps}
              showEditButton={true}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() =>
                  Linking.openURL('package:com.google.android.apps.healthdata').catch(() =>
                    Linking.openURL('market://details?id=com.google.android.apps.healthdata')
                  )
                }>
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
  return (
    <SafeAreaView style={styles.containerWithWhiteSpace}>
      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          <WeekdayBar />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C7312B" />
              <Text style={styles.loadingText}>Fetching your data...</Text>
            </View>
          ) : (
            <>
              <CircularProgress
                steps={healthData.steps}
                goal={10000}
                onEditSteps={handleEditSteps}
                showEditButton={!isConnectedToHealthServices}
              />

              {/* View More Button - Moved here, right below the progress circle */}
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={navigateToDetailedFitnessScreen}>
                <Text style={styles.viewMoreText}>View More</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7312B" />
              </TouchableOpacity>
            </>
          )}

          {!loading && (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {healthData.distance !== null ? healthData.distance.toFixed(2) : '0'} km
                </Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {healthData.calories !== null ? Math.round(healthData.calories) : '0'}
                </Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Moved refresh button to center of whitespace */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchHealthData} disabled={loading}>
        <Ionicons name="refresh" size={24} color="white" style={styles.refreshIcon} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>

      <Navbar ref={navbarRef} activeScreen="WeeklyForm" opacityValue={navOpacity} />

      {/* Edit Steps Modal - only used when not connected to health services */}
      <Modal
        visible={editModalVisible && !isConnectedToHealthServices}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Step Count</Text>

            <TextInput
              style={styles.stepInput}
              keyboardType="number-pad"
              value={manualSteps}
              onChangeText={setManualSteps}
              placeholder="Enter steps"
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEditedSteps}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
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
    marginTop: 20, // Reduced from 60 to 20 to move it up
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
    marginRight: 8,
  },
  stepsInline: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  stepsGoal: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 8,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(199, 49, 43, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
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
    bottom: 100, // Lowered from 130 to 100 to position it a bit lower
    alignSelf: 'center', // Center horizontally
    flexDirection: 'row',
    backgroundColor: '#C7312B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: 20, // Reduced from 40 to 20 since View More is now between circle and stats
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: '#1D2740',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '45%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1D2740',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  stepInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#0D1321',
    color: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7312B',
  },
  saveButton: {
    backgroundColor: '#C7312B',
    borderColor: '#C7312B',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Reduced from 30 to 10 for tighter spacing below circle
    paddingVertical: 10,
  },
  viewMoreText: {
    color: '#C7312B',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default StepScreen;
