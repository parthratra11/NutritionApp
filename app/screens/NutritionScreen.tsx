import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext'; // <-- Add this line
import { SafeAreaView } from 'react-native-safe-area-context';

const mealFields = ['Protein (g)', 'Fat (g)', 'Carbohydrate (g)', 'Kcal'];

const defaultMeals = {
  training: ['Pre-workout', 'Lunch', 'Afternoon', 'Dinner'],
  rest: ['Late Lunch', 'Dinner'],
};

export default function NutritionScreen() {
  const { isDarkMode } = useTheme(); // <-- Add this line
  const [dayType, setDayType] = useState('training');
  const [mealData, setMealData] = useState({});

  const handleChange = (meal, field, value) => {
    setMealData((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value,
      },
    }));
  };

  const calculateTotal = (field) => {
    const meals = defaultMeals[dayType];
    return meals.reduce((sum, meal) => {
      const val = parseFloat(mealData[meal]?.[field] || '0');
      return sum + val;
    }, 0);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={[
          styles.container,
          isDarkMode && styles.containerDark, // <-- Add dark mode style
        ]}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>🍽️ Nutrition Tracker</Text>

        <View style={styles.pickerContainer}>
          <Text style={[styles.label, isDarkMode && styles.textDark]}>Select Day Type:</Text>
          <View style={[styles.pickerWrapper, isDarkMode && styles.pickerWrapperDark]}>
            <Picker
              selectedValue={dayType}
              onValueChange={(value) => setDayType(value)}
              style={[styles.picker, isDarkMode && styles.pickerDark]}
              dropdownIconColor={isDarkMode ? '#a5b4fc' : '#6366f1'}>
              <Picker.Item label="Training Day" value="training" />
              <Picker.Item label="Rest Day" value="rest" />
              <Picker.Item label="Cardio Day" value="cardio" />
            </Picker>
          </View>
        </View>

        <View>
          {defaultMeals[dayType].map((meal, idx) => (
            <View
              key={meal}
              style={[
                styles.mealCard,
                { borderLeftColor: colors[idx % colors.length] },
                isDarkMode && styles.mealCardDark,
              ]}>
              <Text style={[styles.mealTitle, isDarkMode && styles.textDark]}>{meal}</Text>
              {mealFields.map((field) => (
                <View key={field} style={styles.inputRow}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>{field}</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && styles.inputDark]}
                    keyboardType="numeric"
                    value={mealData[meal]?.[field] || ''}
                    onChangeText={(text) => handleChange(meal, field, text)}
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? '#888' : '#b2bec3'}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={[styles.totalContainer, isDarkMode && styles.totalContainerDark]}>
          <Text style={[styles.totalTitle, isDarkMode && styles.textDark]}>Total</Text>
          {mealFields.map((field) => (
            <Text key={field} style={[styles.totalText, isDarkMode && styles.textDark]}>
              {field}: <Text style={styles.totalValue}>{calculateTotal(field)}</Text>
            </Text>
          ))}
        </View>

        <View style={[styles.fiberCard, isDarkMode && styles.fiberCardDark]}>
          <Text style={[styles.fiberText, isDarkMode && styles.textDark]}>
            🌱 Daily Fibre Goal: <Text style={{ color: '#00b894' }}>38g</Text>
          </Text>
          <Text style={[styles.fiberText, isDarkMode && styles.textDark]}>
            🥗 Per Meal Min: <Text style={{ color: '#00b894' }}>8g</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = ['#6366f1', '#00b894', '#fdcb6e', '#e17055'];

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f6f7fb',
  },
  containerDark: {
    backgroundColor: '#181926',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    color: '#6366f1',
    letterSpacing: 1,
  },
  textDark: {
    color: '#fff',
  },
  pickerContainer: {
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  pickerWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    marginTop: 6,
    backgroundColor: '#fff',
  },
  pickerWrapperDark: {
    backgroundColor: '#232946',
    borderColor: '#444',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 52,
    color: '#6366f1',
  },
  pickerDark: {
    color: '#a5b4fc',
    backgroundColor: '#232946',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#636e72',
  },
  mealCard: {
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderLeftWidth: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mealCardDark: {
    backgroundColor: '#232946',
  },
  mealTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    flex: 1.2,
    fontSize: 15,
    color: '#636e72',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    fontSize: 15,
    color: '#22223b',
    marginLeft: 8,
  },
  inputDark: {
    backgroundColor: '#232946',
    borderColor: '#444',
    color: '#fff',
  },
  totalContainer: {
    marginTop: 24,
    padding: 18,
    backgroundColor: '#dfe6e9',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  totalContainerDark: {
    backgroundColor: '#232946',
  },
  totalTitle: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 10,
    color: '#6366f1',
  },
  totalText: {
    fontSize: 16,
    marginVertical: 2,
    color: '#636e72',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#00b894',
  },
  fiberCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#ffeaa7',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#fdcb6e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  fiberCardDark: {
    backgroundColor: '#232946',
  },
  fiberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636e72',
    marginVertical: 2,
  },
});
