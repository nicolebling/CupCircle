import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TimeSlot } from "@/models/Availability";

// Import the polyfill
import '@formatjs/intl-getcanonicallocales/polyfill';

// Function to safely get timezone
const getTimeZone = (): string => {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  } catch (error) {
    console.warn('Intl.DateTimeFormat not available, using fallback timezone:', error);
  }
  return 'America/New_York'; // Fallback timezone
};

export default function AvailabilityCard({
  timeSlot,
  onDelete,
}: AvailabilityCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Get timezone from props or fallback to system timezone
  const timeZone = timeSlot.timezone || getTimeZone();
  const timeZoneAbbr = timeZone.split("/")[1] || timeZone;

  const formattedStartTime = `${timeSlot.startTime.split(":")[0]}:${timeSlot.startTime.split(":")[1]}`;
  const formattedEndTime = `${timeSlot.endTime.split(":")[0]}:${timeSlot.endTime.split(":")[1]}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.timeSlotInfo}>
        <Ionicons
          name="time-outline"
          size={24}
          color={colors.primary}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.timeRange, { color: colors.text }]}>
            {formattedStartTime} - {formattedEndTime}
          </Text>
          <Text style={[styles.timeZone, { color: colors.secondaryText }]}>
            {timeZoneAbbr} time zone
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  timeSlotInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1, // Allow the timeSlotInfo to shrink when needed
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flexShrink: 1, // Prevents the text container from taking excessive space
  },
  timeRange: {
    fontFamily: "K2D-SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  timeZone: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});