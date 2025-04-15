import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Experience levels with coffee themes
const EXPERIENCE_LEVELS = [
  { level: 'Student', coffeeTheme: 'Warm Milk', icon: 'school-outline' },
  { level: 'Intern', coffeeTheme: 'Latte', icon: 'cafe-outline' },
  { level: 'Entry', coffeeTheme: 'Light Roast', icon: 'cafe-outline' },
  { level: 'Junior', coffeeTheme: 'Medium Roast', icon: 'cafe-outline' },
  { level: 'Senior', coffeeTheme: 'Dark Roast', icon: 'cafe-outline' },
  { level: 'Director', coffeeTheme: 'Nitro Cold Brew', icon: 'cafe-outline' },
  { level: 'Executive', coffeeTheme: 'Espresso', icon: 'cafe-outline' }
];

type ExperienceLevelSelectorProps = {
  selected: string | string[];
  onChange: (level: string) => void;
  multiSelect?: boolean;
};

export default function ExperienceLevelSelector(props: ExperienceLevelSelectorProps) {
  const { selected, onChange, multiSelect } = props;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [modalVisible, setModalVisible] = useState(false);

  // Find the selected level's coffee theme
  const selectedLevelData = EXPERIENCE_LEVELS.find(item => item.level === selected);

  // Handle selection
  const handleSelect = (level: string) => {
    onChange(level);
    if (!props.multiSelect) {
      setModalVisible(false);
    }
  };

  const getDisplayText = () => {
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      return { text: 'Select experience level', isPlaceholder: true };
    }

    if (Array.isArray(selected)) {
      return { text: `${selected.length} experience levels selected`, isPlaceholder: false };
    }

    return {
      text: selectedLevelData ? `${selectedLevelData.level}` : selected,
      isPlaceholder: false
    };
  };

  const displayText = getDisplayText();

  return (
    <View>
      <TouchableOpacity 
        style={[styles.selector, { backgroundColor: colors.input, borderColor: colors.border }]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, { color: displayText.isPlaceholder ? colors.secondaryText : colors.text }]}>
          {displayText.text}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.secondaryText} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Experience Level
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={EXPERIENCE_LEVELS}
              keyExtractor={(item) => item.level}
              renderItem={({ item }) => {
                const isSelected = Array.isArray(selected) 
                  ? selected.includes(item.level)
                  : selected === item.level;
                const coffeeColor = getCoffeeColor(item.level, colors.primary);

                return (
                  <TouchableOpacity
                    style={[
                      styles.levelItem,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: coffeeColor + '30' }
                    ]}
                    onPress={() => handleSelect(item.level)}
                  >
                    <View style={styles.levelItemContent}>
                      <View style={[styles.iconContainer, { backgroundColor: coffeeColor + '40' }]}>
                        <Ionicons 
                          name={item.icon as any} 
                          size={20} 
                          color={coffeeColor} 
                        />
                      </View>
                      <View style={styles.levelTextContainer}>
                        <Text style={[styles.levelText, { color: colors.text }]}>
                          {item.level}
                        </Text>
                        <Text style={[styles.coffeeThemeText, { color: colors.secondaryText }]}>
                          {item.coffeeTheme}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={coffeeColor} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.levelsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Function to get color based on coffee level
const getCoffeeColor = (level: string, defaultColor: string): string => {
  switch (level) {
    case 'Student': return '#E6C8A0'; // Warm milk color
    case 'Internship': return '#D2B48C'; // Latte color
    case 'Entry': return '#C19A6B'; // Light roast
    case 'Junior': return '#A67B5B'; // Medium roast
    case 'Senior': return '#654321'; // Dark roast
    case 'Director': return '#483C32'; // Nitro cold brew
    case 'Executive': return '#301E1E'; // Espresso
    default: return defaultColor;
  }
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
  },
  selectorText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'K2D-Bold',
    fontSize: 20,
  },
  levelsList: {
    paddingBottom: 20,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    paddingRight: 40
  },
  levelItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelText: {
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  coffeeThemeText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
  }
});