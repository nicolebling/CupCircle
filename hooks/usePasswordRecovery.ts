
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);
    
    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No recovery tokens found in URL, user came directly to reset page');
      // If no tokens, assume user is already authenticated and ready
      setReadyForNewPassword(true);
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
        setReadyForNewPassword(true);
      } else {
        console.error('Failed to set recovery session:', error);
        // Even if session setting fails, if we have valid tokens, let user try
        setReadyForNewPassword(true);
      }
    } catch (error) {
      console.error('Error setting recovery session:', error);
      // Even if session setting fails, if we have valid tokens, let user try
      setReadyForNewPassword(true);
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

  return { 
    readyForNewPassword, 
    loading 
  };
}
