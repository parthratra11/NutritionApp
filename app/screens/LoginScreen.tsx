import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const { login } = useAuth();
  const route = useRoute();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigation.navigate('MainTabs');
    } catch (error) {
      console.error('Login error:', error);
      // Error alert is handled in the AuthContext login function
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!acceptPolicy) {
      Alert.alert('Error', 'Please accept the privacy policy');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://10.0.2.2:8000/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone_number: phoneNumber || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // After successful signup, login the user automatically
      await login(email, password);

      navigation.navigate('Greetings');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message && error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection or try again later.'
        );
      } else {
        Alert.alert('Signup Failed', error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://10.0.2.2:8000/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Password reset failed');
      }

      Alert.alert('Success', 'Password reset instructions have been sent to your email');
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.message && error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection or try again later.'
        );
      } else {
        Alert.alert('Password Reset Failed', error.message || 'Please try again later');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#081A2F', '#0D2A4C', '#195295']} style={styles.gradient}>
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {/* Replace with logo that exists in your assets folder */}
            <Text style={styles.logoText}>CYMRON</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>

          {/* Form */}
          <View style={styles.form}>
            {isSignup && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#B6C3D1"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
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
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#B6C3D1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#B6C3D1" />
              </TouchableOpacity>
            </View>

            {isSignup && (
              <TextInput
                style={styles.input}
                placeholder="Phone Number (Optional)"
                placeholderTextColor="#B6C3D1"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            )}

            {isSignup && (
              <View style={styles.privacyRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAcceptPolicy(!acceptPolicy)}>
                  {acceptPolicy && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
                <Text style={styles.privacyText}>
                  I accept the <Text style={styles.link}>Privacy Policy</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isSignup ? handleSignup : handleLogin}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
              </Text>
            </TouchableOpacity>

            {!isSignup && (
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Toggle login/signup */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
              <Text style={styles.toggleLink}>{isSignup ? 'Login' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  form: {
    width: '100%',
    maxWidth: 320,
  },
  input: {
    backgroundColor: '#0D2A4C',
    borderRadius: 8,
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: '#0D2A4C',
    borderRadius: 8,
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 50, // Make room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  button: {
    backgroundColor: '#C7312B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6E7E92',
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#B6C3D1',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  toggleText: {
    color: '#B6C3D1',
    fontSize: 14,
    marginRight: 5,
  },
  toggleLink: {
    color: '#C7312B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
