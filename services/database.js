
const { Pool } = require('pg');

// Configuration from environment variable
const connectionString = process.env.DATABASE_URL;

// Create a new PostgreSQL pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL hosts
  }
});

// Export a query helper function
async function query(text, params) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

module.exports = { query, pool };
