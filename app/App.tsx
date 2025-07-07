import './global.css';
import React, { useRef, useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider, useModal } from './context/ModalContext';
import AuthNavigator from './navigation/AuthNavigator';
import TrackingOptionsModal from './components/TrackingOptionsModal';

// Create a wrapper component that has access to the modal context
function AppContent() {
  const { showTrackingModal, setShowTrackingModal } = useModal();
  const navigationRef = useNavigationContainerRef();
  
  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <AuthNavigator />
      </NavigationContainer>
      
      {/* Pass the navigation object to the modal */}
      <TrackingOptionsModal 
        visible={showTrackingModal} 
        onClose={() => setShowTrackingModal(false)} 
        navigation={navigationRef.current}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <ModalProvider>
            <AppContent />
          </ModalProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}