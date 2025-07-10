import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

export default function AddressScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAddress, setCheckingAddress] = useState(true);

  // Check if user already has address information
  useEffect(() => {
    const checkExistingAddress = async () => {
      if (!user?.email) return;

      try {
        const userDocRef = doc(db, 'intakeForms', user.email);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().address) {
          // User already has address, redirect to home
          navigation.navigate('Reports');
          return;
        }
      } catch (error) {
        console.error('Error checking address:', error);
      } finally {
        setCheckingAddress(false);
      }
    };

    checkExistingAddress();
  }, [user?.email, navigation]);

  const handleContinue = async () => {
    if (!houseNumber || !street || !postalCode || !city || !country) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user?.email) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setLoading(true);

    try {
      // Check if user document exists in intakeForms
      const userDocRef = doc(db, 'intakeForms', user.email);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // Update existing document with address information
        await updateDoc(userDocRef, {
          address: {
            houseNumber,
            street,
            postalCode,
            city,
            country,
          },
          addressUpdatedAt: new Date().toISOString(),
        });
      } else {
        Alert.alert('Error', 'User profile not found. Please complete registration first.');
        return;
      }

      Alert.alert('Success', 'Address information saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to Home after successful address save
            navigation.navigate('Payment');
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking existing address
  if (checkingAddress) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#081A2F" />
        <LinearGradient
          colors={['#081A2F', '#0D2A4C', '#195295']}
          style={[styles.gradient, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#081A2F" />
      <LinearGradient
        colors={['#081A2F', '#0D2A4C', '#195295']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}>
        <SafeAreaView style={styles.safeAreaContent}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              keyboardShouldPersistTaps="handled">
              <View style={styles.formContainer}>
                <Text style={styles.title}>Address</Text>

                <TextInput
                  style={styles.input}
                  placeholder="House Number"
                  placeholderTextColor="#B6C3D1"
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Street"
                  placeholderTextColor="#B6C3D1"
                  value={street}
                  onChangeText={setStreet}
                  autoCapitalize="words"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Postal code"
                  placeholderTextColor="#B6C3D1"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  autoCapitalize="characters"
                />

                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#B6C3D1"
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  placeholderTextColor="#B6C3D1"
                  value={country}
                  onChangeText={setCountry}
                  autoCapitalize="words"
                />

                <TouchableOpacity
                  style={[styles.buttonMain, loading && styles.buttonDisabled]}
                  onPress={handleContinue}
                  disabled={loading}>
                  <Text style={styles.buttonMainText}>{loading ? 'Saving...' : 'Continue'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081A2F', // Match gradient starting color
  },
  gradient: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
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
  buttonMain: {
    width: 300,
    height: 44,
    backgroundColor: '#111',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
});
