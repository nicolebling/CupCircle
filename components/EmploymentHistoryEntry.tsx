import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export type Employment = {
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
};

type Props = {
  employment: Employment;
  isDark: boolean;
  isLast?: boolean;
};

export default function EmploymentHistoryEntry({ employment, isDark, isLast = false }: Props) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      <View style={styles.timelineContainer}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        {!isLast && <View style={[styles.line, { backgroundColor: colors.primary }]} />}
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.position, { color: colors.text }]}>
          {employment.position}
        </Text>
        <Text style={[styles.company, { color: colors.text }]}>
          {employment.company}
        </Text>
        <Text style={[styles.dateRange, { color: colors.secondaryText }]}>
          {employment.fromDate} - {employment.toDate}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineContainer: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 16,
  },
  position: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    fontFamily: 'K2D-Medium',
    marginBottom: 2,
  },
  dateRange: {
    fontSize: 12,
    fontFamily: 'K2D-Regular',
  },
});