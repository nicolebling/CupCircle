import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  // Register for push notifications and get token
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return null;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) throw new Error("Project ID not found");

        const tokenResult = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = tokenResult.data;
      } catch (e) {
        console.error("Error getting push token:", e);
        return null;
      }
    } else {
      alert("Must use physical device for Push Notifications");
      return null;
    }

    return token;
  },

  // Save push token to user profile
  async savePushToken(userId: string, token: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ push_token: token })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  },
  
  // Instead of sending directly, create notification in DB
  async createNotification(
    recipientUserId: string,
    
    title: string,
    body: string,
    metadata?: Record<string, any>,
  ) {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: recipientUserId,
        title,
        body,
        metadata: metadata || {},
      });

      if (error) {
        console.error("Error creating notification in DB:", error);
        return;
      }

      console.log(
        "✅ Notification created in DB - Edge Function will handle delivery",
      );
    } catch (err) {
      console.error("❌ Failed to create notification in DB:", err);
    }
  },

  // Wrapper methods for specific events
  async sendCoffeeRequestNotification(
    recipientUserId: string,
    senderUserId: string,
    cafeName: string,
  ) {
    try {
      // Fetch sender name from profiles table
      const { data: senderProfile, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", senderUserId)
        .single();

      const senderName = senderProfile?.name || "Someone";

      await this.createNotification(
        recipientUserId,
        "☕ New Coffee Chat Request!",
        `${senderName} wants to meet you at ${cafeName.split("|||")[0]}`,
        { type: "coffee_request" },
      );
    } catch (error) {
      console.error("Error fetching sender name for coffee request notification:", error);
      // Fallback notification
      await this.createNotification(
        recipientUserId,
        "☕ New Coffee Chat Request!",
        `Someone wants to meet you at ${cafeName.split("|||")[0]}`,
        { type: "coffee_request" },
      );
    }
  },

  async sendCoffeeConfirmationNotification(
    recipientUserId: string,
    senderUserId: string,
    cafeName: string,
  ) {
    try {
      // Fetch sender name from profiles table
      const { data: senderProfile, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", senderUserId)
        .single();

      const senderName = senderProfile?.name || "Someone";

      await this.createNotification(
        recipientUserId,
        "✅ Coffee Chat Confirmed!",
        `Your coffee chat with ${senderName} at ${cafeName} is confirmed`,
        { type: "coffee_confirmed" },
      );
    } catch (error) {
      console.error("Error fetching sender name for coffee confirmation notification:", error);
      // Fallback notification
      await this.createNotification(
        recipientUserId,
        "✅ Coffee Chat Confirmed!",
        `Your coffee chat at ${cafeName} is confirmed`,
        { type: "coffee_confirmed" },
      );
    }
  },

  async sendCoffeeCancellationNotification(
    recipientUserId: string,
    senderUserId: string,
  ) {
    try {
      // Fetch sender name from profiles table
      const { data: senderProfile, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", senderUserId)
        .single();

      const senderName = senderProfile?.name || "Someone";

      await this.createNotification(
        recipientUserId,
        "❌ Coffee Chat Cancelled",
        `${senderName} cancelled your coffee chat`,
        { type: "coffee_cancelled" },
      );
    } catch (error) {
      console.error("Error fetching sender name for coffee cancellation notification:", error);
      // Fallback notification
      await this.createNotification(
        recipientUserId,
        "❌ Coffee Chat Cancelled",
        "Your coffee chat has been cancelled",
        { type: "coffee_cancelled" },
      );
    }
  },

  // Handle complete meeting cancellation (update status + cancel notifications)
  async cancelMeeting(meetingId: number, recipientUserId: string, senderUserId: string) {
    try {
      console.log(`🚫 Starting complete cancellation process for meeting ${meetingId}...`);
      console.log(`📝 Meeting details: meetingId=${meetingId}, recipientUserId=${recipientUserId}, senderUserId=${senderUserId}`);

      // 1. Update meeting status to cancelled in the database
      console.log(`📊 Step 1: Updating meeting ${meetingId} status to 'cancelled'...`);
      const { data: updateData, error: updateError } = await supabase
        .from("matching")
        .update({ status: "cancelled" })
        .eq("match_id", meetingId)
        .select();

      if (updateError) {
        console.error("❌ Error updating meeting status:", updateError);
        throw updateError;
      }

      console.log(`✅ Step 1 completed: Meeting status updated`, updateData);

      // 2. Cancel all scheduled notifications for this meeting
      console.log(`🔔 Step 2: Cancelling scheduled notifications for meeting ${meetingId}...`);
      await this.cancelMeetingNotifications(meetingId);
      console.log(`✅ Step 2 completed: Scheduled notifications cancelled`);

      // 3. Send cancellation notification to the other user
      console.log(`📲 Step 3: Sending cancellation notification to user ${recipientUserId}...`);
      await this.sendCoffeeCancellationNotification(recipientUserId, senderUserId);
      console.log(`✅ Step 3 completed: Cancellation notification sent`);

      console.log(`✅ SUCCESS: Complete cancellation process finished for meeting ${meetingId}`);
    } catch (error) {
      console.error("❌ FAILED: Complete cancellation process failed for meeting:", meetingId);
      console.error("❌ Error details:", error);
      console.error("❌ Error stack:", error.stack);
      throw error;
    }
  },

  async sendNewMessageNotification(
    recipientUserId: string,
    senderUserId: string,
    messagePreview: string,
  ) {
    try {
      // Fetch sender name from profiles table
      const { data: senderProfile, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", senderUserId)
        .single();

      const senderName = senderProfile?.name || "Someone";

      await this.createNotification(
        recipientUserId,
        `${senderName}`,
        messagePreview.length > 50
          ? messagePreview.substring(0, 50) + "..."
          : messagePreview,
        { type: "new_message" },
      );
    } catch (error) {
      console.error("Error fetching sender name for notification:", error);
      // Fallback notification with generic sender name
      await this.createNotification(
        recipientUserId,
        `💬 New message`,
        messagePreview.length > 50
          ? messagePreview.substring(0, 50) + "..."
          : messagePreview,
        { type: "new_message" },
      );
    }
  },

  // Create scheduled notification for specific time
  async createScheduledNotification(
    recipientUserId: string,
    title: string,
    body: string,
    scheduledTime: Date,
    notificationType: 'meeting_reminder' | 'pre_meeting' | 'post_meeting',
    metadata?: Record<string, any>,
  ) {
    try {
      const { error } = await supabase.from("scheduled_notifications").insert({
        user_id: recipientUserId,
        title,
        body,
        scheduled_time: scheduledTime.toISOString(),
        notification_type: notificationType,
        metadata: metadata || {},
        sent: false
      });

      if (error) {
        console.error("Error creating scheduled notification in DB:", error);
        return;
      }

      console.log(
        "✅ Scheduled notification created in DB for", scheduledTime.toISOString()
      );
    } catch (err) {
      console.error("❌ Failed to create scheduled notification in DB:", err);
    }
  },

  // Schedule meeting reminder notifications via edge function
  async scheduleMeetingNotifications(
    matchingId: number,
    user1Id: string,
    user2Id: string,
    meetingDate: string, // Format: "2025-04-29"
    startTime: string,   // Format: "10:00:00"
    cafeName: string
  ) {
    try {
      console.log(`📅 Scheduling notifications for meeting ${matchingId}...`);

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error("❌ No authentication session available");
        return;
      }

      // Call the edge function to schedule notifications
      const { data, error } = await supabase.functions.invoke('schedule-meeting-notifications', {
        body: {
          matchingId,
          user1Id,
          user2Id,
          meetingDate,
          startTime,
          cafeName
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error("Failed to schedule meeting notifications");
      }

      if (data?.error) {
        console.error("❌ Meeting notification scheduling failed:", data.error);
        throw new Error(data.error);
      }

      console.log(`✅ Scheduled meeting notifications for match ${matchingId}:`, data);
    } catch (error) {
      console.error("❌ Error scheduling meeting notifications:", error);
    }
  },

  // Test scheduled notifications function manually
  async testScheduledNotifications() {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/scheduled-notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const result = await response.json();
      console.log('Scheduled notifications test result:', result);
      return result;
    } catch (error) {
      console.error('Error testing scheduled notifications:', error);
      return null;
    }
  },

  // Cancel all scheduled notifications for a meeting
  async cancelMeetingNotifications(meetingId: number) {
    try {
      console.log(`🗑️ Starting cancellation process for meeting ${meetingId}...`);
      console.log(`🔍 Query: meeting_id = ${meetingId} (type: ${typeof meetingId})`);

      // First, check what notifications exist for this meeting with detailed logging
      console.log(`📡 Executing query: SELECT * FROM scheduled_notifications WHERE meeting_id = ${meetingId}`);
      const { data: existingNotifications, error: fetchError } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .eq("meeting_id", meetingId);

      if (fetchError) {
        console.error("❌ Error fetching existing notifications:", fetchError);
        throw fetchError;
      }

      console.log(`📋 Raw query result:`, existingNotifications);
      console.log(`📋 Found ${existingNotifications?.length || 0} total notifications for meeting ${meetingId}`);

      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`📋 All notifications breakdown:`);
        existingNotifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. ID: ${notif.id}, User: ${notif.user_id}, Type: ${notif.notification_type}, Sent: ${notif.sent}, Time: ${notif.scheduled_time}`);
        });
      }

      // Filter unsent notifications
      const unsentNotifications = existingNotifications?.filter(n => !n.sent) || [];
      console.log(`📬 Found ${unsentNotifications.length} unsent notifications to delete:`);
      unsentNotifications.forEach((notif, index) => {
        console.log(`  Unsent ${index + 1}: ID: ${notif.id}, User: ${notif.user_id}, Type: ${notif.notification_type}`);
      });

      if (unsentNotifications.length === 0) {
        console.log(`ℹ️ No unsent notifications found for meeting ${meetingId} - nothing to delete`);
        return;
      }

      // Delete all unsent scheduled notifications for this meeting with detailed logging
      console.log(`🗑️ Executing DELETE query: DELETE FROM scheduled_notifications WHERE meeting_id = ${meetingId} AND sent = false`);
      const { data: deletedData, error: deleteError } = await supabase
        .from("scheduled_notifications")
        .delete()
        .eq("meeting_id", meetingId)
        .eq("sent", false)
        .select();

      if (deleteError) {
        console.error("❌ Error deleting scheduled notifications:", deleteError);
        console.error("❌ Delete error details:", JSON.stringify(deleteError, null, 2));
        throw deleteError;
      }

      console.log(`🗑️ Delete operation completed. Deleted ${deletedData?.length || 0} notifications`);
      if (deletedData && deletedData.length > 0) {
        console.log(`🗑️ Deleted notifications details:`);
        deletedData.forEach((notif, index) => {
          console.log(`  Deleted ${index + 1}: ID: ${notif.id}, User: ${notif.user_id}, Type: ${notif.notification_type}`);
        });
      }

      // Verify deletion by checking what's left
      console.log(`🔍 Verification: Checking remaining notifications for meeting ${meetingId}...`);
      const { data: remainingNotifications, error: verifyError } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .eq("meeting_id", meetingId);

      if (verifyError) {
        console.error("❌ Error verifying deletion:", verifyError);
      } else {
        console.log(`✅ Verification: ${remainingNotifications?.length || 0} notifications remain for meeting ${meetingId}`);
        if (remainingNotifications && remainingNotifications.length > 0) {
          console.log(`📋 Remaining notifications:`);
          remainingNotifications.forEach((notif, index) => {
            console.log(`  Remaining ${index + 1}: ID: ${notif.id}, User: ${notif.user_id}, Type: ${notif.notification_type}, Sent: ${notif.sent}`);
          });
        }
      }

      console.log(`✅ Successfully cancelled scheduled notifications for meeting ${meetingId}`);
    } catch (error) {
      console.error("❌ Failed to cancel scheduled notifications:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  },
};
