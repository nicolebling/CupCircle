
const fetch = require('node-fetch');
const apiUrl = process.env.EXPO_PUBLIC_API_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

console.log(`Testing API connection to: ${apiUrl}`);

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
