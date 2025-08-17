
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs every 30 minutes to check for upcoming coffee chats
-- This will call the scheduled-notifications edge function
SELECT cron.schedule(
  'coffee-chat-reminders', 
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/scheduled-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Grant permissions to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
