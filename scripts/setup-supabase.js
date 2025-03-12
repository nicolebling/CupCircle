
// Script to set up Supabase database tables
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Setting up Supabase database tables...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema SQL
    const client = await pool.connect();
    try {
      await client.query(schemaSql);
      console.log('Database tables created successfully!');
      
      // Check if tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('\nAvailable tables:');
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
