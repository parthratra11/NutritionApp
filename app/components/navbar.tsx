import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useModal } from '../context/ModalContext';

// Import assets
const HomeIcon = require('../assets/home.png');
const ChatIcon = require('../assets/chat.png');
const AddIcon = require('../assets/add.png');
const WorkoutIcon = require('../assets/workout.png');
const NutritionIcon = require('../assets/nutrition.png');
const NavRectangle = require('../assets/NavRectangle.png');

type NavbarProps = {
  activeScreen?: 'Home' | 'Nutrition' | 'WeeklyForm' | 'Slack' | 'Workout' | 'Comments';
  opacityValue?: Animated.Value; // Add prop to pass in opacity value from parent
};

// Convert to forwardRef to expose methods
const Navbar = forwardRef<any, NavbarProps>(({ activeScreen, opacityValue }, ref) => {
  const navigation = useNavigation();
  const { setShowTrackingModal } = useModal();
  // Use provided opacity value or create our own
  const navOpacity = opacityValue || useRef(new Animated.Value(1)).current;
  const { width: screenWidth } = Dimensions.get('window');

  // Function to handle navigation and prevent navigating to the current screen
  const handleNavigate = (screen: string) => {
    if (activeScreen !== screen) {
      navigation.navigate(screen);
    }
  };

  // Function to handle the WeeklyForm/Add button
  const handleTrackingButton = () => {
    // Show the tracking modal instead of navigating
    setShowTrackingModal(true);
  };

  // Function to open Slack app or redirect to store if not installed
  const openSlackApp = async () => {
    const slackUrl = Platform.OS === 'ios' ? 'slack://' : 'slack://open';

    const slackStoreUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/slack-app/id618783545'
        : 'https://play.google.com/store/apps/details?id=com.Slack';

    try {
      const canOpen = await Linking.canOpenURL(slackUrl);
      if (canOpen) {
        await Linking.openURL(slackUrl);
      } else {
        // If Slack is not installed, open the app store
        await Linking.openURL(slackStoreUrl);
      }
    } catch (error) {
      console.error('Error opening Slack app:', error);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    show: () => {
      Animated.timing(navOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    },
    hide: () => {
      Animated.timing(navOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
  }));

  return (
    <Animated.View style={[styles.bottomNavContainer, { opacity: navOpacity }]}>
      <Image source={NavRectangle} style={styles.bottomNavBg} />
      <View style={styles.bottomNavContent}>
        <Pressable onPress={() => handleNavigate('Reports')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={HomeIcon} style={styles.bottomNavIcon} />
            {activeScreen === 'Home' && <View style={styles.activeEclipse} />}
          </View>
        </Pressable>

        <Pressable onPress={() => handleNavigate('Nutrition')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={NutritionIcon} style={styles.bottomNavIcon} />
            {activeScreen === 'Nutrition' && <View style={styles.activeEclipse} />}
          </View>
        </Pressable>

        <Pressable onPress={handleTrackingButton} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={AddIcon} style={styles.bottomNavIcon} />
            {activeScreen === 'WeeklyForm' && <View style={styles.activeEclipse} />}
          </View>
        </Pressable>

        <Pressable onPress={() => handleNavigate('CommentScreen')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={ChatIcon} style={styles.bottomNavIcon} />
            {activeScreen === 'Comments' && <View style={styles.activeEclipse} />}
          </View>
        </Pressable>

        <Pressable onPress={() => handleNavigate('Workout')} style={styles.navItem}>
          <View style={styles.iconContainer}>
            <Image source={WorkoutIcon} style={styles.bottomNavIcon} />
            {activeScreen === 'Workout' && <View style={styles.activeEclipse} />}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bottomNavContainer: {
    height: 55,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  bottomNavBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
    bottom: 0,
    left: 0,
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 24,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeEclipse: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#C7312B',
    opacity: 0.6,
    top: -3.5,
    left: -3.5,
  },
  bottomNavIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    zIndex: 2,
  },
});

export default Navbar;
export default Navbar;
