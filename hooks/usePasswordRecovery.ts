
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const resetRecoveryState = async () => {
    console.log('Resetting password recovery state');
    
    // Clear state immediately
    setReadyForNewPassword(false);
    setLoading(false);
    
    // Clear any URL fragments or query parameters that might contain recovery tokens
    try {
      if (typeof window !== 'undefined' && window.location) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (urlError) {
      console.log('URL cleanup not available in this environment');
    }
    
    console.log('Recovery state reset completed');
  };

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);
    
    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No recovery tokens found in URL, checking current session...');
      
      // Check if user already has a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User already has valid session, but no recovery tokens in URL - clearing recovery state');
        setReadyForNewPassword(false);
      } else {
        console.log('No valid session found');
        setReadyForNewPassword(false);
      }
      setLoading(false);
      return;
    }

    console.log('Valid recovery tokens found, setting session...');
    
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

    // When app is cold-started from the link
    Linking.getInitialURL().then((url) => {
      if (mounted) {
        handleUrl(url);
      }
    });

    // When app is already open and receives the link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (mounted) {
        handleUrl(url);
      }
    });
    
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  console.log('usePasswordRecovery state:', { readyForNewPassword, loading });
  
  return { 
    readyForNewPassword, 
    loading,
    resetRecoveryState
  };
}
