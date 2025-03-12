
-- Users table schema
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT,
  password TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_expires TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table schema
CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT REFERENCES users(id),
  name TEXT,
  age INTEGER,
  occupation TEXT,
  photo TEXT,
  bio TEXT,
  industry_categories TEXT[],
  skills TEXT[],
  neighborhoods TEXT[],
  favorite_cafes TEXT[],
  interests TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability schema
CREATE TABLE IF NOT EXISTS availability (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT REFERENCES users(id),
  day_of_week INTEGER, -- 0-6 for Sunday-Saturday
  start_time TIME,
  end_time TIME,
  location TEXT,
  is_recurring BOOLEAN DEFAULT TRUE,
  specific_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches schema
CREATE TABLE IF NOT EXISTS matches (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user1_id BIGINT REFERENCES users(id),
  user2_id BIGINT REFERENCES users(id),
  match_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status TEXT, -- 'pending', 'accepted', 'declined', 'completed'
  user1_accepted BOOLEAN DEFAULT FALSE,
  user2_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
