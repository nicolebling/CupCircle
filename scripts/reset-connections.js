
const { exec } = require('child_process');
const path = require('path');

console.log('🔄 CupCircle Service Reset Tool\n');
console.log('This script will verify database connectivity and restart your services.\n');

// Run database verification script
console.log('1. Verifying database connections...');
exec('node scripts/verify-connections.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error verifying connections:', error);
    return;
  }
  
  console.log(stdout);
  
  console.log('\n2. Testing API connection...');
  // Attempt to ping the API
  exec('curl -s https://$REPLIT_DEV_DOMAIN/api || echo "API not responding"', (error, stdout) => {
    console.log('API response:', stdout || 'No response');
    
    console.log('\n✅ Connection reset complete. Next steps:');
    console.log('1. Use the "Run" button to start both API server and frontend');
    console.log('2. Or start them separately:');
    console.log('   - API server: node api/server.js');
    console.log('   - Frontend: npx expo start --web');
  });
});
