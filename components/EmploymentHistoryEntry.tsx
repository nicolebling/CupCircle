import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  const [isEditing, setIsEditing] = useState(true);
  const [localEmployment, setLocalEmployment] = useState({
    company: '',
    position: '',
    fromDate: '',
    toDate: ''
  });
  const [isPresentJob, setIsPresentJob] = useState(false);

  const handleSave = () => {
    // Check if all fields are empty
    const isEmpty = !localEmployment.company && 
                   !localEmployment.position && 
                   !localEmployment.fromDate && 
                   !localEmployment.toDate;

    if (isEmpty) {
      // If everything is empty, delete the entry
      onDelete();
      return;
    }

    // Check if any required field is missing
    const isMissing = !localEmployment.company || 
                     !localEmployment.position || 
                     !localEmployment.fromDate || 
                     (!localEmployment.toDate && !isPresentJob);

    if (isMissing) {
      Alert.alert(
        "Incomplete Entry",
        "Please fill in all fields for the employment history entry."
      );
      return;
    }

    onChange(localEmployment);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (!isEditing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.input }]}>
        <View style={styles.header}>
          <Text style={[styles.companyName, { color: colors.text }]}>{localEmployment.company}</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
              <Ionicons name="pencil" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.position, { color: colors.text }]}>{localEmployment.position}</Text>
        <View style={styles.datesRow}>
          <Text style={[styles.dateText, { color: colors.secondaryText }]}>
            {localEmployment.fromDate} - {localEmployment.toDate}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.input }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Company</Text>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, styles.fullWidthInput, { backgroundColor: colors.input, color: colors.text }]}
        placeholder="Company name"
        placeholderTextColor={colors.secondaryText}
        value={localEmployment.company}
        onChangeText={(text) => setLocalEmployment({ ...localEmployment, company: text })}
      />

      <View style={styles.positionContainer}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Position</Text>
        <TextInput
          style={[styles.input, styles.fullWidthInput, { backgroundColor: colors.input, color: colors.text }]}
          placeholder="Job title"
          placeholderTextColor={colors.secondaryText}
          value={localEmployment.position}
          onChangeText={(text) => setLocalEmployment({ ...localEmployment, position: text })}
        />
      </View>

      <View style={styles.datesRow}>
        <View style={styles.dateField}>
          <Text style={[styles.label, { color: colors.secondaryText }]}>From</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="MM/YYYY"
            placeholderTextColor={colors.secondaryText}
            value={localEmployment.fromDate}
            onChangeText={(text) => {
              // Remove any non-numeric characters
              const numbers = text.replace(/\D/g, '');
              
              // Format as MM/YYYY if there are enough numbers
              if (numbers.length >= 6) {
                const month = numbers.slice(0, 2);
                const year = numbers.slice(2, 6);
                setLocalEmployment({ ...localEmployment, fromDate: `${month}/${year}` });
              } else {
                // If user includes a slash, keep it
                if (text.includes('/')) {
                  setLocalEmployment({ ...localEmployment, fromDate: text });
                } else {
                  setLocalEmployment({ ...localEmployment, fromDate: numbers });
                }
              }
            }}
          />
        </View>

        <View style={[styles.dateField, { marginLeft: 12 }]}>
          <Text style={[styles.label, { color: colors.secondaryText }]}>To</Text>
          {!isPresentJob ? (
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="MM/YYYY"
              placeholderTextColor={colors.secondaryText}
              value={localEmployment.toDate}
              onChangeText={(text) => {
              // Remove any non-numeric characters
              const numbers = text.replace(/\D/g, '');
              
              // Format as MM/YYYY if there are enough numbers
              if (numbers.length >= 6) {
                const month = numbers.slice(0, 2);
                const year = numbers.slice(2, 6);
                setLocalEmployment({ ...localEmployment, toDate: `${month}/${year}` });
              } else {
                // If user includes a slash, keep it
                if (text.includes('/')) {
                  setLocalEmployment({ ...localEmployment, toDate: text });
                } else {
                  setLocalEmployment({ ...localEmployment, toDate: numbers });
                }
              }
            }}
            />
          ) : (
            <Text style={[styles.input, { backgroundColor: colors.input, color: colors.text, textAlignVertical: 'center' }]}>
              Present
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[
            styles.presentButton,
            { backgroundColor: isPresentJob ? colors.primary : colors.input }
          ]}
          onPress={() => {
            setIsPresentJob(!isPresentJob);
            setLocalEmployment({ 
              ...localEmployment, 
              toDate: !isPresentJob ? 'Present' : '' 
            });
          }}
        >
          <Text style={[styles.presentButtonText, { color: isPresentJob ? '#fff' : colors.text }]}>
            Present Job
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  presentButton: {
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presentButtonText: {
    fontWeight: '600',
    
  },
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  fullWidthInput: {
    width: '100%',
  },
  positionContainer: {
    marginTop: 16,
  },
  datesRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  dateField: {
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  actionRow: {
     flexDirection: 'row',
      justifyContent: 'flex-end',  // Align to right
      alignItems: 'center',
      marginTop: 16,
      gap: 12,  // Space between buttons
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
  },
  position: {
    fontSize: 16,
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});