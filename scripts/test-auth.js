
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

const API_URL = process.env.EXPO_PUBLIC_API_URL || `https://${process.env.REPLIT_DEV_DOMAIN}/api`;

async function testAuth() {
  try {
    console.log('Testing registration...');
    
    // Test registration
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      }),
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
    
    if (!registerResponse.ok) {
      console.log('Registration failed, trying login...');
    }
    
    // Test login
    console.log('\nTesting login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginResponse.ok) {
      // Test profile creation
      console.log('\nTesting profile creation...');
      const profileResponse = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: loginData.id,
          name: 'Test User',
          bio: 'This is a test profile',
          occupation: 'Software Developer'
        }),
      });
      
      const profileData = await profileResponse.json();
      console.log('Profile creation response:', profileData);
    }
  } catch (error) {
    console.error('Error testing auth:', error);
  }
}

testAuth();
