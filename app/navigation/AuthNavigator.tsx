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
import LandingScreen from '../screens/LandingScreen';
import AuthRedirectScreen from 'screens/AuthRedirectScreen';
import SlackScreen from 'screens/SlackScreen';
import StepScreen from 'screens/StepScreen';
import ProgressScreen from 'screens/ProgressScreen';
import AddressScreen from '../screens/Address';
import ExerciseScreen from '../screens/Exercise';
import WarmupScreen from '../screens/Warmup';
import CronoScreen from 'screens/CronoScreen';
import DetailedFitnessScreen from 'screens/DetailedFitnessScreen';
import WeightScreen from '../screens/WeightScreen';
import MoodScreen from '../screens/MoodScreen';
import SleepScreen from 'screens/SleepScreen';
const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {user ? (
        // Protected screens
        <>
          <Stack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Form" component={FormScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Workout" component={WorkoutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Reports" component={ReportScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Progress" component={ProgressScreen} />
          <Stack.Screen
            name="DetailedFitnessScreen"
            component={DetailedFitnessScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Cronometer"
            component={CronoScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Exercise"
            component={ExerciseScreen}
            options={{
              headerShown: false,
              cardStyle: { backgroundColor: 'transparent' },
              cardOverlayEnabled: true,
              presentation: 'transparentModal',
            }}
          />
          <Stack.Screen
            name="Warmup"
            component={WarmupScreen}
            options={{
              headerShown: false,
              cardStyle: { backgroundColor: 'transparent' },
              cardOverlayEnabled: true,
              presentation: 'transparentModal',
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="Steps" component={StepScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Weight" component={WeightScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Mood" component={MoodScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Sleep" component={SleepScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Nutrition"
            component={NutritionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WeeklyForm"
            component={WeeklyCheckInForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Slack" component={SlackScreen} options={{ headerShown: false }} />
        </>
      ) : (
        // Auth screens
        <>
          <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}
