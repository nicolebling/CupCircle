import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AvailabilityCard from "@/components/AvailabilityCard";
import { format, addDays, isPast, isToday, parseISO } from "date-fns";
import { useAvailability } from "../../hooks/useAvailability";
import { supabase } from "../../lib/supabase";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import SkeletonLoader from "@/components/SkeletonLoader";

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
  const {
    isLoading: apiLoading,
    error,
    createSlot,
    getSlots,
  } = useAvailability();

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const isPast4PM = now.getHours() >= 16;
    return isPast4PM ? addDays(now, 1) : now;
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  // const [year, month, day] = slot.date.split("-");
  // const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12);
  // setSelectedDate(date);

  useEffect(() => {
    if (user?.id) {
      getUserAvailability();
    }
  }, [user]);

  const getUserAvailability = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("id", user?.id)
        .order("date", { ascending: true });

      if (error) throw error;

      // Ensure dates are properly parsed and sorted
      const formattedData = (data || []).map((slot) => {
        // Create date object for sorting and display, set to noon to avoid any timezone issues
        const [year, month, day] = slot.date.split("-");
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          12,
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

      // Trigger smooth fade-in animation
      opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    } catch (error) {
      console.error("Error fetching availability:", error);
      // Still show animation even on error
      opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    } finally {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  const handleAddSlot = async () => {
    // Combine current selections with multi-date selections using consistent date key
    const currentDateKey = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()), 'yyyy-MM-dd');
    let allSelections = { ...multiDateSelections };
    
    if (selectedTimes.length > 0) {
      allSelections[currentDateKey] = selectedTimes;
    }

    // Check if there are any selections at all
    const totalSelections = Object.values(allSelections).reduce((total, times) => total + times.length, 0);
    
    if (totalSelections === 0) {
      Alert.alert("No Time Selected", "Please select at least one time slot.");
      return;
    }

    // Helper function to convert 12-hour time to 24-hour format
    const to24Hour = (time12h) => {
      const [time, modifier] = time12h.split(" ");
      let [hours, minutes] = time.split(":");

      if (hours === "12") {
        hours = "00";
      }

      if (modifier === "PM") {
        hours = parseInt(hours, 10) + 12;
      }

      return `${hours}:${minutes}`;
    };

    // Check for overlaps across all dates
    const overlappingSlots = [];
    for (const [dateKey, times] of Object.entries(allSelections)) {
      for (const selectedTime of times) {
        const newStart = new Date(
          `1970-01-01T${to24Hour(selectedTime)}:00`,
        ).getTime();
        const newEnd = new Date(
          `1970-01-01T${to24Hour(calculateEndTime(selectedTime))}:00`,
        ).getTime();

        const hasOverlap = timeSlots.some((slot) => {
          if (format(new Date(slot.date), "yyyy-MM-dd") !== dateKey)
            return false;
          const slotStart = new Date(
            `1970-01-01T${to24Hour(slot.startTime)}:00`,
          ).getTime();
          const slotEnd = new Date(
            `1970-01-01T${to24Hour(slot.endTime)}:00`,
          ).getTime();
          return newStart < slotEnd && newEnd > slotStart;
        });

        if (hasOverlap) {
          overlappingSlots.push(`${format(new Date(dateKey), 'MMM d')}: ${selectedTime}`);
        }
      }
    }

    if (overlappingSlots.length > 0) {
      Alert.alert(
        "Duplicate Time Slots",
        `The following time slots already exist:\n${overlappingSlots.join('\n')}`,
      );
      return;
    }

    // Create all selected time slots across all dates
    try {
      setIsLoading(true);
      let totalCreated = 0;
      
      for (const [dateKey, times] of Object.entries(allSelections)) {
        const date = new Date(dateKey);
        for (const selectedTime of times) {
          const endTime = calculateEndTime(selectedTime);
          await createSlot(date, selectedTime, endTime);
          totalCreated++;
        }
      }
      
      await getUserAvailability();
      setSelectedTimes([]);
      setMultiDateSelections({});
      
      Alert.alert(
        "Success", 
        `Successfully created ${totalCreated} time slot${totalCreated > 1 ? 's' : ''} across ${Object.keys(allSelections).length} date${Object.keys(allSelections).length > 1 ? 's' : ''}.`
      );
    } catch (error) {
      console.error("Error creating time slots:", error);
      Alert.alert("Error", "Failed to create some time slots. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [multiDateSelections, setMultiDateSelections] = useState<Record<string, string[]>>({});

  // Generate next 7 days for calendar, filtering out current day if past 4 PM
  const now = new Date();
  const isPast4PM = now.getHours() >= 16; // 16 is 4 PM in 24-hour format

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    // If it's today and past 4 PM, return null
    if (i === 0 && isPast4PM) {
      return null;
    }
    return date;
  }).filter(Boolean); // Remove null values

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
    return timeSlots.some((slot) => {
      const slotDate = new Date(slot.date);
      return (
        slotDate.getFullYear() === date.getFullYear() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getDate() === date.getDate()
      );
    });
  };

  const getSlotsForDate = (date: Date) => {
    return timeSlots
      .filter(
        (slot) => new Date(slot.date).toDateString() === date.toDateString(),
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Group time slots by date and filter out past slots
  const groupedTimeSlots = timeSlots.reduce(
    (groups, slot) => {
      const now = new Date();
      const slotDate = new Date(slot.date);

      // Parse the time (e.g., "10:00 AM")
      const [time, period] = slot.start_time.split(" ");
      const [hours, minutes] = time.split(":");
      let hour = parseInt(hours);

      // Convert to 24-hour format
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      // Set the slot's time
      slotDate.setHours(hour, parseInt(minutes), 0, 0);

      // Skip if slot is in the past
      if (slotDate < now) return groups;

      const dateString = format(slotDate, "yyyy-MM-dd");
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
  // const flatListData = sortedDates.map((dateString) => ({
  //   date: new Date(dateString),
  //   slots: groupedTimeSlots[dateString].sort(
  //     (a, b) =>
  //       new Date(`1970-01-01T${a.startTime}:00`).getTime() -
  //       new Date(`1970-01-01T${b.startTime}:00`).getTime(),
  //   ),
  // }));

  const flatListData = sortedDates.map((dateString) => {
    const [year, month, day] = dateString.split("-");
    return {
      date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12), // 12 PM
      slots: groupedTimeSlots[dateString].sort(
        (a, b) =>
          new Date(`1970-01-01T${a.startTime}:00`).getTime() -
          new Date(`1970-01-01T${b.startTime}:00`).getTime(),
      ),
    };
  });

  const handleDateSelect = (date: Date) => {
    // Save current selections for the previous date using consistent date key
    if (selectedTimes.length > 0) {
      const dateKey = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()), 'yyyy-MM-dd');
      setMultiDateSelections(prev => ({
        ...prev,
        [dateKey]: selectedTimes
      }));
    }
    
    setSelectedDate(date);
    
    // Load selections for the new date using consistent date key
    const newDateKey = format(new Date(date.getFullYear(), date.getMonth(), date.getDate()), 'yyyy-MM-dd');
    setSelectedTimes(multiDateSelections[newDateKey] || []);
  };

  const SkeletonAvailabilityItem = () => (
    <View style={styles.dateGroup}>
      <SkeletonLoader
        width="40%"
        height={16}
        style={{ marginBottom: 20, left: 20, top: 20 }}
      />
      <View style={[styles.skeletonCard, { borderColor: colors.border }]}>
        <View style={styles.skeletonCardContent}>
          <SkeletonLoader width="30%" height={14} />
          <SkeletonLoader width="20%" height={12} style={{ marginTop: 4 }} />
        </View>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddSlot(true);
              }}
            >
              <Ionicons name="add" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          title: "Availability",
        }}
      />

      {/* Add Availability Modal */}
      <Modal
        visible={showAddSlot}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddSlot(false);
          setSelectedTimes([]);
          setMultiDateSelections({});
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowAddSlot(false);
          setSelectedTimes([]);
          setMultiDateSelections({});
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.addSlotModalContent,
                  { backgroundColor: colors.background },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Add Availability
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setShowAddSlot(false);
                    setSelectedTimes([]);
                    setMultiDateSelections({});
                  }}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

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
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.addSlotTitle, { color: colors.text }]}>
                    Add Time Slot
                  </Text>
                  <Text
                    style={[
                      styles.selectedDateText,
                      { color: colors.secondaryText },
                    ]}
                  >
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </Text>

                  <Text
                    style={[styles.timeSelectorLabel, { color: colors.text }]}
                  >
                    Select Time Slots (30-minute duration each)
                  </Text>
                  <Text
                    style={[
                      styles.multiSelectHint,
                      { color: colors.secondaryText },
                    ]}
                  >
                    Tap multiple times to select/deselect slots
                  </Text>

                  <View style={styles.timePickerContainer}>
                    <FlatList
                      horizontal
                      data={availableTimes}
                      renderItem={({ item }) => {
                        const isSelectedTime = selectedTimes.includes(item);

                        const isTimeTaken = timeSlots.some(
                          (slot) =>
                            slot.date.toDateString() ===
                              selectedDate.toDateString() &&
                            slot.startTime === item,
                        );

                        const now = new Date();
                        const [time, period] = item.split(" ");
                        const [hours, minutes] = time.split(":");
                        let hour = parseInt(hours);
                        if (period === "PM" && hour !== 12) hour += 12;
                        if (period === "AM" && hour === 12) hour = 0;

                        const slotTime = new Date(selectedDate);
                        slotTime.setHours(hour, parseInt(minutes), 0, 0);
                        const isPastTime = slotTime < now;

                        const isAlreadyAdded = timeSlots.some((slot) => {
                          const slotDateStr = format(
                            new Date(
                              slot.date instanceof Date
                                ? slot.date
                                : new Date(slot.date),
                            ),
                            "yyyy-MM-dd",
                          );
                          const selectedDateStr = format(
                            selectedDate,
                            "yyyy-MM-dd",
                          );

                          const slotTimeStr = (
                            slot.startTime ||
                            slot.start_time ||
                            ""
                          )
                            .trim()
                            .replace(/\s+/g, " ");
                          const itemTimeStr = item.trim().replace(/\s+/g, " ");

                          return (
                            slotDateStr === selectedDateStr &&
                            slotTimeStr === itemTimeStr
                          );
                        });

                        const handleTimeSelection = () => {
                          if (isTimeTaken || isPastTime || isAlreadyAdded) return;
                          
                          // Create consistent date key using UTC to avoid timezone issues
                          const currentDateKey = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()), 'yyyy-MM-dd');
                          
                          let updatedTimes;
                          if (isSelectedTime) {
                            // Remove from selection
                            updatedTimes = selectedTimes.filter(time => time !== item);
                            setSelectedTimes(updatedTimes);
                          } else {
                            // Add to selection
                            updatedTimes = [...selectedTimes, item];
                            setSelectedTimes(updatedTimes);
                          }
                          
                          // Update multi-date selections immediately with consistent date key
                          setMultiDateSelections(prev => ({
                            ...prev,
                            [currentDateKey]: updatedTimes
                          }));
                        };

                        return (
                          <TouchableOpacity
                            style={[
                              styles.timeButton,
                              isSelectedTime && {
                                backgroundColor: colors.primary,
                              },
                              (isTimeTaken || isPastTime || isAlreadyAdded) &&
                                styles.disabledTime,
                            ]}
                            onPress={handleTimeSelection}
                            disabled={
                              isTimeTaken || isPastTime || isAlreadyAdded
                            }
                          >
                            <Text
                              style={[
                                styles.timeText,
                                {
                                  color: isSelectedTime ? "white" : colors.text,
                                },
                                isTimeTaken && styles.disabledText,
                              ]}
                            >
                              {item}
                            </Text>
                            {isSelectedTime && (
                              <View style={styles.selectedIndicator}>
                                <Ionicons name="checkmark" size={12} color="white" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      }}
                      keyExtractor={(item) => item}
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={styles.timesList}
                    />
                  </View>

                  {(selectedTimes.length > 0 || Object.keys(multiDateSelections).length > 0) && (
                    <View style={styles.selectedTimesContainer}>
                      <Text
                        style={[
                          styles.selectedTimesLabel,
                          { color: colors.text },
                        ]}
                      >
                        Selected Times for {format(selectedDate, 'MMM d')} ({selectedTimes.length}):
                      </Text>
                      <View style={styles.selectedTimesList}>
                        {selectedTimes.map((time) => (
                          <View
                            key={time}
                            style={[
                              styles.selectedTimeChip,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text style={styles.selectedTimeChipText}>
                              {time} - {calculateEndTime(time)}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                setSelectedTimes(
                                  selectedTimes.filter((t) => t !== time)
                                )
                              }
                              style={styles.removeTimeButton}
                            >
                              <Ionicons name="close" size={14} color="white" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                      
                      {Object.keys(multiDateSelections).length > 0 && (
                        <View style={styles.otherDatesContainer}>
                          <Text style={[styles.otherDatesLabel, { color: colors.secondaryText }]}>
                            Other Dates ({Object.values(multiDateSelections).reduce((total, times) => total + times.length, 0)} slots):
                          </Text>
                          {Object.entries(multiDateSelections).map(([dateKey, times]) => (
                            <Text key={dateKey} style={[styles.otherDateText, { color: colors.secondaryText }]}>
                              {format(new Date(dateKey), 'MMM d')}: {times.length} slot{times.length > 1 ? 's' : ''}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { 
                        backgroundColor: (selectedTimes.length > 0 || Object.keys(multiDateSelections).length > 0) ? colors.primary : colors.border,
                        opacity: (selectedTimes.length > 0 || Object.keys(multiDateSelections).length > 0) ? 1 : 0.5 
                      },
                    ]}
                    onPress={() => {
                      const totalSelections = selectedTimes.length + Object.values(multiDateSelections).reduce((total, times) => total + times.length, 0);
                      if (totalSelections > 0) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleAddSlot();
                        setShowAddSlot(false);
                      }
                    }}
                    disabled={selectedTimes.length === 0 && Object.keys(multiDateSelections).length === 0}
                  >
                    <Text style={[
                      styles.saveButtonText,
                      { color: (selectedTimes.length > 0 || Object.keys(multiDateSelections).length > 0) ? "white" : colors.secondaryText }
                    ]}>
                      {(() => {
                        const totalSelections = selectedTimes.length + Object.values(multiDateSelections).reduce((total, times) => total + times.length, 0);
                        const totalDates = Object.keys(multiDateSelections).length + (selectedTimes.length > 0 ? 1 : 0);
                        if (totalSelections === 0) return 'Save Time Slots';
                        return `Save ${totalSelections} Slot${totalSelections > 1 ? 's' : ''} (${totalDates} Date${totalDates > 1 ? 's' : ''})`;
                      })()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Time Slots List */}
      <View style={styles.slotsContainer}>
        {isLoading ? (
          <View style={{ flex: 1 }}>
            {/* Show 2-3 skeleton availability items while loading */}
            <SkeletonAvailabilityItem />
            <SkeletonAvailabilityItem />
            <SkeletonAvailabilityItem />
          </View>
        ) : flatListData.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="calendar-number-outline"
              size={64}
              color={colors.secondaryText}
            />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              Set your availability to get started
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
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
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
                    {format(item.date, "EEEE, MMMM d")}
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
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  addSlotModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "K2D-Bold",
    fontSize: 20,
  },
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
    fontFamily: "K2D-Regular",
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
    fontFamily: "K2D-Regular",
    fontWeight: "500",
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontFamily: "K2D-Medium",
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
    fontFamily: "K2D-Regular",
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
    fontFamily: "K2D-Regular",
    fontSize: 16,
    marginTop: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateText: {
    fontFamily: "K2D-SemiBold",
    fontWeight: "500",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontFamily: "K2D-Regular",
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
    fontFamily: "K2D-Medium",
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
    fontFamily: "K2D-Medium",
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 8,
  },
  selectedDateText: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
    marginBottom: 16,
  },
  timeSelectorLabel: {
    fontFamily: "K2D-Regular",
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
    fontFamily: "K2D-Regular",
    fontSize: 14,
  },
  disabledTime: {
    opacity: 0.5,
  },
  endTimeText: {
    fontFamily: "K2D-Regular",
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
    fontFamily: "K2D-Medium",
    fontWeight: "600",
    fontSize: 16,
    color: "white",
  },
  multiSelectHint: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  selectedIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTimesContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  selectedTimesLabel: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  selectedTimesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  selectedTimeChipText: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
    color: "white",
    marginRight: 6,
  },
  removeTimeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  otherDatesContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  otherDatesLabel: {
    fontFamily: "K2D-Medium",
    fontSize: 12,
    marginBottom: 4,
  },
  otherDateText: {
    fontFamily: "K2D-Regular",
    fontSize: 11,
    marginBottom: 2,
  },
  skeletonCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  skeletonCardContent: {
    flex: 1,
  },
});
