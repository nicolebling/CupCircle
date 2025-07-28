import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export type CareerTransition = {
  position1: string;
  position2: string;
};

type CareerTransitionEntryProps = {
  transition: CareerTransition;
  onChange: (transition: CareerTransition) => void;
  onDelete: () => void;
  isDark: boolean;
  scrollViewRef?: React.RefObject<ScrollView>;
};

type Props = {
  transition: CareerTransition;
  onChange: (transition: CareerTransition) => void;
  onDelete: () => void;
  isDark: boolean;
};

export default function CareerTransitionEntry({ transition, onChange, onDelete, isDark }: Props) {
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [isEditing, setIsEditing] = useState(!transition?.position1);
  const [localTransition, setLocalTransition] = useState(() => ({
    position1: transition?.position1 || '',
    position2: transition?.position2 || '',
  }));

  const handleChange = (field: string, value: string) => {
    setLocalTransition(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const isEmpty = !localTransition.position1 && !localTransition.position2;

    if (isEmpty) {
      onDelete();
      return;
    }

    if (!localTransition.position1 || !localTransition.position2) {
      Alert.alert(
        "Incomplete Entry",
        "Please fill in both positions for the career transition."
      );
      return;
    }

    onChange(localTransition);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.input }]}>
        <View style={styles.header}>
          <View style={styles.transitionContent}>
            <View style={styles.position1Container}>
              <Text style={[styles.position, { color: colors.text }]}>{localTransition.position1}</Text>
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.position, styles.position2, { color: colors.text }]}>{localTransition.position2}</Text>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
              <Ionicons name="pencil" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.input }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Career Transition</Text>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Previous position</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
          placeholder=""
          placeholderTextColor={colors.secondaryText}
          value={localTransition.position1}
          onChangeText={(value) => handleChange('position1', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>New position</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
          placeholder=""
          placeholderTextColor={colors.secondaryText}
          value={localTransition.position2}
          onChangeText={(value) => handleChange('position2', value)}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  transitionContent: {
    flex: 1,
  },
  position1Container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
  },
  position2: {
    marginTop: 4,
    paddingRight: 8,
  },
  arrow: {
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  label: {
    fontFamily: 'K2D-Regular',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputContainer: {
    marginTop: 12,
  },
  input: {
    fontFamily: 'K2D-Regular',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  saveButton: {
    
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'K2D-SemiBold',
    color: '#FFFFFF',
    fontWeight: '600',
  },
});