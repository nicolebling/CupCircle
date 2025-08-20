import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const resetRecoveryState = async () => {
    console.log('Resetting password recovery state completely');

    // Clear all recovery-related state immediately
    setReadyForNewPassword(false);
    setLoading(false);

    // Force sign out to clear any recovery session
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out during reset:', error);
      } else {
        console.log('Successfully signed out during reset');
      }
    } catch (error) {
      console.error('Error during signout:', error);
    }

    // Clear any potential URL parameters or deep link state
    try {
      await Linking.getInitialURL();
    } catch (error) {
      console.log('Error clearing URL state:', error);
    }

    console.log('Complete recovery state reset finished');
  };

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);

    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No recovery tokens found in URL, checking current session...');

      // Check if user already has a valid session and if it's a recovery session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User has valid session:', session.user.id);
        // Only treat as recovery session if URL explicitly contains recovery type
        // This prevents false positives from regular authenticated sessions
        const isRecoverySession = url?.includes('type=recovery');

        if (isRecoverySession) {
          console.log('Detected recovery session from URL, setting readyForNewPassword to true');
          setReadyForNewPassword(true);
        } else {
          console.log('Regular session or no recovery URL, not recovery');
          setReadyForNewPassword(false);
        }
      } else {
        console.log('No valid session found');
        setReadyForNewPassword(false);
      }
      setLoading(false);
      return;
    }

    console.log('Valid recovery tokens found, setting session...');

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
      });

      if (!error && data.session) {
        console.log('Recovery session set successfully for user:', data.session.user.id);
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, 'Session:', !!session);

      // If user session becomes invalid/null after password update, clear recovery state
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out or session invalid, clearing recovery state');
        setReadyForNewPassword(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  console.log('usePasswordRecovery state:', { readyForNewPassword, loading });

  return { 
    readyForNewPassword, 
    loading,
    resetRecoveryState
  };
}