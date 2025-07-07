import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import TrackingOptionsModal from '../components/TrackingOptionsModal';
import { useNavigation } from '@react-navigation/native';

const WeeklyCheckInForm = () => {
  const navigation = useNavigation();
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);

  useEffect(() => {
    // Show the tracking modal when the screen mounts
    const timeout = setTimeout(() => {
      setTrackingModalVisible(true);
    }, 500); // Short delay for better UX

    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Your Weekly Form content here */}
      <View style={styles.content}>
        <Text style={styles.headerText}>Weekly Check-in</Text>
        {/* Add your form content here */}
      </View>

      {/* Tracking Options Modal */}
      <TrackingOptionsModal 
        visible={trackingModalVisible}
        onClose={() => setTrackingModalVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081A2F',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
});

export default WeeklyCheckInForm;