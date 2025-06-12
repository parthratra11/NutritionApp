import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import FormScreen from './screens/FormScreen';
import LoginScreen from './screens/LoginScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import PaymentScreen from './screens/PaymentScreen';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import WeeklyCheckInForm from './screens/WeeklyForm';
import AuthNavigator from './navigation/AuthNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
