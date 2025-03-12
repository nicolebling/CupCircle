// Check if database environment variables are properly set
console.log('Checking database environment...');
const { Pool } = require('pg');

async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log('Database connection successful!', result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseConnection();

// Print a masked version of the URL for security (only showing the beginning)
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.substring(0, 15) + '...' + dbUrl.substring(dbUrl.lastIndexOf('@'));
  console.log('Database URL starts with:', maskedUrl);
}