
const fetch = require('node-fetch');

async function checkApiDeployment() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cupcircle-api.cosanitty.replit.app';
  
  console.log(`Checking API deployment at: ${apiUrl}`);
  console.log('');
  console.log('=== DEPLOYMENT CHECK ===');
  console.log('');
  
  try {
    // Basic connection test
    const response = await fetch(`${apiUrl}/`);
    if (response.ok) {
      console.log('✅ API is accessible');
    } else {
      console.log(`❌ API returned status: ${response.status}`);
    }
    
    // Try to get response body
    try {
      const data = await response.text();
      console.log(`Response body (first 100 chars): ${data.substring(0, 100)}...`);
    } catch (e) {
      console.log('Could not read response body');
    }
    
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    
    // Check if the API is deployed as a separate Replit
    console.log('');
    console.log('If your API is a separate Replit application, make sure:');
    console.log('1. The API Replit is running - open it and press the "Run" button');
    console.log('2. The API Replit has been deployed using Replit Deployments');
    console.log('3. You\'re using the correct URL (check in the Deployments tab of your API Replit)');
    console.log('');
    
    console.log('Current environment configuration:');
    try {
      const dotenv = require('dotenv');
      dotenv.config();
      console.log(`EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || '(not set)'}`);
    } catch (e) {
      console.log('Could not read .env file');
    }
  }
}

checkApiDeployment();
