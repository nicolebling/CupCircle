
import { Pool } from 'pg';

// Configuration from environment variable
const connectionString = process.env.DATABASE_URL;

// Create a new PostgreSQL pool with Supabase configuration
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

// Log the connection (without sensitive info)
if (connectionString) {
  const sanitizedConnectionString = connectionString.replace(/:[^:]*@/, ':****@');
  console.log('Database service connecting to:', sanitizedConnectionString);
}

// Export a query helper function
export async function query(text: string, params?: any[]) {
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
