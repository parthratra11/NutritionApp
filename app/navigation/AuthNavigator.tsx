import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
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
import SleepQualityScreen from 'screens/SleepQualityScreen';
import SleepDetailScreen from 'screens/SleepDetailScreen';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CommentScreen from 'screens/CommentScreen';
import Greetings from 'screens/FormScreens/Greetings';
import MeasurementChoice from 'screens/FormScreens/MeasurementChoice';
import WeightHeightScreen from 'screens/FormScreens/WeightHeightScreen';
import StrengthChoice from 'screens/FormScreens/StrengthChoice';
import Strength1 from '../screens/FormScreens/Strength1';
import Strength2 from '../screens/FormScreens/Strength2';
import OtherExercise from '../screens/FormScreens/OtherExercise';
import Goals from '../screens/FormScreens/Goals';
import DedicationLevel from '../screens/FormScreens/DedicationLevel';
import TrainingFrequency from '../screens/FormScreens/TrainingFrequency';
import Occupation from '../screens/FormScreens/Occupation';
import TrainingTime from '../screens/FormScreens/TrainingTime';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { user } = useAuth();
  const [isNewUser, setIsNewUser] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setInitialRoute('Landing');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has an intake form
        const userDocRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          
          // Determine which screen to show based on user's progress
          if (userData.isSignupOnly === true) {
            // New user needs to complete onboarding
            setIsNewUser(true);
            
            // Check if they have an address yet
            if (!userData.address) {
              setInitialRoute('Address');
            } else if (!userData.hasCompletedPayment) {
              setInitialRoute('Payment');
            } else {
              setInitialRoute('Form');
            }
          } else {
            // Returning user goes straight to Reports
            setInitialRoute('Reports');
          }
        } else {
          // If no document, treat as new user
          setIsNewUser(true);
          setInitialRoute('Address');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setInitialRoute('Reports'); // Default to Reports on error
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  if (isLoading || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName="Greetings">
      <Stack.Screen name="Greetings" component={Greetings} options={{ headerShown: false }} />
      <Stack.Screen name="MeasurementChoice" component={MeasurementChoice} options={{ headerShown: false }} />
      <Stack.Screen name="WeightHeight" component={WeightHeightScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StrengthChoice" component={StrengthChoice} options={{ headerShown: false }} />
      <Stack.Screen name="Strength1" component={Strength1} options={{ headerShown: false }} />
      <Stack.Screen name="Strength2" component={Strength2} options={{ headerShown: false }} />
      <Stack.Screen name="Goals" component={Goals} options={{ headerShown: false }} />
      <Stack.Screen name="OtherExercise" component={OtherExercise} options={{ headerShown: false }} />
      <Stack.Screen name="DedicationLevel" component={DedicationLevel} options={{ headerShown: false }} />
      <Stack.Screen name="TrainingFrequency" component={TrainingFrequency} options={{ headerShown: false }} />
      <Stack.Screen name="Occupation" component={Occupation} options={{ headerShown: false }} />
      <Stack.Screen name="TrainingTime" component={TrainingTime} options={{ headerShown: false }} />
      {user ? (
        // Protected screens
        <>
          {/* Initial route for new users */}
          <Stack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Form" component={FormScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Greetings" component={Greetings} options={{ headerShown: false }} />
          <Stack.Screen name="MeasurementChoice" component={MeasurementChoice} options={{ headerShown: false }} />
          <Stack.Screen name="WeightHeight" component={WeightHeightScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StrengthChoice" component={StrengthChoice} options={{ headerShown: false }} />
          <Stack.Screen name="Strength1" component={Strength1} options={{ headerShown: false }} />
          <Stack.Screen name="Strength2" component={Strength2} options={{ headerShown: false }} />
          <Stack.Screen name="Goals" component={Goals} options={{ headerShown: false }} />
          <Stack.Screen name="OtherExercise" component={OtherExercise} options={{ headerShown: false }} />
          <Stack.Screen name="DedicationLevel" component={DedicationLevel} options={{ headerShown: false }} />
          <Stack.Screen name="TrainingFrequency" component={TrainingFrequency} options={{ headerShown: false }} />
          <Stack.Screen name="Occupation" component={Occupation} options={{ headerShown: false }} />
          <Stack.Screen name="TrainingTime" component={TrainingTime} options={{ headerShown: false }} />
          {/* Main app screens */}
          <Stack.Screen name="Reports" component={ReportScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Workout" component={WorkoutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Comment" component={CommentScreen} options={{ headerShown: false }} />
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
          <Stack.Screen name="SleepQualityScreen" component={SleepQualityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SleepDetailScreen" component={SleepDetailScreen} options={{ headerShown: false }} />
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