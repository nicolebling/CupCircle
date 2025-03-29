import React, { useState, useEffect } from 'react';
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

export default function EmploymentHistoryEntry({ employment, onChange, onDelete, isEditing, setIsEditing, isDark}: Props) {
  const colors = Colors[isDark ? 'dark' : 'light'];
 
  const [localEmployment, setLocalEmployment] = useState(() => ({
    company: employment?.company || '',
    position: employment?.position || '',
    fromDate: employment?.fromDate || '',
    toDate: employment?.toDate || ''
  }));
  const [isPresentJob, setIsPresentJob] = useState(employment?.toDate === 'Present');

  useEffect(() => {
    if (employment?.company) {
      setIsEditing(false);
    }
  }, [employment?.company]);

  const handleChange = (field, value) => {
      setLocalEmployment(prevState => ({
          ...prevState,
          [field]: value
      }));
  };

  const handleSave = () => {
      const isEmpty = !localEmployment.company && 
                     !localEmployment.position && 
                     !localEmployment.fromDate && 
                     !localEmployment.toDate;

      if (isEmpty) {
          onDelete();
          return;
      }

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
        placeholder="Company"
        placeholderTextColor={colors.secondaryText}
        value={localEmployment.company}
        onChangeText={(value) => handleChange('company', value)}
      />

      <View style={styles.positionContainer}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Position</Text>
        <TextInput
          style={[styles.input, styles.fullWidthInput, { backgroundColor: colors.input, color: colors.text }]}
          placeholder="Position"
          placeholderTextColor={colors.secondaryText}
          value={localEmployment.position}
          onChangeText={(value) => handleChange('position', value)}
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
            onChangeText={(value) => handleChange('fromDate', value)}
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
              onChangeText={(value) => handleChange('toDate', value)}
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 16,
     
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
      justifyContent: 'space-between',  // Align to right
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