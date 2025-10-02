import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, TextInput, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CurrentProgram({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [dietDescription, setDietDescription] = useState('');
  const [trainingProgram, setTrainingProgram] = useState('');
  const [photos, setPhotos] = useState([]);

  // Request permission to access the media library
  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload photos!');
        return false;
      }
      return true;
    }
    return true;
  };

  // Request permission to access the camera
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to take photos!');
        return false;
      }
      return true;
    }
    return true;
  };

  // Pick images from the device's media library
  const pickImages = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [3, 4],
      selectionLimit: 4,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Get the existing photos or initialize an empty array
      const currentPhotos = [...photos];
      
      // Add new photos up to a maximum of 4
      const newPhotos = result.assets.map(asset => asset.uri);
      const combinedPhotos = [...currentPhotos, ...newPhotos];
      
      // Limit to 4 photos maximum
      setPhotos(combinedPhotos.slice(0, 4));
    }
  };

  // Function to remove a photo by index
  const removePhoto = (indexToRemove) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  const handleNext = () => {
    navigation.navigate('Welcome', {
      ...previousParams,
      dietDescription,
      trainingProgram,
      bodyPhotos: photos,
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.99} barHeight={8} />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.labelText}>
              Please describe a typical day of eating in detail (or diet plan if following one), including snacking and alcohol.
            </Text>
            
            <TextInput
              style={styles.inputField}
              value={dietDescription}
              onChangeText={setDietDescription}
              placeholder=""
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
            />
          </View>
          
          {/* Add spacer */}
          <View style={styles.spacer} />
          
          <View style={styles.inputContainer}>
            <Text style={styles.labelText}>
              Please describe or attach your current training program in detail (if any)
            </Text>
            
            <TextInput
              style={styles.inputField}
              value={trainingProgram}
              onChangeText={setTrainingProgram}
              placeholder=""
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
            />
          </View>
          
          {/* Add spacer */}
          <View style={styles.spacer} />
          
          <View style={styles.photoSectionContainer}>
            <Text style={styles.labelText}>
              Please upload atleast four full-body pictures. Your natural relaxed posture.
            </Text>
            
            <Text style={styles.sublabelText}>
              (wearing shorts that don't cover your knees): front, both sides, and back. Shirtless if male or a vest if female.
            </Text>
            
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickImages}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload Photos</Text>
            </TouchableOpacity>
            
            {photos.length > 0 && (
              <View style={styles.photosPreviewContainer}>
                <Text style={styles.photosCountText}>
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'} selected
                </Text>
                
                {/* Display photo thumbnails with remove option */}
                <View style={styles.photoThumbnailsContainer}>
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.thumbnailContainer}>
                      <Image source={{ uri: photo }} style={styles.thumbnail} />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={22} color="#C7312B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.05,
  },
  spacer: {
    height: screenHeight * 0.05, // Adds spacing between sections
  },
  inputContainer: {
    marginBottom: screenHeight * 0.01, // Reduced since we're using spacers
  },
  photoSectionContainer: {
    marginBottom: screenHeight * 0.04,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.044,
    fontWeight: '500',
    marginBottom: screenHeight * 0.01,
    lineHeight: screenWidth * 0.06,
  },
  sublabelText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.036,
    opacity: 0.8,
    marginBottom: screenHeight * 0.02,
    lineHeight: screenWidth * 0.05,
  },
  inputField: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
    minHeight: screenHeight * 0.05,
  },
  uploadButton: {
    backgroundColor: '#1E3557',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: screenHeight * 0.02,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8496A6',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    marginLeft: 10,
  },
  photosPreviewContainer: {
    marginTop: screenHeight * 0.02,
  },
  photosCountText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.035,
    marginBottom: screenHeight * 0.02,
  },
  photoThumbnailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    borderRadius: 5,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#081A2F',
    borderRadius: 12,
    padding: 0,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: screenHeight * 0.06, // Increased for more space at bottom
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    textAlign: 'center',
  },
});