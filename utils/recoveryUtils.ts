
import * as Linking from 'expo-linking';

export function parseRecoveryTokens(url?: string | null) {
  if (!url) return null;

  // Prefer fragment (after #), fall back to query (after ?)
  const fragment = url.split('#')[1];
  const query = fragment || url.split('?')[1];
  if (!query) return null;

  const params = new URLSearchParams(query);
  const access_token = params.get('access_token') || undefined;
  const refresh_token = params.get('refresh_token') || undefined;
  const type = params.get('type') || undefined; // 'recovery' expected

  if (!access_token || !refresh_token || type !== 'recovery') return null;
  return { access_token, refresh_token };
}
