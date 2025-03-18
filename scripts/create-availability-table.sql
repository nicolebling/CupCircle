
-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_availability_user_id ON availability(user_id);

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own availability" 
  ON availability FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability" 
  ON availability FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability" 
  ON availability FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability" 
  ON availability FOR DELETE 
  USING (auth.uid() = user_id);
