
import * as Linking from 'expo-linking';

export function parseRecoveryTokens(url?: string | null) {
  if (!url) return null;

  console.log('Parsing recovery tokens from URL:', url);

  // Check for recovery type first to confirm this is a recovery URL
  const hasRecoveryType = url.includes('type=recovery');
  if (!hasRecoveryType) {
    console.log('URL does not contain type=recovery');
    return null;
  }

  // Prefer fragment (after #), fall back to query (after ?)
  const fragment = url.split('#')[1];
  const query = fragment || url.split('?')[1];
  if (!query) {
    console.log('No query parameters found');
    return null;
  }

  const params = new URLSearchParams(query);
  const access_token = params.get('access_token') || undefined;
  const refresh_token = params.get('refresh_token') || undefined;
  const type = params.get('type') || undefined;

  console.log('Parsed tokens:', { 
    hasAccessToken: !!access_token, 
    hasRefreshToken: !!refresh_token, 
    type 
  });

  if (!access_token || !refresh_token || type !== 'recovery') {
    console.log('Missing required recovery tokens or type');
    return null;
  }
  
  console.log('Successfully parsed recovery tokens');
  return { access_token, refresh_token };
}
