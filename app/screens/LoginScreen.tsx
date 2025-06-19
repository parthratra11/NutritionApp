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
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth } from '../firebaseConfig.js';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import { useEffect } from 'react';

export default function LoginScreen() {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  //const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const { login } = useAuth();
  const route = useRoute();
  const initialMode = route.params?.mode === 'signup';
  const [isSignup, setIsSignup] = useState(initialMode);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (isSignup && !acceptPolicy) {
      Alert.alert('Required', 'You must accept the Privacy Policy to sign up.');
      return;
    }

    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        Alert.alert(
          'Verify Email',
          'Account created! Please check your email and verify your address before logging in.'
        );
        setIsSignup(false);
      } else {
        await login(email, password);
        Alert.alert('Success', 'Logged in successfully');
      }
    } catch (error) {
      if (isSignup && error.code === 'auth/email-already-in-use') {
        Alert.alert('Account Exists', 'This email is already in use. Please log in instead.');
      } else if (error.code === 'auth/email-not-verified') {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address before logging in. Check your inbox for a verification email.'
        );
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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Forgot Password', 'Please enter your email address above first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset',
        'A password reset email has been sent. Please check your inbox.'
      );
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No user found with this email address.');
      } else {
        Alert.alert('Error', 'Failed to send password reset email.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#081A2F', '#0D2A4C', '#195295']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <Text style={styles.title}>{isSignup ? 'Signup' : 'Login'}</Text>
              <TextInput
                style={styles.input}
                placeholder={isSignup ? 'Email' : 'Phone/ Email'}
                placeholderTextColor="#B6C3D1"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.inputPasswordContainer}>
                <TextInput
                  style={[styles.input, { marginBottom: 0, flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="#B6C3D1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#B6C3D1"
                  />
                </TouchableOpacity>
              </View>
              {/* Privacy Policy for Signup */}
              {isSignup && (
                <TouchableOpacity
                  style={styles.privacyRow}
                  onPress={() => setAcceptPolicy(!acceptPolicy)}
                  activeOpacity={0.8}
                >
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
              <TouchableOpacity style={styles.buttonMain} onPress={handleSubmit}>
                <Text style={styles.buttonMainText}>{isSignup ? 'Signup' : 'Login'}</Text>
              </TouchableOpacity>
              {/* Forgot Password */}
              {!isSignup && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
              {/* Switch between Login/Signup */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {isSignup
                    ? 'Already have an account? '
                    : "Don't have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
                  <Text style={styles.switchLink}>
                    {isSignup ? 'Login' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Social Login */}
              <Text style={styles.signInWithText}>
                {isSignup ? 'Sign Up with' : 'Sign in with'}
              </Text>
              <View style={styles.socialRow}>
                <TouchableOpacity>
                  <Image
                    source={require('../assets/apple.png')}
                    style={styles.socialIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Image
                    source={require('../assets/facebook.png')}
                    style={styles.socialIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Image
                    source={require('../assets/google.png')}
                    style={styles.socialIcon}
                  />
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
});
