
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { parseRecoveryTokens } from '@/utils/recoveryUtils';

export function usePasswordRecovery() {
  const [readyForNewPassword, setReadyForNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const resetRecoveryState = async () => {
    console.log('Resetting password recovery state');
    
    setReadyForNewPassword(false);
    setLoading(false);
    
    // Clear any recovery tokens from the URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const hasTokens = url.searchParams.has('access_token') || 
                       url.searchParams.has('refresh_token') || 
                       url.hash.includes('access_token') || 
                       url.hash.includes('refresh_token');
      
      if (hasTokens) {
        url.searchParams.delete('access_token');
        url.searchParams.delete('refresh_token');
        url.searchParams.delete('type');
        url.hash = '';
        window.history.replaceState({}, '', url.toString());
      }
    }
    
    console.log('Recovery state reset completed');
  };

  async function handleUrl(url: string | null) {
    console.log('Processing recovery URL:', url);
    
    if (!url) {
      console.log('No URL provided');
      setReadyForNewPassword(false);
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

    const initializeRecovery = async () => {
      console.log('Initializing password recovery...');
      
      // First check the current URL when the hook mounts
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        console.log('Current URL on mount:', currentUrl);
        if (mounted) {
          await handleUrl(currentUrl);
          return; // Don't continue if we found tokens in current URL
        }
      }

      // Fallback: check initial URL from Linking
      const initialUrl = await Linking.getInitialURL();
      console.log('Initial URL from Linking:', initialUrl);
      if (mounted && initialUrl) {
        await handleUrl(initialUrl);
      } else if (mounted) {
        setLoading(false);
      }
    };

    initializeRecovery();

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('URL changed:', url);
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
