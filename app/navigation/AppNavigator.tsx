import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReportsScreen from '../screens/ReportsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import CommentScreen from '../screens/CommentScreen';
import DMsScreen from '../screens/DMsScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import StepsScreen from '../screens/StepsScreen';
import WarmupScreen from '../screens/WarmupScreen';
import ExerciseScreen from '../screens/ExerciseScreen';
import { NavigationContainer } from '@react-navigation/native';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Reports" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Nutrition" component={NutritionScreen} />
        <Stack.Screen name="CommentScreen" component={CommentScreen} />
        <Stack.Screen name="DMs" component={DMsScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
        <Stack.Screen name="Steps" component={StepsScreen} />
        <Stack.Screen name="Warmup" component={WarmupScreen} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
