
const { query } = require('../services/database');

async function testDatabaseConnection() {
  try {
    // Test the connection with a simple query
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful!');
    console.log('Current database time:', result.rows[0].current_time);
    
    // List all tables in the database
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\nDatabase tables:');
    if (tables.rows.length === 0) {
      console.log('No tables found in the database. You may need to run setup-database.ts');
    } else {
      tables.rows.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Make sure your DATABASE_URL environment variable is set correctly in the Secrets tab.');
  }
}

testDatabaseConnection().finally(() => process.exit());
