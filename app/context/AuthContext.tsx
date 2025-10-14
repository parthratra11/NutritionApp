import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Define the user type
type User = {
  id: number;
  email: string;
  fullName?: string;
  token: string;
};

// Define the Auth Context type
type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

// Create the Auth Context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  login: async () => ({}) as User,
  logout: async () => {},
  isLoading: true,
});

// API base URL configuration
const API_BASE_URL = 'http://10.0.2.2:8000'; // Use this for Android emulator
// const API_BASE_URL = 'http://localhost:8000'; // Use this for iOS simulator

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from AsyncStorage on app startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const userData = await response.json();
      const loggedInUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        token: userData.access_token,
      };

      // Save user to state and AsyncStorage
      setUser(loggedInUser);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

      return loggedInUser;
    } catch (error) {
      console.error('Login error:', error);

      // Improved error handling
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection or try again later.'
        );
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid credentials');
      }

      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear user from state and AsyncStorage
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // The value provided to the context
  const authContextValue = {
    user,
    setUser,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
