import { supabase } from '../lib/supabase';

export const initApiClient = async () => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.error('Failed to initialize Supabase client:', error);
    } else {
      console.log('Supabase client initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
};

initApiClient().catch(err => {
  console.error('Failed to initialize Supabase client:', err);
});

export default {
  initApiClient
};