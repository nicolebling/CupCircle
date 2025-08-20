
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const resetRecoveryState = async () => {
    console.log('Resetting password recovery state');
    
    // Clear state immediately and forcefully
    setReadyForNewPassword(false);
    setLoading(false);
    
    // Clear any URL parameters that might trigger recovery again
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      if (currentUrl.includes('access_token') || currentUrl.includes('refresh_token')) {
        const cleanUrl = currentUrl.split('#')[0].split('?')[0];
        window.history.replaceState({}, '', cleanUrl);
        console.log('Cleared recovery tokens from URL');
      }
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
        console.log('User already has valid session, clearing recovery state');
        // If user has a valid session but no recovery tokens, they've completed the flow
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

    // Listen for auth state changes to clear recovery state when user signs in normally
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && event === 'SIGNED_IN' && session?.user && !parseRecoveryTokens(window?.location?.href)) {
        console.log('User signed in normally, clearing recovery state');
        setReadyForNewPassword(false);
      }
    });
    
    return () => {
      mounted = false;
      subscription?.remove();
      authSubscription?.unsubscribe();
    };
  }, []);

  console.log('usePasswordRecovery state:', { readyForNewPassword, loading });
  
  return { 
    readyForNewPassword, 
    loading,
    resetRecoveryState
  };
}
