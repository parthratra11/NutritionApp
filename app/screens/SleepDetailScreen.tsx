import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WeekCalendar from '../components/WeekCalendar';
import Navbar from '../components/navbar';
import { getCurrentWeekDates } from '../utils/dateUtils';

const TIMEFRAMES = ['D', 'W', 'M', '6M', 'Y'];

const SleepDetailScreen = ({ route }) => {
  const { selectedQuality } = route.params || {};
  const weekDates = getCurrentWeekDates();
  const [topRange, setTopRange] = useState('W');
  const [bottomRange, setBottomRange] = useState('W');

  return (
    <SafeAreaView style={styles.containerWithWhiteSpace}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Blue header + calendar */}
        <View style={styles.blueContent}>
          <WeekCalendar
            weekDates={weekDates}
            containerStyle={styles.calendarContainerStyle}
          />

          <View style={styles.rangeTabs}>
            {TIMEFRAMES.map(tf => (
              <TouchableOpacity
                key={tf}
                style={[styles.tabBtn, topRange === tf && styles.tabBtnActive]}
                onPress={() => setTopRange(tf)}
              >
                <Text
                  style={[styles.tabText, topRange === tf && styles.tabTextActive]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Image
            source={require('../assets/dummy/BarGraphSleep.png')}
            style={styles.barGraphImage}
          />
        </View>

        {/* Bottom white section */}
        <View style={styles.bottomSection}>
          <View style={styles.rangeTabsSecondary}>
            {TIMEFRAMES.map(tf => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.tabBtnSecondary,
                  bottomRange === tf && styles.tabBtnSecondaryActive,
                ]}
                onPress={() => setBottomRange(tf)}
              >
                <Text
                  style={[
                    styles.tabTextSecondary,
                    bottomRange === tf && styles.tabTextSecondaryActive,
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Image
            source={require('../assets/dummy/LineGraphSleep.png')}
            style={styles.lineGraphImage}
          />

         
        </View>
      </ScrollView>

      <Navbar activeScreen="WeeklyForm" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerWithWhiteSpace: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding for navbar
  },
  blueContent: {
    backgroundColor: '#081A2F',
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
    alignItems: 'center',
  },
  calendarContainerStyle: {
    width: '100%',
    marginVertical: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  rangeTabs: {
    flexDirection: 'row',
    backgroundColor: '#EBEBEB54',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
    alignSelf: 'center',
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 22,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#C7312B',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#081A2F',
  },
  tabTextActive: {
    color: '#fff',
  },
  barGraphImage: {
    width: '100%',
    height: 265,
    resizeMode: 'contain',
    marginTop: 10,
  },
  bottomSection: {
    backgroundColor: '#fff',
    marginTop: 18,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  rangeTabsSecondary: {
    flexDirection: 'row',
    backgroundColor: '#EBEBEB',
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 14,
  },
  tabBtnSecondary: {
    paddingVertical: 6,
    paddingHorizontal: 22,
    borderRadius: 6,
  },
  tabBtnSecondaryActive: {
    backgroundColor: '#C7312B',
  },
  tabTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#081A2F',
  },
  tabTextSecondaryActive: {
    color: '#fff',
  },

lineGraphImage: {
  width: '100%',  // Changed from 160% to 100%
  height: 220,
  resizeMode: 'contain',
  alignSelf: 'center',  // Added to center horizontally
  marginRight: 0,  // Remove the right margin that was shifting it
},
  selectedQualityBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#C7312B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  selectedQualityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default SleepDetailScreen;