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
  
  // Check if user wants this type of notification
  async checkNotificationPreference(userId: string, notificationType: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_settings, notifications_enabled")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.error("Error checking notification preference:", error);
        return true; // Default to allowing notifications
      }

      // If notifications are completely disabled
      if (!data.notifications_enabled) {
        return false;
      }

      // Check specific notification type preference
      if (data.notification_settings && typeof data.notification_settings === 'object') {
        return data.notification_settings[notificationType] !== false;
      }

      return true; // Default to allowing notifications
    } catch (error) {
      console.error("Error checking notification preference:", error);
      return true; // Default to allowing notifications
    }
  },

  // Instead of sending directly, create notification in DB
  async createNotification(
    recipientUserId: string,
    title: string,
    body: string,
    notificationType: string,
    metadata?: Record<string, any>,
  ) {
    try {
      // Check if user wants this type of notification
      const shouldSend = await this.checkNotificationPreference(recipientUserId, notificationType);
      if (!shouldSend) {
        console.log(`🔕 Notification skipped - user disabled ${notificationType} notifications`);
        return;
      }

      const { error } = await supabase.from("notifications").insert({
        user_id: recipientUserId,
        title,
        body,
        type: notificationType,
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
        `${senderName} wants to meet you at ${cafeName}`,
        "coffee_requests",
        { type: "coffee_request" },
      );
    } catch (error) {
      console.error("Error fetching sender name for coffee request notification:", error);
      // Fallback notification
      await this.createNotification(
        recipientUserId,
        "☕ New Coffee Chat Request!",
        `Someone wants to meet you at ${cafeName}`,
        "coffee_requests",
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
        "coffee_updates",
        { type: "coffee_confirmed" },
      );
    } catch (error) {
      console.error("Error fetching sender name for coffee confirmation notification:", error);
      // Fallback notification
      await this.createNotification(
        recipientUserId,
        "✅ Coffee Chat Confirmed!",
        `Your coffee chat at ${cafeName} is confirmed`,
        "coffee_updates",
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
        "coffee_updates",
        { type: "coffee_cancelled" },
      );
    } catch (error) {
      console.error("Error fetching sender name for coffee cancellation notification:", error);
      // Fallback notification
      await this.createNotification(
        recipientUserId,
        "❌ Coffee Chat Cancelled",
        "Your coffee chat has been cancelled",
        "coffee_updates",
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
        "messages",
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
        "messages",
        { type: "new_message" },
      );
    }
  },

  async sendSystemUpdateNotification(
    recipientUserId: string,
    title: string,
    message: string,
  ) {
    await this.createNotification(
      recipientUserId,
      title,
      message,
      "system_updates",
      { type: "system_update" },
    );
  },
};
