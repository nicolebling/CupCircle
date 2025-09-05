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
    cafeName: string,
    timezone: string = 'America/New_York' // Default to NY timezone
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
          cafeName,
          timezone
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
};
