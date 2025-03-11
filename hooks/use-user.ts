
import { useState, useEffect } from 'react';
import { authService } from '@/services/api';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  username: string;
  email: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Try to load the user from secure storage
    async function loadUser() {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUser();
  }, []);
  
  async function login(email: string, password: string): Promise<User | null> {
    try {
      const userData = await authService.login(email, password);
      if (userData) {
        setUser(userData);
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  async function register(username: string, email: string, password: string): Promise<User | null> {
    try {
      const userData = await authService.register(username, email, password);
      if (userData) {
        setUser(userData);
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }
  
  async function logout(): Promise<void> {
    setUser(null);
    await SecureStore.deleteItemAsync('user');
  }
  
  return {
    user,
    isLoading,
    login,
    register,
    logout,
  };
}
