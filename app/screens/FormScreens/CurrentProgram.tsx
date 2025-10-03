import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CurrentProgram({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const previousParams = route?.params || {};

  // Add form data state
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [dietDescription, setDietDescription] = useState('');
  const [trainingProgram, setTrainingProgram] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);

  // Load existing form data from Firestore
  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(data);

          // Populate form fields with existing data
          if (data.dietDescription) setDietDescription(data.dietDescription);
          if (data.trainingProgram) setTrainingProgram(data.trainingProgram);
          if (data.bodyPhotoUrls && Array.isArray(data.bodyPhotoUrls)) {
            setPhotoUrls(data.bodyPhotoUrls);
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [user?.email]);

  // Save form data to Firestore (without photos)
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

  // Upload a single photo to Firebase Storage
  const uploadPhoto = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `users/${user.email.toLowerCase()}/bodyPhotos/${filename}`);

    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Upload all photos and save their URLs
  const uploadAllPhotos = async () => {
    if (photos.length === 0) return photoUrls;

    try {
      const uploadPromises = photos.map((photo) => uploadPhoto(photo));
      const uploadedUrls = await Promise.all(uploadPromises);

      // Combine existing photo URLs with new ones
      const allPhotoUrls = [...photoUrls, ...uploadedUrls];

      return allPhotoUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      return photoUrls;
    }
  };

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
      const newPhotos = result.assets.map((asset) => asset.uri);
      const combinedPhotos = [...currentPhotos, ...newPhotos];

      // Limit to 4 photos maximum
      setPhotos(combinedPhotos.slice(0, 4));
    }
  };

  // Function to remove a photo by index
  const removePhoto = (indexToRemove) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  // Function to remove an existing photo from Firebase Storage and Firestore
  const removeExistingPhoto = (indexToRemove) => {
    // Remove from photoUrls state
    setPhotoUrls(photoUrls.filter((_, index) => index !== indexToRemove));
  };

  const handleNext = async () => {
    setIsSaving(true);

    try {
      // Upload all new photos and get their URLs
      const allPhotoUrls = await uploadAllPhotos();

      // Save form data with photo URLs
      await saveFormData({
        dietDescription,
        trainingProgram,
        bodyPhotoUrls: allPhotoUrls,
        currentProgramCompleted: true,
        intakeFormCompleted: true, // Mark the entire form as completed
      });

      // Navigate to Welcome screen
      navigation.navigate('Welcome', {
        ...previousParams,
        dietDescription,
        trainingProgram,
        bodyPhotoUrls: allPhotoUrls,
      });
    } catch (error) {
      console.error('Error in form submission:', error);
      alert('There was a problem saving your information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <BackgroundWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.95} barHeight={8} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: screenHeight * 0.15, // Extra padding for keyboard
          }}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.labelText}>
                Please describe a typical day of eating in detail (or diet plan if following one),
                including snacking and alcohol.
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
                (wearing shorts that don't cover your knees): front, both sides, and back. Shirtless
                if male or a vest if female.
              </Text>

              <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
                <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Upload Photos</Text>
              </TouchableOpacity>

              {/* Display existing photos from Firebase */}
              {photoUrls.length > 0 && (
                <View style={styles.photosPreviewContainer}>
                  <Text style={styles.photosCountText}>
                    {photoUrls.length} existing {photoUrls.length === 1 ? 'photo' : 'photos'}
                  </Text>

                  {/* Display existing photo thumbnails with remove option */}
                  <View style={styles.photoThumbnailsContainer}>
                    {photoUrls.map((photoUrl, index) => (
                      <View key={`existing-${index}`} style={styles.thumbnailContainer}>
                        <Image source={{ uri: photoUrl }} style={styles.thumbnail} />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={() => removeExistingPhoto(index)}>
                          <Ionicons name="close-circle" size={22} color="#C7312B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Display newly selected photos */}
              {photos.length > 0 && (
                <View style={styles.photosPreviewContainer}>
                  <Text style={styles.photosCountText}>
                    {photos.length} new {photos.length === 1 ? 'photo' : 'photos'} selected
                  </Text>

                  {/* Display photo thumbnails with remove option */}
                  <View style={styles.photoThumbnailsContainer}>
                    {photos.map((photo, index) => (
                      <View key={`new-${index}`} style={styles.thumbnailContainer}>
                        <Image source={{ uri: photo }} style={styles.thumbnail} />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={() => removePhoto(index)}>
                          <Ionicons name="close-circle" size={22} color="#C7312B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {isSaving ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.savingText}>
                    Saving... {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : ''}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>&gt;</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.05,
    minHeight: screenHeight * 0.9, // Ensure minimum content height
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
    paddingVertical: screenHeight * 0.015, // Increased padding for better touch target
    minHeight: screenHeight * 0.08, // Minimum height for text areas
    textAlignVertical: 'top',
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
    marginTop: screenHeight * 0.08, // Increased margin
    paddingBottom: screenHeight * 0.05,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
  },
  savingContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: screenHeight * 0.1,
  },
  savingText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    marginTop: 10,
  },
});
