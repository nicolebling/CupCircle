
import { createClient } from 'npm:@supabase/supabase-js@2';

console.log('Cancel Meeting Notifications Edge Function started');

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    console.log('Processing meeting notification cancellation request...');
    
    const { meetingId } = await req.json();
    
    // Validate required fields
    if (!meetingId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Meeting ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`🗑️ Starting cancellation process for meeting ${meetingId}...`);
    
    // First, check what notifications exist for this meeting
    console.log(`📡 Executing query: SELECT * FROM scheduled_notifications WHERE meeting_id = ${meetingId}`);
    const { data: existingNotifications, error: fetchError } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .eq("meeting_id", meetingId);

    if (fetchError) {
      console.error("❌ Error fetching existing notifications:", fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${existingNotifications?.length || 0} total notifications for meeting ${meetingId}`);

    if (!existingNotifications || existingNotifications.length === 0) {
      console.log(`ℹ️ No notifications found for meeting ${meetingId}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'No notifications found to cancel',
        cancelled: 0
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Filter unsent notifications
    const unsentNotifications = existingNotifications.filter(n => !n.sent);
    console.log(`📬 Found ${unsentNotifications.length} unsent notifications to delete`);

    if (unsentNotifications.length === 0) {
      console.log(`ℹ️ No unsent notifications found for meeting ${meetingId}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'No unsent notifications to cancel',
        cancelled: 0
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Delete all unsent scheduled notifications for this meeting
    console.log(`🗑️ Executing DELETE query: DELETE FROM scheduled_notifications WHERE meeting_id = ${meetingId} AND sent = false`);
    const { data: deletedData, error: deleteError } = await supabase
      .from("scheduled_notifications")
      .delete()
      .eq("meeting_id", meetingId)
      .eq("sent", false)
      .select();

    if (deleteError) {
      console.error("❌ Error deleting scheduled notifications:", deleteError);
      throw deleteError;
    }

    const deletedCount = deletedData?.length || 0;
    console.log(`🗑️ Successfully deleted ${deletedCount} notifications`);

    // Verify deletion
    const { data: remainingNotifications } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .eq("meeting_id", meetingId);

    console.log(`✅ Verification: ${remainingNotifications?.length || 0} notifications remain for meeting ${meetingId}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully cancelled ${deletedCount} scheduled notifications`,
      cancelled: deletedCount,
      meetingId
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in cancel meeting notifications function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
