
const fetch = require('node-fetch');
require('dotenv').config();

// Get API URL from environment
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

console.log('=== API Connection Test ===');
console.log('API URL:', apiUrl);
console.log('REPLIT_DEV_DOMAIN:', process.env.REPLIT_DEV_DOMAIN);
console.log('========================');

// Test different endpoints to diagnose the issue
const endpoints = ['/', '/api/health', '/api/status'];

async function testEndpoints() {
  console.log(`Attempting to connect to ${apiUrl}...`);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${apiUrl}${endpoint}`);
      const response = await fetch(`${apiUrl}${endpoint}`, { 
        method: 'GET',
        timeout: 5000 // 5 second timeout
      });
      
      console.log(`Response status for ${endpoint}: ${response.status}`);
      
      // Try to get response as text
      const text = await response.text();
      console.log(`Response for ${endpoint} (first 100 chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      console.log(`✅ Successfully connected to ${apiUrl}${endpoint}`);
    } catch (error) {
      console.error(`❌ Failed to connect to ${apiUrl}${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\nTesting DNS resolution...');
  const dns = require('dns');
  const url = new URL(apiUrl);
  
  dns.lookup(url.hostname, (err, address, family) => {
    if (err) {
      console.error(`❌ DNS lookup failed for ${url.hostname}: ${err.message}`);
      console.log('\nPossible solutions:');
      console.log('1. Check if the API server is deployed and running');
      console.log('2. Verify the domain name is correct in your .env file');
      console.log('3. Consider using your own Replit domain for the API temporarily');
    } else {
      console.log(`✅ DNS resolved ${url.hostname} to ${address} (IPv${family})`);
    }
  });
}

testEndpoints();
