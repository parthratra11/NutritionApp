import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import ProgressBar from '../../components/ProgressBar';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Welcome({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Animation values
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);
  const translateY = new Animated.Value(30);

  // Text animation values
  const textOpacity = new Animated.Value(0);
  const textTranslateY = new Animated.Value(20);

  useEffect(() => {
    // Mark intake form as completed
    const completeIntakeForm = async () => {
      if (!user?.id || !user?.token) return;

      try {
        await fetch(`http://localhost:8000/intake_forms/complete/${user.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error marking form as complete:', error);
      }
    };

    completeIntakeForm();

    // Card animation
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();

    // Text animation (starts with a delay)
    setTimeout(() => {
      Animated.stagger(300, [
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }, 600);

    // Auto-navigate to the next screen after a delay
    const timer = setTimeout(() => {
      navigation.navigate('Reports', previousParams);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <BackgroundWrapper>
      <ProgressBar progress={1.0} barHeight={8} />
      <View style={styles.container}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.28)',
            'rgba(255, 255, 255, 0.23)',
            'rgba(255, 255, 255, 0.00)',
          ]}
          locations={[0, 0.7019, 0.9663]}
          style={styles.gradientCard}>
          <Animated.View
            style={[
              styles.animatedContent,
              {
                opacity,
                transform: [{ scale }, { translateY }],
              },
            ]}>
            <Animated.Text
              style={[
                styles.welcomeText,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}>
              Welcome!
            </Animated.Text>

            <Animated.Text
              style={[
                styles.descriptionText,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}>
              Your coach will review your info.
            </Animated.Text>
          </Animated.View>
        </LinearGradient>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.034, // 14px from design
  },
  gradientCard: {
    width: screenWidth * 0.92, // 379px from design
    height: screenHeight * 0.75, // 690px from design
    borderRadius: 74,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: -5,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6.5,
    elevation: 8,
    marginTop: screenHeight * 0.095, // Approximately 182px from design
  },
  animatedContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.075,
  },
  welcomeText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.155, // 64px from design
    fontWeight: '900',
    lineHeight: screenWidth * 0.164, // 106% line height
    marginBottom: screenHeight * 0.08,
  },
  descriptionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Texta',
    fontSize: screenWidth * 0.087, // 36px from design
    fontWeight: '350',
    maxWidth: screenWidth * 0.84, // 346px from design
  },
});
