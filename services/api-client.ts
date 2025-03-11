
// This is a client-side service that communicates with your backend API

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for your API - fallback to mock API if not configured
const API_BASE_URL = Constants.expoConfig?.extra?.API_URL || 
                    'https://mock-api.cupcircle.com';

// Flag to use mock data when API is unavailable
let useMockData = true;

// Initialize service
export const initApiClient = async () => {
  try {
    // Test API connection
    const response = await fetch(`${API_BASE_URL}/health-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    useMockData = !response.ok;
    console.log(`API connection ${useMockData ? 'failed, using mock data' : 'successful'}`);
    
    // Store API status for session
    await AsyncStorage.setItem('@api_status', useMockData ? 'mock' : 'live');
  } catch (error) {
    console.log('API connection failed, using mock data');
    useMockData = true;
    await AsyncStorage.setItem('@api_status', 'mock');
  }
};

// Helper function for API queries
export const apiQuery = async (endpoint: string, params?: any) => {
  try {
    // Check if we're in mock mode
    const apiStatus = await AsyncStorage.getItem('@api_status');
    if (apiStatus === 'mock' || useMockData) {
      console.log('Using mock data for query:', endpoint);
      throw new Error('MOCK_DATA_REQUIRED');
    }
    
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(params || {}),
    });
    
    if (!response.ok) {
      console.log(`API request failed with status ${response.status}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.log('API query error, returning mock response:', error);
    // Let the calling code handle mock data generation
    throw new Error('MOCK_DATA_REQUIRED');
  }
};

// Initialize the API connection immediately
initApiClient().catch(err => {
  console.error('Failed to initialize API connection:', err);
});

export default {
  apiQuery,
  initApiClient
};
