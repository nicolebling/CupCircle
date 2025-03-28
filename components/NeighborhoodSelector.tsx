import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const NYC_NEIGHBORHOODS_BY_BOROUGH = {
  Manhattan: [
    "Battery Park City", "Chelsea", "Chinatown", "East Village", "Financial District",
    "Flatiron District", "Greenwich Village", "Harlem", "Hell's Kitchen",
    "Lower East Side", "Midtown East", "Midtown West", "NoHo", "SoHo",
    "Theater District", "TriBeCa", "Upper East Side", "Upper West Side",
    "West Village"
  ],
  Brooklyn: [
    "Bedford-Stuyvesant", "Boerum Hill", "Brooklyn Heights", "Bushwick",
    "Carroll Gardens", "Clinton Hill", "Cobble Hill", "DUMBO", "Fort Greene",
    "Gowanus", "Greenpoint", "Park Slope", "Prospect Heights", "Williamsburg"
  ],
  Queens: [
    "Astoria", "Bayside", "Corona", "Elmhurst", "Flushing", "Forest Hills",
    "Jackson Heights", "Jamaica", "Long Island City", "Ridgewood", "Sunnyside",
    "Woodside"
  ]
};

const BOROUGHS = Object.keys(NYC_NEIGHBORHOODS_BY_BOROUGH);

interface NeighborhoodSelectorProps {
  selected: string[];
  onChange: (neighborhoods: string[]) => void;
  maxSelections?: number;
  isDark?: boolean;
}

export default function NeighborhoodSelector({
  selected = [],
  onChange,
  maxSelections = 5,
  isDark = false
}: NeighborhoodSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedBorough, setSelectedBorough] = useState(BOROUGHS[0]);

  const filteredNeighborhoods = useMemo(() => {
    const neighborhoods = NYC_NEIGHBORHOODS_BY_BOROUGH[selectedBorough];
    if (!searchText.trim()) return neighborhoods;
    return neighborhoods.filter(neighborhood =>
      neighborhood.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [selectedBorough, searchText]);

  const toggleNeighborhood = (neighborhood: string) => {
    if (selected.includes(neighborhood)) {
      onChange(selected.filter(n => n !== neighborhood));
    } else if (selected.length < maxSelections) {
      onChange([...selected, neighborhood]);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.input, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Text style={[styles.selectorText, { color: selected.length ? colors.text : colors.secondaryText }]}>
            {selected.length ? `${selected.length} neighborhoods selected` : 'Select neighborhoods'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.secondaryText} />
      </TouchableOpacity>

      {Array.isArray(selected) && selected.length > 0 && (
        <View style={styles.selectedContainer}>
          {selected.map((neighborhood, index) => (
            <View
              key={index}
              style={[
                styles.selectedBubble,
                { backgroundColor: "transparent", borderWidth:1, borderColor: colors.primary}
              ]}
            >
              <Text
                style={[styles.selectedBubbleText, { color: colors.primary }]}
              >
                {neighborhood}
              </Text>
            </View>
          ))}
        </View>
      )}

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
                Select Neighborhoods ({selected.length}/{maxSelections})
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.boroughSelector}>
              {BOROUGHS.map(borough => (
                <TouchableOpacity
                  key={borough}
                  style={[
                    styles.boroughButton,
                    selectedBorough === borough && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedBorough(borough)}
                >
                  <Text style={[
                    styles.boroughText,
                    { color: selectedBorough === borough ? 'white' : colors.text }
                  ]}>
                    {borough}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.searchContainer, { borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.secondaryText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={`Search ${selectedBorough} neighborhoods...`}
                placeholderTextColor={colors.secondaryText}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <FlatList
              data={filteredNeighborhoods}
              keyExtractor={item => item}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.neighborhoodItem,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => toggleNeighborhood(item)}
                  >
                    <Text style={[
                      styles.neighborhoodText,
                      { color: isSelected ? colors.primary : colors.text }
                    ]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.neighborhoodsList}
            />


          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontFamily: 'K2D-Bold',
    fontSize: 14,
    color: 'white',
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
  boroughSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  boroughButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  boroughText: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  neighborhoodsList: {
    paddingBottom: 20,
  },
  neighborhoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  neighborhoodText: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  selectedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
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
    fontFamily: "K2D-Medium",
    fontSize: 12,
  },
});