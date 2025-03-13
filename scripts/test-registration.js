
const fetch = require('node-fetch');

async function testRegistration() {
  const API_URL = 'https://cupcircle-api.cosanitty.replit.app';
  
  console.log('Testing API connection...');
  try {
    const healthCheck = await fetch(`${API_URL}/api/health-check`);
    console.log('Health check status:', healthCheck.status);
    if (healthCheck.ok) {
      console.log('API health check passed');
    } else {
      console.log('API health check failed');
    }
  } catch (error) {
    console.error('API connection error:', error.message);
  }

  console.log('\nTesting registration endpoint...');
  try {
    // Test user data
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    
    console.log(`Attempting to register with email: ${email}`);
    console.log(`Registration endpoint: ${API_URL}/api/auth/register`);
    
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Registration response status:', registerResponse.status);
    
    if (!registerResponse.ok) {
      let errorText;
      try {
        const error = await registerResponse.json();
        errorText = error.error || 'Unknown error';
      } catch (e) {
        errorText = await registerResponse.text() || 'No error details available';
      }
      console.error('Registration failed:', errorText);
    } else {
      const newUser = await registerResponse.json();
      console.log('Registration successful:', newUser);
    }
  } catch (error) {
    console.error('Registration test error:', error.message);
    console.error('Full error:', error);
  }
}

testRegistration();
