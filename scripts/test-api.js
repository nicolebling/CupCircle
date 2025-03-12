
const fetch = require('node-fetch');
require('dotenv').config();

// Get API URL from environment
const apiUrl = process.env.EXPO_PUBLIC_API_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

console.log('=== API Connection Test ===');
console.log('API URL:', apiUrl);
console.log('REPLIT_DEV_DOMAIN:', process.env.REPLIT_DEV_DOMAIN);
console.log('========================');

// Test the root endpoint
fetch(`${apiUrl}/`)
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response type:', response.headers.get('content-type'));
    
    // Try to parse as JSON first
    return response.text().then(text => {
      try {
        // Try to parse as JSON
        return JSON.parse(text);
      } catch (e) {
        // If not JSON, return the first 200 characters of the text
        console.error('Response is not valid JSON!');
        console.log('First 200 characters of response:');
        console.log(text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        throw new Error('Invalid JSON response');
      }
    });
  })
  .then(data => {
    console.log('✅ API connection successful!');
    console.log('Response data:', data);
  })
  .catch(error => {
    console.error('❌ API connection failed:', error.message);
  });
