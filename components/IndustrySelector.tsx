import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const INDUSTRIES = [
  'advertising', 'architecture', 'arts', 'beauty', 'blogging', 
  'charity', 'coaching', 'crafts', 'crypto', 'culture', 
  'education', 'entertainment', 'entrepreneurship', 'environment', 'fashion', 
  'filmmaking', 'finance', 'food', 'gaming', 'government', 
  'graphic design', 'hospitality', 'HR', 'industrial design', 'interior design', 
  'Journalism', 'law', 'marketing', 'media', 'medicine', 
  'music', 'photography', 'PR', 'psychotherapy', 'retail', 
  'science', 'sports', 'tech', 'theater', 'travel', 
  'UI/UX design', 'venture capital', 'writing'
];

const { width } = Dimensions.get('window');

type IndustrySelectorProps = {
  selected: string[];
  onChange: (industries: string[]) => void;
  maxSelections?: number;
  isDark?: boolean;
};

export default function IndustrySelector({ 
  selected, 
  onChange, 
  maxSelections = 3,
  isDark = false
}: IndustrySelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    // Ensure selected is always an array
    setTempSelected(Array.isArray(selected) ? selected : []);
  }, [selected]);

  const toggleIndustry = (industry: string) => {
    if (tempSelected.includes(industry)) {
      setTempSelected(tempSelected.filter(item => item !== industry));
    } else {
      if (tempSelected.length < maxSelections) {
        setTempSelected([...tempSelected, industry]);
      }
    }
  };

  const handleSave = () => {
    onChange(tempSelected);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempSelected(selected || []);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity 
        style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border }]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, { color: Array.isArray(selected) && selected.length ? colors.text : colors.secondaryText }]}>
          {Array.isArray(selected) && selected.length ? selected.join(', ') : 'Select industries (max 3)'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.secondaryText} />
      </TouchableOpacity>

      {Array.isArray(selected) && selected.length > 0 && (
        <View style={styles.selectedContainer}>
          {selected.map((industry, index) => (
            <View 
              key={index} 
              style={[styles.selectedBubble, { backgroundColor: colors.primary + '20' }]}
            >
              <Text style={[styles.selectedBubbleText, { color: colors.primary }]}>
                {industry}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Industries (max {maxSelections})
              </Text>
              <Text style={[styles.selectionCount, { color: colors.secondaryText }]}>
                {tempSelected.length}/{maxSelections} selected
              </Text>
            </View>

            <FlatList
              data={INDUSTRIES}
              keyExtractor={(item) => item}
              numColumns={3}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={({ item }) => {
                const isSelected = tempSelected.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.industryItem,
                      isSelected ? 
                        { backgroundColor: colors.primary } : 
                        { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                    onPress={() => toggleIndustry(item)}
                    disabled={tempSelected.length >= maxSelections && !isSelected}
                  >
                    <Text 
                      style={[
                        styles.industryText, 
                        { color: isSelected ? 'white' : colors.text }
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color="white" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.industriesList}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]} 
                onPress={handleCancel}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} 
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  selectorText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -8,
    marginBottom: 16,
    
  },
  selectedBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedBubbleText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
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
    height: '80%',
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
  selectionCount: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
  industriesList: {
    paddingBottom: 20,
  },
  industryItem: {
    minWidth: 100,
    maxWidth: (width - 60) / 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'flex-start', 
    
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  industryText: {
    fontFamily: 'K2D-Regular',
    fontSize: 13,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
});