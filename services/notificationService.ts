
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

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

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        console.log('Push token:', token);
      } catch (e) {
        console.error('Error getting push token:', e);
        return null;
      }
    } else {
      alert('Must use physical device for Push Notifications');
      return null;
    }

    return token;
  },

  // Save push token to user profile
  async savePushToken(userId: string, token: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);

      if (error) throw error;
      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  },

  // Send push notification to specific user
  async sendPushNotification(recipientUserId: string, title: string, body: string, data?: any) {
    try {
      // Get recipient's push token
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', recipientUserId)
        .single();

      if (error || !profile?.push_token) {
        console.log('No push token found for user:', recipientUserId);
        return;
      }

      // Send notification via Expo Push API
      const message = {
        to: profile.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  },

  // Notification handlers for different events
  async sendCoffeeRequestNotification(recipientUserId: string, senderName: string, cafeName: string) {
    await this.sendPushNotification(
      recipientUserId,
      '☕ New Coffee Chat Request!',
      `${senderName} wants to meet you at ${cafeName}`,
      { type: 'coffee_request' }
    );
  },

  async sendCoffeeConfirmationNotification(recipientUserId: string, partnerName: string, cafeName: string) {
    await this.sendPushNotification(
      recipientUserId,
      '✅ Coffee Chat Confirmed!',
      `Your coffee chat with ${partnerName} at ${cafeName} is confirmed`,
      { type: 'coffee_confirmed' }
    );
  },

  async sendCoffeeCancellationNotification(recipientUserId: string, partnerName: string) {
    await this.sendPushNotification(
      recipientUserId,
      '❌ Coffee Chat Cancelled',
      `${partnerName} cancelled your coffee chat`,
      { type: 'coffee_cancelled' }
    );
  },

  async sendNewMessageNotification(recipientUserId: string, senderName: string, messagePreview: string) {
    await this.sendPushNotification(
      recipientUserId,
      `💬 Message from ${senderName}`,
      messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      { type: 'new_message' }
    );
  },
};
