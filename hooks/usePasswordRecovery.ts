
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionProcessed, setSessionProcessed] = useState(false);

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);
    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No valid recovery tokens found in URL');
      // Only set loading to false if we haven't successfully processed a session yet
      if (!sessionProcessed) {
        setLoading(false);
      }
      return;
    }

    console.log('Valid recovery tokens found, setting session...');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
      });

      if (!error) {
        console.log('Recovery session set successfully');
        setReadyForNewPassword(true);
        setSessionProcessed(true);
        // Navigate to reset password screen with a small delay to ensure auth state is updated
        setTimeout(() => {
          router.replace('/(auth)/reset-password');
        }, 100);
      } else {
        console.error('Failed to set recovery session:', error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error setting recovery session:', error);
      setLoading(false);
    } finally {
      // Only set loading to false if there was an error
      // Success case is handled above
    }
  }

  useEffect(() => {
    // When app is cold-started from the link
    Linking.getInitialURL().then((url) => {
      handleUrl(url);
    });

    // When app is already open and receives the link
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    
    return () => subscription?.remove();
  }, []);

  return { readyForNewPassword, loading: loading && !sessionProcessed };
}
