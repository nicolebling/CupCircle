import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { format, addDays } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAvailability } from '@/hooks/useAvailability';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AvailabilityCard from '@/components/AvailabilityCard';

type TimeSlot = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
};

export default function AvailabilityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const { isLoading, error, createSlot, getSlots } = useAvailability();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  useEffect(() => {
    if (user?.id) {
      fetchAvailability();
    }
  }, [user]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching availability:", error);
        return;
      }

      setTimeSlots(data || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleAddSlot = async () => {
    const endTime = calculateEndTime(selectedTime);
    const result = await createSlot(selectedDate, selectedTime, endTime);
    if (result) {
      await fetchAvailability();
    }
  };

  const calculateEndTime = (startTime: string): string => {
    const [time, period] = startTime.split(" ");
    const [hour, minute] = time.split(":").map(Number);

    let newHour = hour;
    let newMinute = minute + 30;
    let newPeriod = period;

    if (newMinute >= 60) {
      newMinute = 0;
      newHour += 1;

      if (newHour === 12 && period === "AM") {
        newPeriod = "PM";
      } else if (newHour === 12 && period === "PM") {
        newPeriod = "AM";
      } else if (newHour > 12) {
        newHour = newHour - 12;
      }
    }

    return `${newHour}:${newMinute === 0 ? "00" : newMinute} ${newPeriod}`;
  };

  // Generate next 7 days for calendar
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Group time slots by date
  const groupedSlots = timeSlots.reduce((acc: any, slot: TimeSlot) => {
    const date = new Date(slot.date).toDateString();
    if (!acc[date]) {
      acc[date] = {
        date: new Date(slot.date),
        slots: []
      };
    }
    acc[date].slots.push(slot);
    return acc;
  }, {});

  const flatListData = Object.values(groupedSlots);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    // ... rest of the styles from original file
  });


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.text }]}>Set Your Availability</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddSlot(!showAddSlot)}>
          <Ionicons name={showAddSlot ? "close-circle" : "add-circle"} size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showAddSlot && (
        // Add Time Slot UI -  Most of this section will be rebuilt from original
        <View style={{padding: 16}}>
          <Text>Add Time Slot Section (Implementation needed from original file)</Text>
        </View>
      )}

      {/* Time Slots List */}
      <View style={styles.slotsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Available Time Slots</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading your availability...</Text>
          </View>
        ) : flatListData.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="time-outline" size={64} color={colors.secondaryText} />
            <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>You haven't set any available time slots yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.secondaryText }]}>Add your availability by tapping the + button</Text>
          </View>
        ) : (
          <FlatList
            data={flatListData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }: any) => (
              <View style={styles.dateGroup}>
                <Text style={[styles.dateGroupTitle, { color: colors.secondaryText }]}>
                  {format(new Date(item.date), 'EEEE, MMMM d, yyyy')}
                </Text>
                {item.slots.map((slot: TimeSlot) => (
                  <AvailabilityCard
                    key={slot.id}
                    timeSlot={slot}
                    onDelete={() => {}}
                  />
                ))}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}