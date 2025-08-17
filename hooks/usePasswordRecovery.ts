
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasProcessedUrl, setHasProcessedUrl] = useState(false);

  async function handleUrl(url: string | null, source: 'initial' | 'listener' = 'initial') {
    console.log(`Processing recovery URL from ${source}:`, url);
    
    // If we've already processed a URL successfully, ignore subsequent calls
    if (hasProcessedUrl && source === 'initial') {
      console.log('URL already processed, skipping...');
      return;
    }

    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No valid recovery tokens found in URL');
      // Only set loading to false if this is the first URL processing attempt
      if (!hasProcessedUrl) {
        setLoading(false);
      }
      return;
    }

    console.log('Valid recovery tokens found, setting session...');
    setLoading(true);
    setHasProcessedUrl(true);
    
    try {
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
      });

      if (!error) {
        console.log('Recovery session set successfully');
        setReadyForNewPassword(true);
        setLoading(false);
        // Navigate to reset password screen with a small delay to ensure auth state is updated
        setTimeout(() => {
          router.replace('/(auth)/reset-password');
        }, 100);
      } else {
        console.error('Failed to set recovery session:', error);
        setLoading(false);
        setHasProcessedUrl(false); // Reset so user can try again
      }
    } catch (error) {
      console.error('Error setting recovery session:', error);
      setLoading(false);
      setHasProcessedUrl(false); // Reset so user can try again
    }
  }

  useEffect(() => {
    let mounted = true;

    // When app is cold-started from the link
    Linking.getInitialURL().then((url) => {
      if (mounted) {
        handleUrl(url, 'initial');
      }
    });

    // When app is already open and receives the link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (mounted) {
        handleUrl(url, 'listener');
      }
    });
    
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return { 
    readyForNewPassword, 
    loading: loading && !readyForNewPassword 
  };
}
