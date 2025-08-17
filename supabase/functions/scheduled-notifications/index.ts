
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface ScheduledMatch {
  id: string
  user1_id: string
  user2_id: string
  meeting_date: string
  start_time: string
  meeting_location: string
  status: string
}

Deno.serve(async (req) => {
  try {
    console.log('🕐 Running scheduled notification check...')
    
    // Calculate time 3 hours from now
    const threeHoursFromNow = new Date()
    threeHoursFromNow.setHours(threeHoursFromNow.getHours() + 3)
    
    // Format for comparison (YYYY-MM-DD HH:MM format)
    const targetDate = threeHoursFromNow.toISOString().split('T')[0]
    const targetTime = threeHoursFromNow.toTimeString().slice(0, 5)
    
    console.log(`🎯 Looking for matches on ${targetDate} at ${targetTime}`)
    
    // Find confirmed matches that start in exactly 3 hours
    const { data: matches, error: matchError } = await supabase
      .from('matching')
      .select('*')
      .eq('status', 'confirmed')
      .eq('meeting_date', targetDate)
      .eq('start_time', targetTime)
    
    if (matchError) {
      console.error('❌ Error fetching matches:', matchError)
      throw matchError
    }
    
    console.log(`📋 Found ${matches?.length || 0} matches starting in 3 hours`)
    
    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No matches found for 3-hour notification',
        processed: 0 
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    let notificationsCreated = 0
    
    // Process each match
    for (const match of matches as ScheduledMatch[]) {
      try {
        // Get user profiles for names
        const { data: user1Profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', match.user1_id)
          .single()
        
        const { data: user2Profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', match.user2_id)
          .single()
        
        const user1Name = user1Profile?.name || 'Your coffee chat partner'
        const user2Name = user2Profile?.name || 'Your coffee chat partner'
        const cafeName = match.meeting_location?.split('|||')[0] || 'the café'
        
        // Create notification for user1
        const { error: notif1Error } = await supabase
          .from('notifications')
          .insert({
            user_id: match.user1_id,
            title: '☕ Coffee Chat Reminder',
            body: `Your coffee chat with ${user2Name} at ${cafeName} starts in 3 hours (${match.start_time})`,
            metadata: { 
              type: 'coffee_reminder',
              match_id: match.id,
              reminder_type: '3_hours'
            }
          })
        
        if (notif1Error) {
          console.error(`❌ Error creating notification for user1 ${match.user1_id}:`, notif1Error)
        } else {
          notificationsCreated++
          console.log(`✅ Created 3-hour reminder for user1: ${match.user1_id}`)
        }
        
        // Create notification for user2
        const { error: notif2Error } = await supabase
          .from('notifications')
          .insert({
            user_id: match.user2_id,
            title: '☕ Coffee Chat Reminder',
            body: `Your coffee chat with ${user1Name} at ${cafeName} starts in 3 hours (${match.start_time})`,
            metadata: { 
              type: 'coffee_reminder',
              match_id: match.id,
              reminder_type: '3_hours'
            }
          })
        
        if (notif2Error) {
          console.error(`❌ Error creating notification for user2 ${match.user2_id}:`, notif2Error)
        } else {
          notificationsCreated++
          console.log(`✅ Created 3-hour reminder for user2: ${match.user2_id}`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing match ${match.id}:`, error)
      }
    }
    
    console.log(`🎉 Scheduled notification check complete. Created ${notificationsCreated} notifications.`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${matches.length} matches`,
      notificationsCreated,
      matches: matches.length
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('❌ Scheduled notification error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
