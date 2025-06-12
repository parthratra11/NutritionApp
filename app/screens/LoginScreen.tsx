import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const navigation = useNavigation();
  const { setUser } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (isSignup) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        setUser(user);
        Alert.alert('Success', 'Account created successfully');
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        setUser(user);
        Alert.alert('Success', 'Logged in successfully');
      }
    } catch (error: any) {
      if (isSignup && error.code === 'auth/email-already-in-use') {
        Alert.alert('Account Exists', 'This email is already in use. Please log in instead.');
      } else if (
        !isSignup &&
        (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')
      ) {
        Alert.alert('Login Failed', 'Incorrect email or password.');
      } else {
        Alert.alert('Error', 'Please enter valid credentials');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>

            <Image
              source={require('../assets/placeholder/login.png')}
              style={[styles.logo, isDarkMode && styles.logoDark]}
            />

            <Text style={[styles.title, isDarkMode && styles.textDark]}>
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </Text>

            <Text style={[styles.subtitle, isDarkMode && styles.textDark]}>
              {isSignup ? 'Sign up to get started' : 'Login to continue'}
            </Text>

            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Email"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Password"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.buttonPrimary, isDarkMode && styles.buttonPrimaryDark]}
              onPress={handleSubmit}>
              <Text style={styles.buttonText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonSecondary, isDarkMode && styles.buttonSecondaryDark]}
              onPress={() => setIsSignup(!isSignup)}>
              <Text style={[styles.buttonSecondaryText, isDarkMode && styles.textDark]}>
                {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeAreaDark: {
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    position: 'relative',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    tintColor: '#333',
  },
  logoDark: {
    tintColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 25,
  },
  textDark: {
    color: '#fff',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#fff',
  },
  buttonPrimary: {
    width: '100%',
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 2,
  },
  buttonPrimaryDark: {
    backgroundColor: '#4338ca',
  },
  buttonSecondary: {
    width: '100%',
    height: 50,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonSecondaryDark: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
  },
});
