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
    console.log('🚀 [PUSH TOKEN] Starting registration process...');
    console.log('🚀 [PUSH TOKEN] Platform:', Platform.OS);
    console.log('🚀 [PUSH TOKEN] Is physical device:', Device.isDevice);
    
    let token;

    if (Platform.OS === 'android') {
      console.log('📱 [PUSH TOKEN] Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('✅ [PUSH TOKEN] Android notification channel set up');
    }

    if (Device.isDevice) {
      console.log('📱 [PUSH TOKEN] Getting existing permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 [PUSH TOKEN] Existing permission status:', existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('📱 [PUSH TOKEN] Requesting permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📱 [PUSH TOKEN] New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ [PUSH TOKEN] Permission denied, status:', finalStatus);
        alert('Failed to get push token for push notification!');
        return null;
      }

      try {
        console.log('🔧 [PUSH TOKEN] Getting project ID from Constants...');
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        console.log('🔧 [PUSH TOKEN] Project ID found:', projectId ? 'Yes' : 'No');
        if (!projectId) {
          console.log('❌ [PUSH TOKEN] Project ID not found in Constants');
          console.log('🔧 [PUSH TOKEN] Constants.expoConfig:', Constants?.expoConfig);
          console.log('🔧 [PUSH TOKEN] Constants.easConfig:', Constants?.easConfig);
          throw new Error('Project ID not found');
        }

        console.log('📱 [PUSH TOKEN] Getting Expo push token...');
        const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenResult.data;
        console.log('✅ [PUSH TOKEN] Token retrieved successfully');
        console.log('📱 [PUSH TOKEN] Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      } catch (e) {
        console.error('❌ [PUSH TOKEN] Error getting push token:', e);
        return null;
      }
    } else {
      console.log('❌ [PUSH TOKEN] Not a physical device - push notifications not supported');
      alert('Must use physical device for Push Notifications');
      return null;
    }

    console.log('🎉 [PUSH TOKEN] Registration process completed, returning token');
    return token;
  },

  // Save push token to user profile
  async savePushToken(userId: string, token: string) {
    console.log('💾 [SAVE TOKEN] Starting save process...');
    console.log('💾 [SAVE TOKEN] User ID:', userId);
    console.log('💾 [SAVE TOKEN] Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    
    try {
      console.log('💾 [SAVE TOKEN] Executing Supabase update...');
      const { data, error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId)
        .select('id, push_token');

      if (error) {
        console.log('❌ [SAVE TOKEN] Supabase error:', error);
        throw error;
      }

      console.log('✅ [SAVE TOKEN] Update successful');
      console.log('💾 [SAVE TOKEN] Returned data:', data);
      
      // Additional verification
      console.log('🔍 [SAVE TOKEN] Verifying save with separate query...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('id, push_token')
        .eq('id', userId)
        .single();
      
      if (verifyError) {
        console.log('❌ [SAVE TOKEN] Verification error:', verifyError);
      } else {
        console.log('✅ [SAVE TOKEN] Verification successful');
        console.log('🔍 [SAVE TOKEN] DB contains token:', !!verifyData?.push_token);
        if (verifyData?.push_token) {
          console.log('🔍 [SAVE TOKEN] DB token preview:', verifyData.push_token.substring(0, 20) + '...');
          console.log('🔍 [SAVE TOKEN] Tokens match:', verifyData.push_token === token);
        }
      }
      
    } catch (error) {
      console.error('❌ [SAVE TOKEN] Error saving push token:', error);
      console.error('❌ [SAVE TOKEN] Error details:', JSON.stringify(error, null, 2));
    }
  },

  // Instead of sending directly, create notification in DB
  async createNotification(
    recipientUserId: string,
    title: string,
    body: string,
    metadata?: Record<string, any>
  ) {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: recipientUserId,
        title,
        body,
        metadata: metadata || {},
      });

      if (error) {
        console.error('Error creating notification in DB:', error);
        return;
      }

      console.log('✅ Notification created in DB - Edge Function will handle delivery');
    } catch (err) {
      console.error('❌ Failed to create notification in DB:', err);
    }
  },

  // Wrapper methods for specific events
  async sendCoffeeRequestNotification(recipientUserId: string, senderName: string, cafeName: string) {
    await this.createNotification(
      recipientUserId,
      '☕ New Coffee Chat Request!',
      `${senderName} wants to meet you at ${cafeName}`,
      { type: 'coffee_request' }
    );
  },

  async sendCoffeeConfirmationNotification(recipientUserId: string, partnerName: string, cafeName: string) {
    await this.createNotification(
      recipientUserId,
      '✅ Coffee Chat Confirmed!',
      `Your coffee chat with ${partnerName} at ${cafeName} is confirmed`,
      { type: 'coffee_confirmed' }
    );
  },

  async sendCoffeeCancellationNotification(recipientUserId: string, partnerName: string) {
    await this.createNotification(
      recipientUserId,
      '❌ Coffee Chat Cancelled',
      `${partnerName} cancelled your coffee chat`,
      { type: 'coffee_cancelled' }
    );
  },

  async sendNewMessageNotification(recipientUserId: string, senderName: string, messagePreview: string) {
    await this.createNotification(
      recipientUserId,
      `💬 Message from ${senderName}`,
      messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      { type: 'new_message' }
    );
  },
};
