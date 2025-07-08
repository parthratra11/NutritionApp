import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';

interface WeekDate {
  day: string;
  date: string;
  full: Date;
  isToday: boolean;
}

interface WeekCalendarProps {
  weekDates: WeekDate[];
  onDatePress?: (date: WeekDate) => void;
  containerStyle?: object;
}

const WeekCalendar = ({ weekDates, onDatePress, containerStyle }: WeekCalendarProps) => {
  return (
    <View style={[styles.calendarContainer, containerStyle]}>
      {weekDates.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={[
            styles.dayContainer,
            item.isToday && styles.todayContainer
          ]}
          onPress={() => onDatePress && onDatePress(item)}
        >
          <Text style={[
            styles.dayLetter,
            item.isToday && styles.todayText
          ]}>{item.day}</Text>
          {item.isToday ? (
            <View style={styles.todayDateCircle}>
              <Text style={[styles.dayNumber, styles.todayText]}>{item.date}</Text>
            </View>
          ) : (
            <Text style={styles.dayNumber}>{item.date}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dayContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    minWidth: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Very light border on all days
  },
  todayContainer: {
    backgroundColor: '#878787',
    borderWidth: 0, // Remove border for today
  },
  dayLetter: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
    opacity: 0.7,
  },
  dayNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todayText: {
    color: '#fff',
    opacity: 1,
  },
  todayDateCircle: {
    backgroundColor: '#C7312B', // Red circle for today's date
    width: 24,
    height: 23,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WeekCalendar;