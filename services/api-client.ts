import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export const initApiClient = async () => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      logger.error('Failed to initialize Supabase client', error);
    } else {
      logger.info('Supabase client initialized successfully');
    }
  } catch (error) {
    logger.error('Failed to initialize Supabase client', error);
  }
};

initApiClient().catch(err => {
  logger.error('Failed to initialize Supabase client during initialization', err);
});

export default {
  initApiClient
};