
import { Pool } from 'pg';
import Constants from 'expo-constants';

// Get the database URL from environment variables
const databaseUrl = Constants.expoConfig?.extra?.DATABASE_URL || 
                   process.env.DATABASE_URL;

// Create a connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  max: 10 // maximum number of clients in the pool
});

// Helper function for database queries
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export default pool;
