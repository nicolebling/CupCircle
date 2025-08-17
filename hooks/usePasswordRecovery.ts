
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);
    
    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No recovery tokens found in URL, checking current session...');
      
      // Check if user already has a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User already has valid session');
        setReadyForNewPassword(true);
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
    loading 
  };
}
