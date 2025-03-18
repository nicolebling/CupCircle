import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Database connection
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
    const { email, password } = req.body;
    
    // Check if email already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Places API proxy
app.get('/api/places/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid query parameter',
        status: 'ERROR',
        results: []
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      return res.status(500).json({
        error: 'API configuration error',
        status: 'ERROR',
        results: []
      });
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const searchQuery = `${input} cafe in New York`;
    
    const queryParams = new URLSearchParams({
      query: searchQuery,
      key: apiKey,
      language: 'en',
      type: 'cafe',
      location: '40.7128,-74.0060',
      radius: '10000'
    });

    const apiUrl = `${baseUrl}?${queryParams}`;
    console.log('Places API Request:', apiUrl.replace(apiKey, 'REDACTED'));
    console.log('Search query:', searchQuery);

    const response = await fetch(apiUrl);
    console.log('Google API Response Status:', response.status);
    
    const responseData = await response.json();
    console.log('Google API Response:', responseData);
    
    if (!response.ok) {
      throw new Error(`Google Places API responded with status: ${response.status}`);
    }

    // Send the response data directly since we already parsed it
    if (responseData.status === 'ZERO_RESULTS') {
      return res.json({
        status: 'OK',
        predictions: []
      });
    }

    if (responseData.status === 'ZERO_RESULTS') {
      return res.json({
        status: 'OK',
        predictions: []
      });
    }

    const results = responseData.results.map(place => ({
      description: `${place.name}, ${place.formatted_address}`,
      structured_formatting: {
        main_text: place.name,
        secondary_text: place.formatted_address
      }
    }));

    return res.json({
      status: 'OK',
      predictions: results.slice(0, 5)
    });

    if (data.status !== 'OK') {
      console.error('Places API error:', {
        status: data.status,
        error_message: data.error_message,
        data: data
      });
      return res.status(400).json({
        error: data.error_message || 'Failed to fetch places',
        status: data.status,
        predictions: []
      });
    }

    const results = data.results.map((place) => ({
      name: place.name,
      formatted_address: place.formatted_address || place.vicinity
    }));

    res.json({
      status: 'OK',
      results: results.slice(0, 5)
    });
  } catch (error) {
    console.error('Places API detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: `Failed to fetch places: ${error.message}` });
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
  const domain = process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:3000';
  console.log(`API available at: ${domain}`);
});