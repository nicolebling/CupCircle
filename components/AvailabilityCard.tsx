
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type TimeSlot = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
};

type AvailabilityCardProps = {
  timeSlot: TimeSlot;
  onDelete: () => void;
};

export default function AvailabilityCard({ timeSlot, onDelete }: AvailabilityCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Get timezone from props or fallback to system timezone
  const timeZone = timeSlot.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneAbbr = timeZone.split('/')[1] || timeZone;
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.timeSlotInfo}>
        <Ionicons name="time-outline" size={24} color={colors.primary} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.timeRange, { color: colors.text }]}>
            {timeSlot.startTime} - {timeSlot.endTime}
          </Text>
          <Text style={[styles.timeZone, { color: colors.secondaryText }]}>
            {timeZoneAbbr} time zone
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  timeSlotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  timeRange: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  timeZone: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
