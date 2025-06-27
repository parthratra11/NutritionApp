import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import * as HealthConnectLibrary from 'react-native-health-connect';

const REQUIRED_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'Distance' },
];
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

const StepScreen = () => {
  const [healthData, setHealthData] = useState({
    steps: null,
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
        Alert.alert(
          'Permission Required',
          'Please grant permissions in Health Connect:\n1. Open Health Connect\n2. Update Health Connect\n3. Connect fitness apps',
          [
            {
              text: 'Open Health Connect',
              onPress: () =>
                Linking.openURL('package:com.google.android.apps.healthdata').catch(() =>
                  Linking.openURL('market://details?id=com.google.android.apps.healthdata')
                ),
            },
            { text: 'Cancel' },
          ]
        );
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

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>Permissions not granted.</Text>
        {permissionError && <Text style={styles.errorDetails}>{permissionError}</Text>}
        {appInfo && <Text style={styles.appInfo}>{appInfo}</Text>}
        <Text style={styles.instructions}>
          Ensure Health Connect is set up: 1. Update Health Connect 2. Connect fitness apps 3. Check
          compatibility
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Open Health Connect"
            onPress={() =>
              Linking.openURL('package:com.google.android.apps.healthdata').catch(() =>
                Linking.openURL('market://details?id=com.google.android.apps.healthdata')
              )
            }
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Try Again"
            onPress={async () => {
              const ok = await ensurePermissions();
              setHasPermission(ok);
              if (ok) await fetchHealthData();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Data (Today)</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Text style={styles.stepCount}>Steps: {healthData.steps ?? '—'}</Text>
          <View style={styles.metricsContainer}>
            <Text style={styles.metric}>
              Calories: {healthData.calories !== null ? healthData.calories.toFixed(1) : '—'} kcal
              {healthData.caloriesSource !== 'measured' && (
                <Text style={styles.estimatedTag}> (Est.)</Text>
              )}
            </Text>
            <Text style={styles.metric}>
              Distance: {healthData.distance !== null ? healthData.distance.toFixed(2) : '—'} km
            </Text>
          </View>
          <Text style={styles.dataSource}>Data Source: Google Fit + Health Connect</Text>
          <Text style={styles.refreshTime}>Last updated: {new Date().toLocaleTimeString()}</Text>
          <View style={styles.buttonContainer}>
            <Button title="Refresh Now" onPress={fetchHealthData} disabled={loading} />
            <View style={styles.buttonSpacer} />
            <Button
              title="Debug Data Sources"
              onPress={() => {
                if (HealthConnectLibrary.openHealthConnectDataManagement) {
                  HealthConnectLibrary.openHealthConnectDataManagement();
                } else {
                  Linking.openURL('package:com.google.android.apps.healthdata').catch(() =>
                    Linking.openURL('market://details?id=com.google.android.apps.healthdata')
                  );
                }
              }}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, marginBottom: 12, textAlign: 'center' },
  stepCount: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  metric: { fontSize: 24, textAlign: 'center', marginVertical: 10 },
  warning: { fontSize: 16, color: 'red' },
  errorDetails: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  instructions: { fontSize: 16, textAlign: 'center', marginVertical: 15 },
  appInfo: { fontSize: 12, color: '#888', marginVertical: 10 },
  dataSource: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 20 },
  refreshTime: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 30 },
  estimatedTag: { fontSize: 14, fontStyle: 'italic', color: '#888' },
  metricsContainer: { marginVertical: 15 },
  buttonContainer: { width: '80%', marginTop: 10, alignSelf: 'center' },
  buttonSpacer: { height: 15 },
});

export default StepScreen;
