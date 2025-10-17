import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../api/client';

// Define the User type to match what your app needs
type User = {
  uid: string;
  email: string;
  displayName?: string | null;
  phoneNumber?: string | null;
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  login: async () => ({ uid: '', email: '' }),
  logout: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to restore auth state from AsyncStorage
  const restoreAuthState = async () => {
    try {
      const credentialsString = await AsyncStorage.getItem('authCredentials');
      if (credentialsString) {
        const { email, userId, fullName, phoneNumber } = JSON.parse(credentialsString);

        // Fetch the latest user data from the API
        try {
          const userData = await userApi.getUserByEmail(email);

          // Set the user state
          setUser({
            uid: userData.user_id,
            email: userData.email,
            displayName: userData.full_name,
            phoneNumber: userData.phone_number,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // If API fails, still set user from stored data as fallback
          setUser({
            uid: userId,
            email: email,
            displayName: fullName,
            phoneNumber: phoneNumber,
          });
        }
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userData = await userApi.getUserByEmail(email.toLowerCase());

      // In a real app, you would validate the password here
      // For now, we're just checking if the user exists

      const user = {
        uid: userData.user_id,
        email: userData.email,
        displayName: userData.full_name,
        phoneNumber: userData.phone_number,
      };

      // Store credentials for next time
      await AsyncStorage.setItem(
        'authCredentials',
        JSON.stringify({
          email: email.toLowerCase(),
          password,
          userId: userData.user_id,
          fullName: userData.full_name,
          phoneNumber: userData.phone_number,
        })
      );

      // Update the context state
      setUser(user);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    }
  };

  // Logout function
  const logout = async () => {
    await AsyncStorage.removeItem('authCredentials');
    setUser(null);
  };

  useEffect(() => {
    restoreAuthState();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
