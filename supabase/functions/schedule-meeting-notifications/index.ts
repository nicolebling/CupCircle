import { createClient } from 'npm:@supabase/supabase-js@2';
import { DateTime } from 'npm:luxon';
console.log('Schedule Meeting Notifications Edge Function started');
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
Deno.serve(async (req)=>{
  try {
    console.log('Processing meeting notification scheduling request...');
    const { matchingId, user1Id, user2Id, meetingDate, startTime, cafeName } = await req.json();
    // Validate required fields
    if (!matchingId || !user1Id || !user2Id || !meetingDate || !startTime || !cafeName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Get timezone information from the matching record
    const { data: matchingData, error: matchingError } = await supabase.from('matching').select('timezone').eq('match_id', matchingId).single();
    if (matchingError || !matchingData) {
      console.error('Error fetching matching timezone:', matchingError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not fetch timezone information'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const timezone = matchingData.timezone || 'America/New_York';
    // Parse the meeting date and time in the specified timezone
    const meetingDateTime = DateTime.fromISO(`${meetingDate}T${startTime}`, {
      zone: timezone
    });
    if (!meetingDateTime.isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid date/time format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const meetingDateTimeUTC = meetingDateTime.toUTC();
    // Get user names for personalized notifications
    const [user1Profile, user2Profile] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', user1Id).single(),
      supabase.from('profiles').select('name').eq('id', user2Id).single()
    ]);
    const user1Name = user1Profile.data?.name || 'Your coffee partner';
    const user2Name = user2Profile.data?.name || 'Your coffee partner';
    // Define reminders
    const reminderTimes = [
      {
        offsetMinutes: 24 * 60,
        type: 'reminder_24h',
        label: '24 hours'
      },
      {
        offsetMinutes: 60,
        type: 'reminder_1h',
        label: '1 hour'
      },
      {
        offsetMinutes: 15,
        type: 'reminder_15m',
        label: '15 minutes'
      }
    ];
    let successCount = 0;
    let errorCount = 0;
    // Create notifications for both users
    for (const user of [
      {
        id: user1Id,
        partnerName: user2Name
      },
      {
        id: user2Id,
        partnerName: user1Name
      }
    ]){
      for (const reminder of reminderTimes){
        const notificationTimeUTC = meetingDateTimeUTC.minus({
          minutes: reminder.offsetMinutes
        });
        // Only schedule if notification time is in the future
        if (notificationTimeUTC > DateTime.utc()) {
          try {
            const { error } = await supabase.from('scheduled_notifications').upsert({
              meeting_id: matchingId,
              user_id: user.id,
              notification_type: reminder.type,
              title: `Coffee Chat in ${reminder.label}`,
              body: `Your coffee chat with ${user.partnerName} at ${cafeName} is coming up in ${reminder.label}!`,
              scheduled_time: notificationTimeUTC.toISO(),
              metadata: {
                meeting_id: matchingId,
                cafe_name: cafeName,
                partner_name: user.partnerName,
                meeting_time: meetingDateTime.toISO(),
                meeting_time_utc: meetingDateTimeUTC.toISO(),
                timezone
              },
              sent: false
            }, {
              onConflict: 'meeting_id,user_id,notification_type',
              ignoreDuplicates: true
            });
            if (error) {
              console.error(`Error scheduling ${reminder.type} for user ${user.id}:`, error);
              errorCount++;
            } else {
              console.log(`Scheduled ${reminder.type} notification for ${user.id} at ${notificationTimeUTC.toISO()}`);
              successCount++;
            }
          } catch (err) {
            console.error(`Error processing ${reminder.type} for user ${user.id}:`, err);
            errorCount++;
          }
        }
      }
    }
    console.log(`Scheduled meeting notifications for match ${matchingId}`);
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully scheduled ${successCount} notifications`,
      scheduled: successCount,
      errors: errorCount,
      matchingId
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in schedule meeting notifications function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: DateTime.utc().toISO()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
