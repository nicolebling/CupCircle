
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Run this script to initialize the database
async function setupDatabase() {
  // Get database URL from environment variable
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  
  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'db-setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute SQL statements
    const client = await pool.connect();
    try {
      await client.query(sqlContent);
      console.log('Database schema created successfully');
    } finally {
      client.release();
    }
    
    // Insert sample data
    await insertSampleData(pool);
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

// Insert sample data for testing
async function insertSampleData(pool) {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Insert users
    const user1 = await client.query(
      `INSERT INTO users(username, email, password) 
       VALUES('johndoe', 'john@example.com', '$2a$10$uQFyVSLvxiYB5Vq58Jw5oOTVw3ZOO6f2kCBQZQXYLO25Sd5JrTtei') 
       RETURNING id`
    ); // Password: password123
    
    const user2 = await client.query(
      `INSERT INTO users(username, email, password) 
       VALUES('janedoe', 'jane@example.com', '$2a$10$uQFyVSLvxiYB5Vq58Jw5oOTVw3ZOO6f2kCBQZQXYLO25Sd5JrTtei') 
       RETURNING id`
    ); // Password: password123
    
    // Insert profiles
    await client.query(
      `INSERT INTO profiles(user_id, name, age, occupation, photo, bio, industry_categories, skills, neighborhoods, favorite_cafes, interests) 
       VALUES($1, 'John Doe', 32, 'Software Engineer', 'https://randomuser.me/api/portraits/men/32.jpg', 
       'Passionate about building scalable web applications and mentoring junior developers.', 
       ARRAY['Technology', 'Software Development'], 
       ARRAY['React', 'Node.js', 'TypeScript'], 
       ARRAY['Downtown', 'Tech District'], 
       ARRAY['Coffee House', 'Bean There'], 
       ARRAY['Coding', 'Hiking', 'Photography'])`,
      [user1.rows[0].id]
    );
    
    await client.query(
      `INSERT INTO profiles(user_id, name, age, occupation, photo, bio, industry_categories, skills, neighborhoods, favorite_cafes, interests) 
       VALUES($1, 'Jane Doe', 28, 'UX Designer', 'https://randomuser.me/api/portraits/women/44.jpg', 
       'Creative designer with a strong focus on user-centered design.', 
       ARRAY['Design', 'UX/UI'], 
       ARRAY['Figma', 'User Research', 'Prototyping'], 
       ARRAY['Arts District', 'Design Quarter'], 
       ARRAY['The Roastery', 'Morning Brew'], 
       ARRAY['Art', 'Design', 'Travel'])`,
      [user2.rows[0].id]
    );
    
    // Insert availability slots
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    await client.query(
      `INSERT INTO availability(user_id, date, start_time, end_time, is_available) 
       VALUES($1, $2, '09:00:00', '10:30:00', true)`,
      [user1.rows[0].id, tomorrow.toISOString().split('T')[0]]
    );
    
    await client.query(
      `INSERT INTO availability(user_id, date, start_time, end_time, is_available) 
       VALUES($1, $2, '14:00:00', '15:30:00', true)`,
      [user1.rows[0].id, nextWeek.toISOString().split('T')[0]]
    );
    
    await client.query(
      `INSERT INTO availability(user_id, date, start_time, end_time, is_available) 
       VALUES($1, $2, '10:00:00', '11:30:00', true)`,
      [user2.rows[0].id, tomorrow.toISOString().split('T')[0]]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Sample data inserted successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting sample data:', error);
  } finally {
    client.release();
  }
}

setupDatabase();
