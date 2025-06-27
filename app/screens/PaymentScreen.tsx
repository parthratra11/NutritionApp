import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Import payment assets
const PaymentBig = require('../assets/Payment/PaymentBig.png');
const PaymentProgress = require('../assets/Payment/PaymentProgress.png');
const PaymentFood = require('../assets/Payment/PaymentFood.png');
const PaymentGym = require('../assets/Payment/PaymentGym.png');
const PaymentChat = require('../assets/Payment/PaymentChat.png');
const Payment1 = require('../assets/Payment/Payment1.png');
const Payment2 = require('../assets/Payment/Payment2.png');

export default function PaymentScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const handleSubscribe = () => {
    // Handle subscription logic here
    console.log('Subscribe pressed');
    // For now, navigate to Address screen
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#081A2F', '#0D2A4C', '#195295']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Unlock Your Full</Text>
            <Text style={styles.title}>Potential 💪</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Get personalized fitness plans, progress tracking, nutrition
            advice, and expert support — all in one place. Start
            transforming your lifestyle today.
          </Text>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What You Get:</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Image source={PaymentGym} style={styles.featureIcon} />
                <Text style={styles.featureText}>Tailored workout programs</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Image source={PaymentFood} style={styles.featureIcon} />
                <Text style={styles.featureText}>Nutrition & meal tracking</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Image source={PaymentProgress} style={styles.featureIcon} />
                <Text style={styles.featureText}>Progress analytics</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Image source={PaymentChat} style={styles.featureIcon} />
                <Text style={styles.featureText}>Access to expert advice</Text>
              </View>
            </View>
          </View>

          {/* Bottom Section with Price */}
          <View style={styles.bottomSection}>
            {/* Big transparent rectangle */}
            <Image source={PaymentBig} style={styles.paymentBig} />
            
            {/* Price Container */}
            <View style={styles.priceContainer}>
              <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
                <Text style={styles.priceText}>$9.99/ month</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom shapes */}
          <Image source={Payment1} style={styles.payment1} />
          <Image source={Payment2} style={styles.payment2} />
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
    paddingHorizontal: 28,
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
  },
  description: {
    color: '#ffff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    bottom: -30,
  },
  featuresTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresList: {
    paddingHorizontal: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    
    padding: 4,
    borderRadius: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
    resizeMode: 'contain',
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 40,
  },
  paymentBig: {
    position: 'absolute',
    bottom: 500,
    width: '100%',
    height: 300,
    resizeMode: 'stretch',
  },
  priceContainer: {
    zIndex: 2,
    marginBottom: -10,
  },
  subscribeButton: {
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  payment1: {
    position: 'absolute',
    bottom: -10,
    left: 1,
    width: '120%',
    height: 180,
    resizeMode: 'stretch',
    zIndex: 1,
  },
  payment2: {
    position: 'absolute',
    bottom: -15,
    left: 2,
    width: '120%',
    height: 200,
    resizeMode: 'stretch',
    zIndex: 1,
  },
});
