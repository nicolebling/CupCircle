
const fetch = require('node-fetch');

// Get the API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function testAuth() {
  try {
    console.log('Testing registration...');
    // Test user data
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    const username = `user${Date.now()}`;
    
    // Register a new user
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    
    if (!registerResponse.ok) {
      const error = await registerResponse.json();
      throw new Error(`Registration failed: ${error.error || 'Unknown error'}`);
    }
    
    const newUser = await registerResponse.json();
    console.log('Registration successful:', newUser);
    
    // Test login
    console.log('Testing login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Login failed: ${error.error || 'Unknown error'}`);
    }
    
    const loggedInUser = await loginResponse.json();
    console.log('Login successful:', loggedInUser);
    
    // Test profile creation
    console.log('Testing profile creation...');
    const profileData = {
      user_id: newUser.id,
      name: 'Test User',
      occupation: 'Software Developer',
      bio: 'This is a test profile',
      interests: ['coding', 'testing', 'coffee'],
    };
    
    const profileResponse = await fetch(`${API_URL}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    
    if (!profileResponse.ok) {
      const error = await profileResponse.json();
      throw new Error(`Profile creation failed: ${error.error || 'Unknown error'}`);
    }
    
    const createdProfile = await profileResponse.json();
    console.log('Profile creation successful:', createdProfile);
    
    // Test profile retrieval
    console.log('Testing profile retrieval...');
    const getProfileResponse = await fetch(`${API_URL}/api/profile/${newUser.id}`);
    
    if (!getProfileResponse.ok) {
      const error = await getProfileResponse.json();
      throw new Error(`Profile retrieval failed: ${error.error || 'Unknown error'}`);
    }
    
    const retrievedProfile = await getProfileResponse.json();
    console.log('Profile retrieval successful:', retrievedProfile);
    
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Error testing auth:', error);
  }
}

testAuth();
