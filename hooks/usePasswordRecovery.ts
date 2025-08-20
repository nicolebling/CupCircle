
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
    
    // Sign out completely to clear any recovery session
    try {
      await supabase.auth.signOut();
      console.log('Signed out successfully during recovery reset');
    } catch (error) {
      console.error('Error signing out during recovery reset:', error);
    }
    
    console.log('Recovery state reset completed');
  };

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);
    
    // If no URL, check if we have a valid regular session (not recovery)
    if (!url) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Only set ready if this is actually a recovery session
        // Check if the session has recovery metadata
        const isRecoverySession = session.user.recovery_sent_at || 
                                session.user.email_confirmed_at === session.user.created_at;
        setReadyForNewPassword(isRecoverySession || false);
      } else {
        setReadyForNewPassword(false);
      }
      setLoading(false);
      return;
    }

    const tokens = parseRecoveryTokens(url);
    if (!tokens) {
      console.log('No recovery tokens found in URL');
      setReadyForNewPassword(false);
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
