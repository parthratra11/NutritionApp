import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FormScreen from '../screens/FormScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import WeeklyCheckInForm from '../screens/WeeklyForm';
import ReportScreen from 'screens/ReportScreen';
import NutritionScreen from 'screens/NutritionScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {user ? (
        // Protected screens
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Form" component={FormScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="Workout" component={WorkoutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Reports" component={ReportScreen} />
          <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="WeeklyForm"
            component={WeeklyCheckInForm}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Auth screens
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
