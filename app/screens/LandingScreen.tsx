import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../assets/loginbg.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Image
              source={require('../assets/cymron-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => navigation.navigate('Login', { mode: 'login' })}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => navigation.navigate('Login', { mode: 'signup' })}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081A2F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '160%',      // Increased to allow for shift without cropping
    height: '100%',
    transform: [
      { translateX: -80 }
    ],
    right: -80,        // Add right offset to prevent right side cropping
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 1,
  },
  logo: {
    width: 350,
    height: 60,
    marginBottom: 6,
  },
  subtitle: {
    color: '#fff',
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 2,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignSelf: 'center',
    marginBottom: 32,
    gap: 18,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    minWidth: 110,
  },
  buttonPrimary: {
    backgroundColor: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#B6C3D1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#195295',
  },
  buttonTextSecondary: {
    color: '#081A2F',
  },
});