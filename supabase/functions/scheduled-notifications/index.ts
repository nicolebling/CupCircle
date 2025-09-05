
import { createClient } from 'npm:@supabase/supabase-js@2'

console.log('Scheduled Notifications Edge Function started')

interface ScheduledNotification {
  id: string
  meeting_id?: number
  user_id: string
  notification_type: string
  title: string
  body: string
  scheduled_time: string
  metadata: Record<string, any>
  sent: boolean
  sent_at?: string
}

interface Profile {
  id: string
  push_token?: string
  notifications_enabled: boolean
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function sendPushNotification(pushToken: string, title: string, body: string) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
      },
      body: JSON.stringify({
        to: pushToken,
        title: title,
        body: body,
        sound: 'default',
        priority: 'high',
      }),
    })

    const result = await response.json()
    console.log('Push notification sent:', result)
    return result
  } catch (error) {
    console.error('Error sending push notification:', error)
    throw error
  }
}

Deno.serve(async (req) => {
  try {
    console.log('Processing scheduled notifications...')
    
    // Get current time
    const now = new Date()
    console.log('Current time:', now.toISOString())

    // First, get notifications that need processing
    const { data: dueNotifications, error: queryError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_time', now.toISOString())

    if (queryError) {
      console.error('Error querying scheduled notifications:', queryError)
      throw queryError
    }

    console.log(`Found ${dueNotifications?.length || 0} due notifications`)

    if (!dueNotifications || dueNotifications.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No notifications due',
          processed: 0 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let errorCount = 0

    // Process each due notification with individual locking
    for (const notification of dueNotifications) {
      try {
        // Try to atomically claim this notification for processing
        console.log(`🔒 Attempting to claim notification ${notification.id} for user ${notification.user_id} (${notification.notification_type})`)
        
        const { data: claimedNotification, error: claimError } = await supabase
          .from('scheduled_notifications')
          .update({ 
            sent: true, 
            sent_at: now.toISOString() 
          })
          .eq('id', notification.id)
          .eq('sent', false) // Only update if still not sent
          .select('*')
          .single()

        // If claiming failed (notification was already processed), skip it
        if (claimError || !claimedNotification) {
          console.log(`⚠️ Notification ${notification.id} already processed by another instance or claim failed:`, claimError)
          continue
        }
        
        console.log(`✅ Successfully claimed notification ${notification.id}`)

        // Get user's push token and notification preference
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('push_token, notifications_enabled')
          .eq('id', notification.user_id)
          .single()

        if (profileError) {
          console.error(`Error fetching profile for user ${notification.user_id}:`, profileError)
          errorCount++
          continue
        }

        // Check if user has notifications enabled
        if (!profile?.notifications_enabled) {
          console.log(`Notifications disabled for user ${notification.user_id}, skipping...`)
          
          processedCount++
          continue
        }

        // Check if user has a valid push token
        if (!profile?.push_token) {
          console.log(`No push token for user ${notification.user_id}, creating in-app notification instead...`)
          
          // Create in-app notification as fallback
          await supabase.from('notifications').insert({
            user_id: notification.user_id,
            title: notification.title,
            body: notification.body,
            metadata: notification.metadata || {}
          })

          processedCount++
          continue
        }

        // Send push notification
        await sendPushNotification(
          profile.push_token,
          notification.title,
          notification.body
        )

        // Also create in-app notification for consistency
        await supabase.from('notifications').insert({
          user_id: notification.user_id,
          title: notification.title,
          body: notification.body,
          metadata: notification.metadata || {}
        })

        console.log(`✅ Sent notification ${notification.id} to user ${notification.user_id}`)
        processedCount++

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${processedCount} notifications`,
        processed: processedCount,
        errors: errorCount,
        timestamp: now.toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in scheduled notifications function:', error)
    
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
