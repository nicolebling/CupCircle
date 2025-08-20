
import * as Linking from 'expo-linking';

export function parseRecoveryTokens(url?: string | null) {
  if (!url) return null;

  console.log('Parsing recovery tokens from URL:', url);

  // Check both fragment (after #) and query parameters (after ?)
  let params: URLSearchParams | null = null;
  
  // First try to get tokens from the fragment (Supabase typically uses this)
  const fragment = url.split('#')[1];
  if (fragment) {
    console.log('Found URL fragment:', fragment);
    params = new URLSearchParams(fragment);
  }
  
  // If no fragment or no tokens in fragment, try query parameters
  if (!params || (!params.get('access_token') && !params.get('refresh_token'))) {
    const queryString = url.split('?')[1];
    if (queryString) {
      console.log('Trying query parameters:', queryString);
      params = new URLSearchParams(queryString.split('#')[0]); // Remove fragment if present
    }
  }

  if (!params) {
    console.log('No URL parameters found');
    return null;
  }

  const access_token = params.get('access_token') || undefined;
  const refresh_token = params.get('refresh_token') || undefined;
  const type = params.get('type') || undefined;

  console.log('Parsed tokens:', { 
    hasAccessToken: !!access_token, 
    hasRefreshToken: !!refresh_token, 
    type 
  });

  // For password recovery, we need both tokens and type should be 'recovery'
  if (!access_token || !refresh_token || type !== 'recovery') {
    console.log('Invalid or missing recovery tokens');
    return null;
  }

  console.log('Valid recovery tokens found');
  return { access_token, refresh_token };
}
