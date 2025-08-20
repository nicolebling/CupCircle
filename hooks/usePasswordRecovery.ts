
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasProcessedUrl, setHasProcessedUrl] = useState(false);

  const resetRecoveryState = async () => {
    console.log('Resetting password recovery state');
    
    // Clear state immediately
    setReadyForNewPassword(false);
    setLoading(false);
    setHasProcessedUrl(true);
    
    // Clear any recovery tokens from the URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('access_token') || url.searchParams.has('refresh_token')) {
        url.searchParams.delete('access_token');
        url.searchParams.delete('refresh_token');
        url.searchParams.delete('type');
        window.history.replaceState({}, '', url.toString());
      }
    }
    
    // Also clear from AsyncStorage to prevent future issues
    try {
      await import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.removeItem('password_recovery_processed');
      });
    } catch (error) {
      console.log('Could not clear AsyncStorage:', error);
    }
    
    console.log('Recovery state reset completed');
  };

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);
    
    // Check if we've already processed a recovery URL in this session
    if (hasProcessedUrl) {
      console.log('Already processed recovery URL in this session, skipping');
      setLoading(false);
      return;
    }
    
    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No recovery tokens found in URL');
      setReadyForNewPassword(false);
      setLoading(false);
      setHasProcessedUrl(true);
      return;
    }

    console.log('Valid recovery tokens found, setting session...');
    setHasProcessedUrl(true);
    
    try {
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
      });

      if (!error) {
        console.log('Recovery session set successfully');
        console.log('Setting readyForNewPassword to true');
        setReadyForNewPassword(true);
      } else {
        console.error('Failed to set recovery session:', error);
        setReadyForNewPassword(false);
      }
    } catch (error) {
      console.error('Error setting recovery session:', error);
      setReadyForNewPassword(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    const initializeRecovery = async () => {
      // Check if we've already processed a recovery in this session
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
        const processed = await AsyncStorage.getItem('password_recovery_processed');
        if (processed) {
          console.log('Recovery already processed in this session');
          setLoading(false);
          setHasProcessedUrl(true);
          return;
        }
      } catch (error) {
        console.log('Could not check AsyncStorage:', error);
      }

      // When app is cold-started from the link
      Linking.getInitialURL().then((url) => {
        if (mounted && !hasProcessedUrl) {
          handleUrl(url);
        }
      });
    };

    initializeRecovery();

    // When app is already open and receives the link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (mounted && !hasProcessedUrl) {
        handleUrl(url);
      }
    });
    
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [hasProcessedUrl]);

  console.log('usePasswordRecovery state:', { readyForNewPassword, loading });
  
  return { 
    readyForNewPassword, 
    loading,
    resetRecoveryState
  };
}
