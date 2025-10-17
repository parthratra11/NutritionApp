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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi, intakeFormApi } from '../api/client';

export default function LoginScreen() {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const route = useRoute();
  const initialMode = route.params?.mode === 'signup';
  const [isSignup, setIsSignup] = useState(initialMode);

  // Display processing overlay during API operations
  const renderProcessingOverlay = () => {
    if (!loading) return null;

    return (
      <View style={styles.processingOverlay}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>{processingStep || 'Processing...'}</Text>
        </View>
      </View>
    );
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignup) {
      if (!fullName || !phoneNumber) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (!acceptPolicy) {
        Alert.alert('Required', 'You must accept the Privacy Policy to sign up.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignup) {
        setProcessingStep('Creating your account...');

        // Generate a unique user ID
        const userId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

        // Create user data object
        const userData = {
          user_id: userId,
          email: email.toLowerCase(),
          full_name: fullName,
          phone_number: phoneNumber,
          is_signup_only: true,
        };

        console.log('Creating user with data:', JSON.stringify(userData));

        try {
          // Create user using API client
          const createdUser = await userApi.createUser(userData);
          console.log('User created:', JSON.stringify(createdUser));

          setProcessingStep('Initializing your profile...');
          // Initialize the intake form for this user
          await intakeFormApi.initializeForm(email.toLowerCase());

          // Store credentials for auto login
          await AsyncStorage.setItem(
            'authCredentials',
            JSON.stringify({
              email: email.toLowerCase(),
              password,
              userId,
              fullName,
              phoneNumber,
            })
          );

          // Set user in auth context
          setUser({
            uid: userId,
            email: email.toLowerCase(),
            displayName: fullName,
            phoneNumber: phoneNumber,
          });

          setProcessingStep('Success!');
          // Navigate to address screen
          navigation.navigate('Address');
        } catch (error: any) {
          console.error('API error:', error);
          if (error.message && error.message.includes('400')) {
            Alert.alert('Account Exists', 'This email is already in use. Please log in instead.');
          } else {
            throw error; // Re-throw for the outer catch
          }
        }
      } else {
        setProcessingStep('Logging in...');

        try {
          // Get user by email using API client
          const userData = await userApi.getUserByEmail(email.toLowerCase());

          console.log('User login successful:', JSON.stringify(userData));

          // Store credentials for next time
          await AsyncStorage.setItem(
            'authCredentials',
            JSON.stringify({
              email: email.toLowerCase(),
              password,
              userId: userData.user_id,
              fullName: userData.full_name,
              phoneNumber: userData.phone_number,
            })
          );

          // Set user in auth context
          setUser({
            uid: userData.user_id,
            email: userData.email,
            displayName: userData.full_name,
            phoneNumber: userData.phone_number,
          });

          setProcessingStep('Checking profile status...');
          // Check if the user has completed the intake form
          const intakeForm = await intakeFormApi.getIntakeForm(email.toLowerCase());

          setProcessingStep('Success!');
          // Navigate based on user's progress
          if (intakeForm?.intake_form_completed) {
            navigation.navigate('Reports');
          } else {
            navigation.navigate('Address');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          if (error.message && error.message.includes('404')) {
            Alert.alert('Login Failed', 'User not found. Please check your email or sign up.');
          } else {
            Alert.alert('Login Failed', 'Incorrect email or password.');
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'There was a problem connecting to the server. Please try again later.');
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Forgot Password', 'Please enter your email address above first.');
      return;
    }

    // For now, just show an alert - you can implement a real password reset later
    Alert.alert(
      'Password Reset',
      'If your email exists in our system, a password reset link will be sent to your inbox.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#081A2F', '#0D2A4C', '#195295']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
              <Text style={styles.title}>{isSignup ? 'Signup' : 'Login'}</Text>
              {isSignup && (
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#B6C3D1"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B6C3D1"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {isSignup && (
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#B6C3D1"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              )}
              <View style={styles.inputPasswordContainer}>
                <TextInput
                  style={[styles.input, { marginBottom: 0, flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="#B6C3D1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#B6C3D1" />
                </TouchableOpacity>
              </View>
              {/* Privacy Policy for Signup */}
              {isSignup && (
                <TouchableOpacity
                  style={styles.privacyRow}
                  onPress={() => setAcceptPolicy(!acceptPolicy)}
                  activeOpacity={0.8}
                  disabled={loading}>
                  <Ionicons
                    name={acceptPolicy ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={acceptPolicy ? '#4ade80' : '#fff'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.privacyText}>
                    By continuing you accept our <Text style={styles.link}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.buttonMain, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}>
                <Text style={styles.buttonMainText}>
                  {loading ? 'Processing...' : isSignup ? 'Signup' : 'Login'}
                </Text>
              </TouchableOpacity>
              {/* Forgot Password */}
              {!isSignup && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                  disabled={loading}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
              {/* Switch between Login/Signup */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsSignup(!isSignup)} disabled={loading}>
                  <Text style={styles.switchLink}>{isSignup ? 'Login' : 'Sign Up'}</Text>
                </TouchableOpacity>
              </View>
              {/* Social Login */}
              <Text style={styles.signInWithText}>
                {isSignup ? 'Sign Up with' : 'Sign in with'}
              </Text>
              <View style={styles.socialRow}>
                <TouchableOpacity disabled={loading}>
                  <Image source={require('../assets/apple.png')} style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity disabled={loading}>
                  <Image source={require('../assets/facebook.png')} style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity disabled={loading}>
                  <Image source={require('../assets/google.png')} style={styles.socialIcon} />
                </TouchableOpacity>
              </View>
              {/* Cymron Logo */}
              <Image
                source={require('../assets/cymron-logo.png')}
                style={styles.cymronLogo}
                resizeMode="contain"
              />
            </View>
          </ScrollView>
          {renderProcessingOverlay()}
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081A2F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 28,
    marginTop: 10,
    alignSelf: 'center',
  },
  input: {
    width: 300,
    height: 44,
    backgroundColor: '#0D2A4C',
    borderRadius: 22,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 16,
    marginBottom: 18,
    alignSelf: 'center',
  },
  inputPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    marginBottom: 18,
    backgroundColor: '#0D2A4C',
    borderRadius: 22,
    paddingRight: 10,
  },
  eyeIcon: {
    padding: 8,
  },
  buttonMain: {
    width: 300,
    height: 44,
    backgroundColor: '#111',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  buttonMainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  switchText: {
    color: '#fff',
    fontSize: 14,
  },
  switchLink: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
  signInWithText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 18,
  },
  socialIcon: {
    width: 25,
    height: 25,
    marginHorizontal: 8,
  },
  cymronLogo: {
    width: 160,
    height: 60,
    alignSelf: 'center',
    marginTop: 10,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 0,
    alignSelf: 'flex-start',
    paddingLeft: 10,
    paddingVertical: 4,
  },
  privacyText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#fff',
    fontWeight: 'bold',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: '#195295',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});
