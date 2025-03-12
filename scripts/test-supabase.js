
// Test connection to Supabase database
const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time');
      console.log('Database connection successful!');
      console.log('Server time:', result.rows[0].time);
      
      // Check if tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('\nAvailable tables:');
      if (tablesResult.rows.length === 0) {
        console.log('No tables found. You may need to run the database setup script.');
      } else {
        tablesResult.rows.forEach(row => {
          console.log(`- ${row.table_name}`);
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
