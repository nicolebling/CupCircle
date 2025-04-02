import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AvailabilityCard from "@/components/AvailabilityCard";
import { format, addDays, isPast, isToday } from "date-fns";
import { useAvailability } from "../../hooks/useAvailability";
import { supabase } from "../../lib/supabase";

// Type definitions
type TimeSlot = {
  id: string;
  avail_id: number;
  date: Date;
  startTime: string;
  endTime: string;
  timezone: string;
};

export default function AvailabilityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const { isLoading, error, createSlot, getSlots } = useAvailability();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false); // Added state for toggle

  useEffect(() => {
    if (user?.id) {
      getUserAvailability();
    }
  }, [user]);

  const getUserAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("id", user?.id)
        .order("date", { ascending: true });

      if (error) throw error;

      // Ensure dates are properly parsed and sorted
      const formattedData = (data || []).map((slot) => {
        // Convert date string (YYYY-MM-DD) to Date object without timezone conversion
        const [year, month, day] = slot.date.split("-");
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        );
        return {
          ...slot,
          date,
          startTime: slot.start_time,
          endTime: slot.end_time,
        };
      });

      // Sort by date and time
      const sortedData = formattedData.sort((a, b) => {
        const dateCompare = a.date.getTime() - b.date.getTime();
        if (dateCompare === 0) {
          return a.startTime.localeCompare(b.startTime);
        }
        return dateCompare;
      });

      setTimeSlots(sortedData);
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleAddSlot = async () => {
    const endTime = calculateEndTime(selectedTime);
    const result = await createSlot(selectedDate, selectedTime, endTime);
    if (result) {
      await getUserAvailability();
    }
  };

  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  // Generate next 7 days for calendar
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Available time slots (30-minute increments from 9:30 AM to 4:00 PM)
  const availableTimes = [
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
  ];

  // Function to calculate end time (30 minutes after start time)
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

  // Function to add a new time slot
  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime: selectedTime,
      endTime: calculateEndTime(selectedTime),
    };

    // Check for overlaps
    const hasOverlap = timeSlots.some((slot) => {
      if (new Date(slot.date).toDateString() !== selectedDate.toDateString()) {
        return false;
      }
      const existingStart = new Date(
        `1970-01-01T${slot.startTime}:00`,
      ).getTime();
      const existingEnd = new Date(`1970-01-01T${slot.endTime}:00`).getTime();
      const newStart = new Date(`1970-01-01T${selectedTime}:00`).getTime();
      const newEnd = new Date(
        `1970-01-01T${calculateEndTime(selectedTime)}:00`,
      ).getTime();

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasOverlap) {
      console.log("This time slot overlaps with an existing slot");
      return;
    }

    setTimeSlots([...timeSlots, newSlot]);
  };

  // Function to delete a time slot
  const handleDeleteTimeSlot = async (avail_id: number) => {
    try {
      // Delete from Supabase using avail_id
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("avail_id", avail_id);

      if (error) {
        console.error("Error deleting time slot:", error);
        alert("Failed to delete the time slot. Please try again.");
        return;
      }

      // Update state only if deletion is successful
      setTimeSlots((prevTimeSlots) =>
        prevTimeSlots.filter((slot) => slot.avail_id !== avail_id),
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Something went wrong while deleting. Please try again.");
    }
  };

  // Function to check if a date has time slots
  const hasTimeSlotsOnDate = (date: Date) => {
    return timeSlots.some(
      (slot) => new Date(slot.date).toDateString() === date.toDateString(),
    );
  };

  
  const getSlotsForDate = (date: Date) => {
    return timeSlots
      .filter(
        (slot) => new Date(slot.date).toDateString() === date.toDateString(),
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Group time slots by date
  const groupedTimeSlots = timeSlots.reduce(
    (groups, slot) => {
      const dateString = format(new Date(slot.date), "yyyy-MM-dd");
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(slot);
      return groups;
    },
    {} as Record<string, TimeSlot[]>,
  );

  // Sort dates for display
  const sortedDates = Object.keys(groupedTimeSlots).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  // Create data for FlatList
  const flatListData = sortedDates.map((dateString) => ({
    date: new Date(dateString),
    slots: groupedTimeSlots[dateString].sort(
      (a, b) =>
        new Date(`1970-01-01T${a.startTime}:00`).getTime() -
        new Date(`1970-01-01T${b.startTime}:00`).getTime(),
    ),
  }));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowAddSlot(!showAddSlot)}
            >
              <Ionicons
                name={showAddSlot ? "close" : "add"}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
          title: "Set Your Availability",
        }}
      />

      {/* <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
        Set your availability for coffee chats with other professionals
      </Text>
 */}
      {showAddSlot && (
        <>
          {/* Calendar Section */}
          <View style={styles.calendarContainer}>
            <FlatList
              horizontal
              data={next7Days}
              renderItem={({ item }) => {
                const isSelected =
                  selectedDate.toDateString() === item.toDateString();
                const isPastDate = isPast(item) && !isToday(item);
                const hasSlots = hasTimeSlotsOnDate(item);

                return (
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      isSelected && { backgroundColor: colors.primary },
                      isPastDate && styles.disabledDate,
                    ]}
                    onPress={() => !isPastDate && handleDateSelect(item)}
                    disabled={isPastDate}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isSelected ? "white" : colors.text },
                        isPastDate && styles.disabledText,
                      ]}
                    >
                      {format(item, "EEE")}
                    </Text>
                    <Text
                      style={[
                        styles.dateText,
                        { color: isSelected ? "white" : colors.text },
                        isPastDate && styles.disabledText,
                      ]}
                    >
                      {format(item, "d")}
                    </Text>
                    {hasSlots && !isSelected && (
                      <View
                        style={[
                          styles.dotIndicator,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.toISOString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarList}
            />
          </View>

          {/* Add Time Slot UI */}
          <View
            style={[
              styles.addSlotContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.addSlotTitle, { color: colors.text }]}>
              Add Time Slot
            </Text>
            <Text
              style={[styles.selectedDateText, { color: colors.secondaryText }]}
            >
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </Text>

            <Text style={[styles.timeSelectorLabel, { color: colors.text }]}>
              Select Start Time (30-minute duration)
            </Text>

            <View style={styles.timePickerContainer}>
              <FlatList
                horizontal
                data={availableTimes}
                renderItem={({ item }) => {
                  const isSelectedTime = selectedTime === item;

                  // Check if this time is already taken on selected date
                  const isTimeTaken = timeSlots.some(
                    (slot) =>
                      slot.date.toDateString() ===
                        selectedDate.toDateString() && slot.startTime === item,
                  );

                  return (
                    <TouchableOpacity
                      style={[
                        styles.timeButton,
                        isSelectedTime && { backgroundColor: colors.primary },
                        isTimeTaken && styles.disabledTime,
                      ]}
                      onPress={() => !isTimeTaken && setSelectedTime(item)}
                      disabled={isTimeTaken}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          { color: isSelectedTime ? "white" : colors.text },
                          isTimeTaken && styles.disabledText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.timesList}
              />
            </View>

            <Text style={[styles.endTimeText, { color: colors.secondaryText }]}>
              End Time: {calculateEndTime(selectedTime)}
            </Text>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleAddSlot}
            >
              <Text style={styles.saveButtonText}>Save Time Slot</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Time Slots List */}
      <View style={styles.slotsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              Loading your availability...
            </Text>
          </View>
        ) : flatListData.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="time-outline"
              size={64}
              color={colors.secondaryText}
            />
            <Text
              style={[styles.emptyStateText, { color: colors.secondaryText }]}
            >
              You haven't set any available time slots yet
            </Text>
            <Text
              style={[
                styles.emptyStateSubtext,
                { color: colors.secondaryText },
              ]}
            >
              Add your availability by tapping the + button
            </Text>
          </View>
        ) : (
          <FlatList
            data={flatListData}
            renderItem={({ item }) => (
              <View style={styles.dateGroup}>
                <Text
                  style={[
                    styles.dateGroupTitle,
                    { color: colors.secondaryText },
                  ]}
                >
                  {format(item.date, "EEEE, MMMM d, yyyy")}
                </Text>
                {item.slots.map((slot) => (
                  <AvailabilityCard
                    key={slot.avail_id}
                    timeSlot={slot}
                    onDelete={() => handleDeleteTimeSlot(slot.avail_id)}
                  />
                ))}
              </View>
            )}
            keyExtractor={(item) => item.date.toISOString()}
            contentContainerStyle={styles.slotsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
    padding: 8,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  subtitle: {
    fontFamily: "K2D-Regular, sans-serif",
    paddingLeft: 16,
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarContainer: {
    marginBottom: 24,
    padding: 16,
  },
  calendarList: {
    paddingVertical: 8,
  },
  dateButton: {
    width: 60,
    height: 80,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#FFF",
  },
  dayText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "500",
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "bold",
    fontSize: 20,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    bottom: 12,
  },
  disabledDate: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#999",
  },
  slotsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 16,
    paddingLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontSize: 16,
    marginTop: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "500",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontFamily: "K2D-Regular, sans-serif",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  slotsList: {
    padding: 16,
    paddingBottom: 24,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateGroupTitle: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 8,
  },
  addSlotContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  addSlotTitle: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 8,
  },
  selectedDateText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontSize: 16,
    marginBottom: 16,
  },
  timeSelectorLabel: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "500",
    fontSize: 14,
    marginBottom: 8,
  },
  timePickerContainer: {
    height: 60,
    marginBottom: 8,
  },
  timesList: {
    paddingVertical: 8,
  },
  timeButton: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#F5F5F5",
  },
  timeText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontSize: 14,
  },
  disabledTime: {
    opacity: 0.5,
  },
  endTimeText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontSize: 14,
    marginBottom: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontFamily: "K2D-Regular, sans-serif",
    fontWeight: "600",
    fontSize: 16,
    color: "white",
  },
});
