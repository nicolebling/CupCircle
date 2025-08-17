
import { supabase } from '@/lib/supabase';

export const scheduledNotificationUtils = {
  // Manually trigger the scheduled notification check (for testing)
  async triggerManualCheck() {
    try {
      console.log('🧪 Triggering manual scheduled notification check...');
      
      const { data, error } = await supabase.functions.invoke('scheduled-notifications', {
        body: { manual_trigger: true }
      });
      
      if (error) {
        console.error('❌ Error triggering manual check:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Manual check completed:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in manual trigger:', error);
      return { success: false, error };
    }
  },

  // Get upcoming coffee chats for debugging
  async getUpcomingCoffeeChats(hoursAhead: number = 3) {
    try {
      const targetTime = new Date();
      targetTime.setHours(targetTime.getHours() + hoursAhead);
      
      const targetDate = targetTime.toISOString().split('T')[0];
      const targetTimeStr = targetTime.toTimeString().slice(0, 5);
      
      const { data, error } = await supabase
        .from('matching')
        .select('*')
        .eq('status', 'confirmed')
        .eq('meeting_date', targetDate)
        .eq('start_time', targetTimeStr);
      
      if (error) throw error;
      
      return { success: true, matches: data };
    } catch (error) {
      console.error('❌ Error fetching upcoming chats:', error);
      return { success: false, error };
    }
  }
};
