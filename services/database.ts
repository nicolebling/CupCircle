
// Modified to use fetch API instead of direct database access
// This is a client-side service that should communicate with your backend API

import Constants from 'expo-constants';

// Base URL for your API
const API_BASE_URL = Constants.expoConfig?.extra?.API_URL || 
                    'https://your-backend-api.com';

// Helper function for database queries via API
export const query = async (endpoint: string, params?: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {}),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default {
  query
};
