
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export type Employment = {
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
};

type Props = {
  employment: Employment;
  onChange: (employment: Employment) => void;
  onDelete: () => void;
  isDark: boolean;
};

export default function EmploymentHistoryEntry({ employment, onChange, onDelete, isDark }: Props) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="Company"
            placeholderTextColor={colors.secondaryText}
            value={employment.company}
            onChangeText={(text) => onChange({ ...employment, company: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="Position"
            placeholderTextColor={colors.secondaryText}
            value={employment.position}
            onChangeText={(text) => onChange({ ...employment, position: text })}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="From (MM/YYYY)"
            placeholderTextColor={colors.secondaryText}
            value={employment.fromDate}
            onChangeText={(text) => onChange({ ...employment, fromDate: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="To (MM/YYYY)"
            placeholderTextColor={colors.secondaryText}
            value={employment.toDate}
            onChangeText={(text) => onChange({ ...employment, toDate: text })}
          />
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
