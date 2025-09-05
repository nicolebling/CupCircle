
import { createClient } from 'npm:@supabase/supabase-js@2'

console.log('Schedule Meeting Notifications Edge Function started')

interface ScheduleMeetingRequest {
  matchingId: number
  user1Id: string
  user2Id: string
  meetingDate: string // Format: "2025-04-29"
  startTime: string   // Format: "10:00:00"
  cafeName: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    console.log('Processing meeting notification scheduling request...')
    
    const { matchingId, user1Id, user2Id, meetingDate, startTime, cafeName }: ScheduleMeetingRequest = await req.json()

    // Validate required fields
    if (!matchingId || !user1Id || !user2Id || !meetingDate || !startTime || !cafeName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the meeting date and time properly
    const meetingDateTime = new Date(`${meetingDate}T${startTime}`)
    
    if (isNaN(meetingDateTime.getTime())) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid date/time format' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user names for personalized notifications
    const [user1Profile, user2Profile] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", user1Id).single(),
      supabase.from("profiles").select("name").eq("id", user2Id).single(),
    ])

    const user1Name = user1Profile.data?.name || "Your coffee partner"
    const user2Name = user2Profile.data?.name || "Your coffee partner"

    // Calculate notification times
    const reminderTimes = [
      { offset: 24 * 60, type: 'reminder_24h' as const, label: '24 hours' },
      { offset: 60, type: 'reminder_1h' as const, label: '1 hour' },
      { offset: 15, type: 'reminder_15m' as const, label: '15 minutes' }
    ]

    let successCount = 0
    let errorCount = 0

    // Create notifications for both users
    for (const user of [{ id: user1Id, partnerName: user2Name }, { id: user2Id, partnerName: user1Name }]) {
      for (const reminder of reminderTimes) {
        const notificationTime = new Date(meetingDateTime.getTime() - (reminder.offset * 60 * 1000))
        
        // Only schedule if notification time is in the future
        if (notificationTime > new Date()) {
          try {
            // Use upsert with onConflict to handle duplicates gracefully
            const { error } = await supabase
              .from("scheduled_notifications")
              .upsert({
                meeting_id: matchingId,
                user_id: user.id,
                notification_type: reminder.type,
                title: `☕ Coffee Chat in ${reminder.label}`,
                body: `Your coffee chat with ${user.partnerName} at ${cafeName} is coming up in ${reminder.label}!`,
                scheduled_time: notificationTime.toISOString(),
                metadata: {
                  meeting_id: matchingId,
                  cafe_name: cafeName,
                  partner_name: user.partnerName,
                  meeting_time: meetingDateTime.toISOString()
                },
                sent: false
              }, {
                onConflict: 'meeting_id,user_id,notification_type',
                ignoreDuplicates: true
              })

            if (error) {
              console.error(`Error scheduling ${reminder.type} for user ${user.id}:`, error)
              errorCount++
            } else {
              console.log(`✅ Scheduled ${reminder.type} notification for ${user.id} at ${notificationTime.toISOString()}`)
              successCount++
            }
          } catch (error) {
            console.error(`Error processing ${reminder.type} for user ${user.id}:`, error)
            errorCount++
          }
        }
      }
    }

    console.log(`✅ Scheduled meeting notifications for match ${matchingId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully scheduled ${successCount} notifications`,
        scheduled: successCount,
        errors: errorCount,
        matchingId
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in schedule meeting notifications function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
