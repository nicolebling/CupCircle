const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.get('/', (req, res) => {
  res.send('CupCircle API is running');
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    return res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const userId = uuidv4();
    const newUser = await pool.query(
      'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4) RETURNING id, username, email, created_at',
      [userId, username || email.split('@')[0], email, hashedPassword]
    );

    return res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Profile routes
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json(profileResult.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;
    const { user_id } = profileData;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user_id]
    );

    let result;

    if (existingProfile.rows.length === 0) {
      // Create new profile
      const columns = Object.keys(profileData);
      const values = Object.values(profileData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      result = await pool.query(
        `INSERT INTO profiles (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
    } else {
      // Update existing profile
      const keys = Object.keys(profileData).filter(key => key !== 'user_id');
      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = keys.map(key => profileData[key]);

      result = await pool.query(
        `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
        [user_id, ...values]
      );
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Save profile error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;