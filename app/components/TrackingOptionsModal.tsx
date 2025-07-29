import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TrackingOption = ({ icon, title, onPress }) => {
  return (
    <TouchableOpacity style={styles.optionButton} onPress={onPress}>
      <View style={styles.optionContent}>
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={styles.optionText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );
};

const TrackingOptionsModal = ({ visible, onClose, navigation }) => {
  const navigateToScreen = (screenName) => {
    onClose();
    if (navigation) {
      setTimeout(() => {
        navigation.navigate(screenName);
      }, 300); // Small delay for better UX
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={80} style={styles.blurView} tint="dark">
        <View style={styles.modalContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.titleText}>What would you like to input today?</Text>
            
            <View style={styles.optionsContainer}>
              <TrackingOption 
                icon={<Ionicons name="footsteps" size={24} color="#FFFFFF" />}
                title="Steps"
                onPress={() => navigateToScreen('Steps')}
              />
              
              <TrackingOption 
                icon={<Ionicons name="restaurant-outline" size={24} color="#FFFFFF" />}
                title="Nutrition"
                onPress={() => navigateToScreen('Nutrition')}
              />
              
              <TrackingOption 
                icon={<Ionicons name="body-outline" size={24} color="#FFFFFF" />}
                title="Weight"
                onPress={() => navigateToScreen('Weight')}
              />
              
              <TrackingOption 
                icon={<Ionicons name="bed-outline" size={24} color="#FFFFFF" />}
                title="Sleep"
                onPress={() => navigateToScreen('Sleep')}
              />
              
              <TrackingOption 
                icon={<Ionicons name="happy-outline" size={24} color="#FFFFFF" />}
                title="Mood"
                onPress={() => navigateToScreen('Mood')}
              />
              
              {/* Weekly Check-in Tracking Option */}
              <TrackingOption 
                icon={<Ionicons name="calendar-outline" size={24} color="#FFFFFF" />}
                title="Check-in"
                onPress={() => navigateToScreen('WeeklyForm')}
              />
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#051124',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Extra padding for iOS home indicator
  },
  headerContainer: {
    paddingTop: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 10,
  },
  contentContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  titleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  optionsContainer: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    marginRight: 15,
    alignItems: 'center',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
});

export default TrackingOptionsModal;