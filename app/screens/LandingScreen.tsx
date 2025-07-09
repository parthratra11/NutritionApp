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
  Dimensions,
} from 'react-native';

// Get device dimensions for better image sizing
const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Set StatusBar to translucent */}
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle="light-content" 
      />
      
      {/* Full screen background image - shifted to the right */}
      <Image
        source={require('../assets/loginbg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Content container with SafeAreaView for proper insets */}
      <SafeAreaView style={styles.safeAreaContent}>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Remove background color to ensure image shows fully
    backgroundColor: 'transparent', 
    overflow: 'hidden', // Prevent image from spilling outside
  },
  backgroundImage: {
    position: 'absolute',
    width: width * 1.6, // Make image wider than screen
    height: height * 1.05, // Make image taller than screen to avoid any gaps
    top: 0,
    // Shift image to right by making left negative
    left: -width * 0.35, 
    right: 0,
    bottom: 0,
    // Transform can also help shift the image if needed
    transform: [{ translateX: -80 }], // Shift right by 15 points
  },
  safeAreaContent: {
    flex: 1,
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