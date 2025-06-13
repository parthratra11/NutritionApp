import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { logout } = useAuth();

  const buttonStyle = () => [
    styles.button,
    { backgroundColor: isDarkMode ? '#15803d' : '#22c55e' }, // Dark/Light emerald shades
  ];

  const buttonTextStyle = [
    styles.buttonText,
    { color: '#ffffff' }, // White text for contrast on green buttons
  ];

  const themeToggleTextStyle = [styles.buttonText, { color: isDarkMode ? '#ffffff' : '#000000' }];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#ffffff' }]}>
      {/* Theme Toggle Button */}
      <Pressable
        onPress={toggleDarkMode}
        style={[styles.themeToggle, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
        <Ionicons
          name={isDarkMode ? 'moon' : 'sunny'}
          size={24}
          color={isDarkMode ? '#ffffff' : '#000000'}
        />
        <Text style={themeToggleTextStyle}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
      </Pressable>

      {/* Navigation Buttons */}
      <Pressable onPress={() => navigation.navigate('Profile')} style={buttonStyle()}>
        <Text style={buttonTextStyle}>Profile</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Form')} style={buttonStyle()}>
        <Text style={buttonTextStyle}>Form</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Workout')} style={buttonStyle()}>
        <Text style={buttonTextStyle}>Workout</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Payment')} style={buttonStyle()}>
        <Text style={buttonTextStyle}>Payment</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Reports')} style={buttonStyle()}>
        <Text style={buttonTextStyle}>Reports</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('WeeklyForm')} style={buttonStyle()}>
        <Text style={buttonTextStyle}>Weekly Form</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Nutrition')} style={buttonStyle()}>
        <Text style={buttonTextStyle}>Nutrition</Text>
      </Pressable>

      <Pressable
        onPress={handleLogout}
        style={[buttonStyle(), { backgroundColor: isDarkMode ? '#991b1b' : '#dc2626' }]}>
        <Text style={buttonTextStyle}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
