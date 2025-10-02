import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';
import BackgroundWrapper from '../../components/BackgroundWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Equipment4({ route }) {
  const navigation = useNavigation();
  const previousParams = route?.params || {};
  
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleNext = () => {
    navigation.navigate('Supplements', {
      ...previousParams,
      additionalEquipmentInfo: additionalInfo
    });
  };

  return (
    <BackgroundWrapper>
      <ProgressBar progress={0.95} barHeight={8} />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.questionText}>
            Is there anything else you would like to share regarding equipment availability?
          </Text>
          
          <TextInput
            style={styles.inputField}
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            multiline={true}
            placeholder=""
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            textAlignVertical="top"
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
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
    paddingTop: screenHeight * 0.3,
    paddingBottom: screenHeight * 0.05,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.05,
    fontWeight: '600',
    marginBottom: screenHeight * 0.04,
    lineHeight: screenWidth * 0.07,
  },
  inputField: {
    borderBottomWidth: 1,
    borderBottomColor: '#8496A6',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
    minHeight: screenHeight * 0.05,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: screenHeight * 0.2,
  },
  nextButton: {
    backgroundColor: '#C7312B',
    minWidth: screenWidth * 0.25,
    height: screenHeight * 0.055,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.3,
    
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontWeight: '800',
    textAlign: 'center',
  },
});