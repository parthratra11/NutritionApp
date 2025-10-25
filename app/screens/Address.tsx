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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { userApi, intakeFormApi } from '../api/client';

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
      if (!user?.email) {
        setCheckingAddress(false);
        return;
      }

      try {
        // Try to get address directly by user ID first (new method)
        try {
          const addressData = await userApi.getUserAddress(user.email.toLowerCase());
          console.log('Address data from direct query:', addressData);

          if (addressData && Array.isArray(addressData) && addressData.length > 0) {
            // Use the first address
            const address = addressData[0];
            setHouseNumber(address.house_number || '');
            setStreet(address.street || '');
            setPostalCode(address.postal_code || '');
            setCity(address.city || '');
            setCountry(address.country || '');

            console.log('Set address values from direct query:', {
              houseNumber: address.house_number || '',
              street: address.street || '',
              postalCode: address.postal_code || '',
              city: address.city || '',
              country: address.country || '',
            });
            setCheckingAddress(false);
            return;
          }
        } catch (addressError) {
          console.log('Could not get address directly, falling back to intake form:', addressError);
        }

        // Fallback: Fetch intake form data from SQL backend
        const intakeFormData = await intakeFormApi.getIntakeForm(user.email.toLowerCase());

        console.log('Received intake form data:', JSON.stringify(intakeFormData, null, 2));

        if (intakeFormData) {
          // Check for associated address data
          if (
            intakeFormData.address &&
            Array.isArray(intakeFormData.address) &&
            intakeFormData.address.length > 0
          ) {
            console.log(
              'Found address data in intake form:',
              JSON.stringify(intakeFormData.address[0], null, 2)
            );

            const addressData = intakeFormData.address[0];

            // Load existing address data if available
            setHouseNumber(addressData.house_number || '');
            setStreet(addressData.street || '');
            setPostalCode(addressData.postal_code || '');
            setCity(addressData.city || '');
            setCountry(addressData.country || '');
          } else {
            console.log('No address data found in response');
          }

          // If user has completed the form, redirect to Reports
          if (intakeFormData.intake_form_completed) {
            navigation.navigate('Reports');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking address:', error);
        // Do not show error alert for 404 (form not found)
        if (!(error instanceof Error && error.message.includes('404'))) {
          Alert.alert('Error', 'Could not retrieve your address information. Please try again.');
        }
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
      // Prepare address data in the format expected by the backend
      const addressData = {
        house_number: houseNumber,
        street: street,
        postal_code: postalCode,
        city: city,
        country: country,
      };

      // Save address to SQL backend using the POST method
      await userApi.updateUserAddress(user.email.toLowerCase(), addressData);

      // Update intake form with timestamp
      await intakeFormApi.updateIntakeForm(user.email.toLowerCase(), {
        last_updated: new Date().toISOString(),
      });

      Alert.alert('Success', 'Address information saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
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

  // Add backToLogin handler
  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  // Show loading while checking existing address
  if (checkingAddress) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#081A2F" />
        <LinearGradient
          colors={['#081A2F', '#0D2A4C', '#195295']}
          style={[styles.gradient, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', fontSize: 16, marginTop: 10 }}>Loading...</Text>
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
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Street"
                  placeholderTextColor="#B6C3D1"
                  value={street}
                  onChangeText={setStreet}
                  autoCapitalize="words"
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Postal code"
                  placeholderTextColor="#B6C3D1"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  autoCapitalize="characters"
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#B6C3D1"
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  placeholderTextColor="#B6C3D1"
                  value={country}
                  onChangeText={setCountry}
                  autoCapitalize="words"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.buttonMain, loading && styles.buttonDisabled]}
                  onPress={handleContinue}
                  disabled={loading}>
                  <Text style={styles.buttonMainText}>{loading ? 'Saving...' : 'Continue'}</Text>
                </TouchableOpacity>

                {/* New button to go back to Login */}
                <TouchableOpacity
                  style={[styles.backButton, loading && styles.buttonDisabled]}
                  onPress={handleBackToLogin}
                  disabled={loading}>
                  <Text style={styles.backButtonText}>Back to Login</Text>
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

  // Styles for the new Back to Login button
  backButton: {
    width: 300,
    height: 44,
    backgroundColor: 'transparent',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    marginTop: 12,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
