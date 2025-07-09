
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

    console.log('📱 Device check:', { 
      isDevice: Device.isDevice, 
      platform: Platform.OS,
      deviceName: Device.deviceName 
    });

    if (Platform.OS === 'android') {
      console.log('🤖 Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('✅ Android notification channel configured');
    }

    if (Device.isDevice) {
      console.log('🔍 Checking notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('🙋 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📝 Permission request result:', status);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Notification permissions denied:', finalStatus);
        alert('Failed to get push token for push notification!');
        return null;
      }
      
      console.log('✅ Notification permissions granted');
      
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        console.log('🆔 Project ID check:', { projectId, hasProjectId: !!projectId });
        
        if (!projectId) {
          console.log('❌ No project ID found in Constants');
          throw new Error('Project ID not found');
        }
        
        console.log('🎫 Generating Expo push token...');
        const tokenResult = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = tokenResult.data;
        
        console.log('🎯 Push token generated successfully:', { 
          token: token?.substring(0, 20) + '...', 
          fullLength: token?.length 
        });
      } catch (e) {
        console.error('❌ Error getting push token:', e);
        return null;
      }
    } else {
      console.log('❌ Not a physical device - push notifications unavailable');
      alert('Must use physical device for Push Notifications');
      return null;
    }

    return token;
  },

  // Save push token to user profile
  async savePushToken(userId: string, token: string) {
    try {
      console.log('💾 Saving push token to database:', { 
        userId, 
        tokenPreview: token?.substring(0, 20) + '...',
        tokenLength: token?.length 
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId)
        .select('id, push_token');

      if (error) {
        console.log('❌ Database error saving push token:', error);
        throw error;
      }

      console.log('✅ Push token saved successfully:', { 
        updatedData: data,
        recordsUpdated: data?.length || 0 
      });

      // Verify the token was actually saved
      if (data && data.length > 0) {
        console.log('🔍 Verification - Token saved in DB:', { 
          savedToken: data[0].push_token?.substring(0, 20) + '...',
          tokensMatch: data[0].push_token === token 
        });
      } else {
        console.log('⚠️ Warning: No records were updated - user profile may not exist');
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  },

  // Send push notification to specific user
  async sendPushNotification(recipientUserId: string, title: string, body: string, data?: any) {
    try {
      console.log('📤 Attempting to send notification to user:', recipientUserId);
      
      // Get recipient's push token
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', recipientUserId)
        .single();

      console.log('🔍 Push token lookup result:', {
        userId: recipientUserId,
        hasProfile: !!profile,
        hasToken: !!profile?.push_token,
        error: error?.message,
        errorCode: error?.code
      });

      if (error) {
        console.log('❌ Database error fetching push token:', error);
        return;
      }

      if (!profile?.push_token) {
        console.log('❌ No push token found for user:', recipientUserId);
        
        // Check if profile exists at all
        const { data: profileCheck, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, push_token')
          .eq('id', recipientUserId)
          .single();
          
        if (profileError) {
          console.log('❌ Profile does not exist for user:', recipientUserId, profileError);
        } else {
          console.log('⚠️ Profile exists but no push token:', {
            profileId: profileCheck.id,
            profileName: profileCheck.name,
            hasToken: !!profileCheck.push_token
          });
        }
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
