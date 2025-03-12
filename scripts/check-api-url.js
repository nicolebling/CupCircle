
// Load environment variables
require('dotenv').config();

// Get the actual value with REPLIT_DEV_DOMAIN expanded
const apiUrl = process.env.EXPO_PUBLIC_API_URL.replace('${REPLIT_DEV_DOMAIN}', process.env.REPLIT_DEV_DOMAIN);

console.log('Checking API URL:', apiUrl);
console.log('REPLIT_DEV_DOMAIN:', process.env.REPLIT_DEV_DOMAIN);

const fetch = require('node-fetch');

// Test the base endpoint
fetch(`${apiUrl}/`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ API connection successful!');
    console.log('Response:', data);
  })
  .catch(error => {
    console.error('❌ API connection failed:', error.message);
  });
