import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to store auth credentials
  const storeCredentials = async (email: string, password: string) => {
    try {
      await AsyncStorage.setItem('authCredentials', JSON.stringify({ email, password }));
    } catch (error) {
      console.error('Error storing credentials:', error);
    }
  };

  // Function to restore auth state
  const restoreAuthState = async () => {
    try {
      const credentialsString = await AsyncStorage.getItem('authCredentials');
      if (credentialsString) {
        const { email, password } = JSON.parse(credentialsString);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    await storeCredentials(email, password);
  };

  // Logout function
  const logout = async () => {
    await auth.signOut();
    await AsyncStorage.removeItem('authCredentials');
    setUser(null);
  };

  useEffect(() => {
    restoreAuthState();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    // Return a loading spinner or null
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>{children}</AuthContext.Provider>
  );
}
