
-- Create scheduled_notifications table to track sent notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES matching(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR NOT NULL CHECK (notification_type IN ('reminder_24h', 'reminder_1h', 'reminder_15m')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(meeting_id, user_id, notification_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_meeting_type 
ON scheduled_notifications(meeting_id, notification_type);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent 
ON scheduled_notifications(sent, sent_at);

-- Enable RLS
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage scheduled notifications" ON scheduled_notifications
  FOR ALL USING (auth.role() = 'service_role');
