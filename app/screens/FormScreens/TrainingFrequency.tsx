import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TrainingFrequency({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};
  const [formData, setFormData] = useState<any>({});
  const [frequency, setFrequency] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) return;

      try {
        const docRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(data);
          setFrequency(data.weeklyFrequency ? parseInt(data.weeklyFrequency) : 1);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email]);

  const saveFormData = async (data: any) => {
    if (!user?.email) return;

    try {
      await setDoc(
        doc(db, 'intakeForms', user.email.toLowerCase()),
        {
          ...formData,
          ...data,
          email: user.email.toLowerCase(),
          lastUpdated: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const handleIncrement = () => {
    if (frequency < 7) {
      setFrequency(frequency + 1);
    }
  };

  const handleDecrement = () => {
    if (frequency > 1) {
      setFrequency(frequency - 1);
    }
  };

  const handleNext = async () => {
    await saveFormData({
      weeklyFrequency: frequency.toString(),
      trainingFrequencyCompleted: true,
    });
    navigation.navigate('Occupation', {
      ...previousParams,
      trainingFrequency: frequency,
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.42} barHeight={8} />
      <View style={styles.contentContainer}>
        <Text style={styles.mainTitle}>
          How often in a week would you be prepared to train for maximal results?
        </Text>

        <Text style={styles.subtitle}>
          (A higher weekly training frequency means less time spent in the gym per session)
        </Text>

        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={handleDecrement}
            disabled={frequency <= 1}>
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.counterValue}>{frequency}</Text>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={handleIncrement}
            disabled={frequency >= 7}>
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>&gt;</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.07,
    marginTop: screenHeight * 0.2,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.06,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: screenHeight * 0.02,
    lineHeight: screenWidth * 0.08,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.038,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: screenHeight * 0.08,
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: screenWidth * 0.02,
    width: screenWidth * 0.7,
    alignSelf: 'center',
  },
  counterButton: {
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    borderRadius: screenWidth * 0.06,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: 'Black',
    fontSize: screenWidth * 0.08,
    fontWeight: '600',
  },
  counterValue: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.1,
    fontWeight: '600',
    paddingHorizontal: screenWidth * 0.1,
  },
  buttonWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: screenHeight * 0.05,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.15,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    fontFamily: 'Texta',
    textAlign: 'center',
  },
});
