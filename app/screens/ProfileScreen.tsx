import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import Navbar from '../components/navbar';

// Import assets
const UserImage = require('../assets/User.png');
const EditIcon = require('../assets/edit.png');

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('');
  const [userData, setUserData] = useState(null);
  const navbarRef = React.useRef(null);
  const navOpacity = React.useRef(new Animated.Value(1)).current;

  // Get current date info
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) return;

      try {
        // Fetch user data from intakeForms
        const intakeFormRef = doc(db, 'intakeForms', user.email.toLowerCase());
        const intakeFormSnap = await getDoc(intakeFormRef);

        if (intakeFormSnap.exists()) {
          const data = intakeFormSnap.data();
          setUserFullName(data.fullName);
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.email]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Profile</Text>
      
      <View style={styles.avatarContainer}>
        <Image source={UserImage} style={styles.userAvatar} />
        <TouchableOpacity style={styles.editIconContainer}>
          <Image source={EditIcon} style={styles.editIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Handle logout with confirmation
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by AuthNavigator since the user state will change
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };

 if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}>
        
        {renderHeader()}
        
        <View style={styles.profileContainer}>
            <Text style={styles.userName}>{userFullName || 'Aria'}</Text> 
          {/* Settings Menu */}
          <View style={styles.settingsContainer}>
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsText}>Account Settings</Text>
              <Feather name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsText}>Notifications</Text>
              <Feather name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsText}>Connect Apple Health</Text>
              <Feather name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsText}>About</Text>
              <Feather name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsText}>Privacy Policy</Text>
              <Feather name="chevron-right" size={20} color="#9E9E9E" />
            </TouchableOpacity>
            
            {/* Logout button with handler */}
            <TouchableOpacity 
              style={styles.settingsItem} 
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
              <Feather name="log-out" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <Navbar 
        ref={navbarRef} 
        activeScreen="Home" 
        opacityValue={navOpacity} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    backgroundColor: '#081A2F',
    paddingTop: 81,
    paddingBottom: 81, // Increased to make room for the avatar
    paddingHorizontal: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 40, // Increased to leave space for avatar
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -40,
    alignSelf: 'center',
    zIndex: 10, // Ensure it appears on top
  },
  userAvatar: {
    width: 132,
    height: 132,
    borderRadius: 100,
    borderWidth: 5,
    borderColor: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D9D9D9',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: 'black',
  },
  profileContainer: {
    paddingTop: 50,  // Space after the avatar
    paddingHorizontal: 20,
    flex: 1,
    paddingBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 20,
    paddingVertical: 5,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  settingsText: {
    fontSize: 16,
    color: '#333333',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30', // Red color for logout text
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#081A2F',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  textDark: {
    color: '#fff',
  },
});