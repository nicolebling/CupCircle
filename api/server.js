
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
console.log('Database URL (first 20 chars):', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'NOT SET');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Compare passwords (in production, use bcrypt.compare)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user data (exclude password)
    return res.json({
      id: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register endpoint hit with body:', req.body);
    const { email, password, username } = req.body;
    
    if (!email || !password) {
      console.error('Missing email or password in request');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if email already exists
    console.log('Checking if email exists:', email);
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('Email already exists');
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a username if not provided
    const usernameToUse = username || email.split('@')[0];
    console.log('Using username:', usernameToUse);
    
    // Insert new user
    console.log('Inserting new user');
    try {
      const result = await pool.query(
        'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
        [email, hashedPassword, usernameToUse]
      );
      
      console.log('User registered successfully:', result.rows[0]);
      return res.status(201).json(result.rows[0]);
    } catch (dbError) {
      console.error('Database insertion error:', dbError.message);
      console.error('Error code:', dbError.code);
      console.error('Error detail:', dbError.detail);
      
      // Check if this is a relation not found error (table doesn't exist)
      if (dbError.code === '42P01') {
        return res.status(500).json({ error: 'Database table does not exist. Run the setup script.' });
      }
      
      throw dbError; // Re-throw for outer catch
    }
  } catch (error) {
    console.error('Register error details:', error.message, error.stack);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Profile routes
app.get('/', (req, res) => {
  res.json({ message: 'API server is running' });
});

app.get('/profile', (req, res) => {
  res.json({ message: 'Profile endpoint reached' });
});

app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;
    const { user_id } = profileData;
    
    // Check if profile exists
    const existingProfile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user_id]);
    
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      const result = await pool.query(
        `UPDATE profiles SET 
         name = $2, 
         age = $3, 
         occupation = $4, 
         photo = $5, 
         bio = $6, 
         industry_categories = $7, 
         skills = $8, 
         neighborhoods = $9, 
         favorite_cafes = $10, 
         interests = $11, 
         updated_at = NOW() 
         WHERE user_id = $1 RETURNING *`,
        [
          user_id,
          profileData.name || existingProfile.rows[0].name,
          profileData.age || existingProfile.rows[0].age,
          profileData.occupation || existingProfile.rows[0].occupation,
          profileData.photo || existingProfile.rows[0].photo,
          profileData.bio || existingProfile.rows[0].bio,
          profileData.industry_categories || existingProfile.rows[0].industry_categories,
          profileData.skills || existingProfile.rows[0].skills,
          profileData.neighborhoods || existingProfile.rows[0].neighborhoods,
          profileData.favorite_cafes || existingProfile.rows[0].favorite_cafes,
          profileData.interests || existingProfile.rows[0].interests
        ]
      );
      
      return res.json(result.rows[0]);
    } else {
      // Create new profile
      const result = await pool.query(
        `INSERT INTO profiles(
          user_id, name, age, occupation, photo, bio,
          industry_categories, skills, neighborhoods, favorite_cafes, interests
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`,
        [
          user_id,
          profileData.name || '',
          profileData.age || null,
          profileData.occupation || '',
          profileData.photo || '',
          profileData.bio || '',
          profileData.industry_categories || [],
          profileData.skills || [],
          profileData.neighborhoods || [],
          profileData.favorite_cafes || [],
          profileData.interests || []
        ]
      );
      
      return res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Save profile error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add some basic rate limiting
app.use((req, res, next) => {
  // Simple in-memory rate limiting
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // max 100 requests per minute
  
  // Initialize or get the requests map
  global.requests = global.requests || new Map();
  const requestRecord = global.requests.get(ip) || { count: 0, resetTime: now + windowMs };
  
  if (now > requestRecord.resetTime) {
    // Reset the window
    requestRecord.count = 1;
    requestRecord.resetTime = now + windowMs;
  } else {
    // Increment request count
    requestRecord.count += 1;
  }
  
  global.requests.set(ip, requestRecord);
  
  // Check if over limit
  if (requestRecord.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  
  next();
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`API available at: ${process.env.EXPO_PUBLIC_API_URL || 'https://your-replit-domain.replit.app'}`);
});
