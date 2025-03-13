
-- Create profiles table in Supabase
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  name VARCHAR,
  occupation VARCHAR,
  photo_url VARCHAR,
  bio TEXT,
  age INTEGER,
  experience_level VARCHAR,
  education TEXT,
  city VARCHAR,
  industry_categories TEXT[],
  skills TEXT[],
  neighborhoods TEXT[],
  favorite_cafes TEXT[],
  interests TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
