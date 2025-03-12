
const fetch = require('node-fetch');
const { query } = require('../services/database');

async function verifyConnections() {
  console.log('CupCircle Connection Verification Tool\n');
  
  // Check database connection
  console.log('1. Checking database connection...');
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('   Current database time:', result.rows[0].current_time);
    
    // List all tables in the database
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n   Database tables:');
    if (tables.rows.length === 0) {
      console.log('   ❌ No tables found in the database. You may need to run setup-database.ts');
    } else {
      tables.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
    // Check for users in the database
    const users = await query('SELECT id, email FROM users LIMIT 5');
    console.log('\n   User records:');
    if (users.rows.length === 0) {
      console.log('   ⚠️ No users found in the database.');
    } else {
      users.rows.forEach(user => {
        console.log(`   - ID: ${user.id.substring(0, 8)}... | Email: ${user.email}`);
      });
    }
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    console.error('   Make sure your DATABASE_URL environment variable is set correctly in the Secrets tab.');
  }
  
  // Check API server
  console.log('\n2. Checking API server connection...');
  
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  
  try {
    console.log(`   Trying to connect to: ${apiUrl}`);
    const response = await fetch(`${apiUrl}/`);
    if (response.ok) {
      console.log('   ✅ API server connection successful!');
      const data = await response.json();
      console.log('   Server response:', data);
    } else {
      console.log(`   ❌ API server returned status: ${response.status}`);
      console.log('   Response:', await response.text());
    }
  } catch (error) {
    console.error('   ❌ API server connection failed:', error.message);
  }
  
  console.log('\n3. Environment Variables:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('   EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL ? `✅ Set to ${process.env.EXPO_PUBLIC_API_URL}` : '❌ Not set');
  console.log('   REPLIT_DEV_DOMAIN:', process.env.REPLIT_DEV_DOMAIN ? `✅ Set to ${process.env.REPLIT_DEV_DOMAIN}` : '❌ Not set');
  
  console.log('\nVerification complete! Check the results above for any issues that need to be fixed.');
}

verifyConnections().catch(console.error).finally(() => setTimeout(() => process.exit(), 1000));
