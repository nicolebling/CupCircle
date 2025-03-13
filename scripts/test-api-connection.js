
const fetch = require('node-fetch');

async function testApiConnection() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cupcircle-api.cosanitty.replit.app';
  
  console.log(`Testing API connection to: ${apiUrl}`);
  
  try {
    // Test root endpoint
    const rootResponse = await fetch(`${apiUrl}/`);
    console.log(`Root endpoint status: ${rootResponse.status}`);
    const rootData = await rootResponse.json();
    console.log('Root response:', rootData);
    
    // Test health check endpoint
    const healthResponse = await fetch(`${apiUrl}/api/health-check`);
    console.log(`Health check endpoint status: ${healthResponse.status}`);
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);
    
    console.log('API connection tests completed successfully');
  } catch (error) {
    console.error('API connection failed:', error.message);
    
    // Try to diagnose the issue
    if (error.code === 'ENOTFOUND') {
      console.error('DNS lookup failed. The API domain might not exist or DNS resolution is failing.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. The server might not be running or is not accepting connections.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. The server might be down or unreachable.');
    }
    
    console.error('Make sure your API server is running and properly deployed.');
  }
}

testApiConnection();
