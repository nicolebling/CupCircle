
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CafeSelectorProps {
  selected: string[];
  onChange: (cafes: string[]) => void;
  maxSelections?: number;
  isDark?: boolean;
}

interface PlaceResult {
  name: string;
  formatted_address: string;
}

export default function CafeSelector({
  selected = [],
  onChange,
  maxSelections = 3,
  isDark = false
}: CafeSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);

  const searchCafes = async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Places API Text Search for better results
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input)}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch cafe suggestions');
      }

      const data = await response.json();
      console.log('Places API response:', data);
      
      if (data.results) {
        const places = data.results.map((result: any) => ({
          name: result.name,
          formatted_address: result.formatted_address,
        }));
        setSuggestions(places);
      }
    } catch (error) {
      console.error('Error searching cafes:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchText) {
        searchCafes(searchText);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  const toggleCafe = (cafe: string) => {
    if (selected.includes(cafe)) {
      onChange(selected.filter(c => c !== cafe));
    } else if (selected.length < maxSelections) {
      onChange([...selected, cafe]);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, { color: selected.length ? colors.text : colors.secondaryText }]}>
          {selected.length ? `${selected.length} cafe${selected.length === 1 ? '' : 's'} selected` : 'Select favorite cafes'}
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
                Select Cafes ({selected.length}/{maxSelections})
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.secondaryText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search cafes..."
                placeholderTextColor={colors.secondaryText}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {isLoading ? (
              <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : (
              <FlatList
                data={suggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                  const cafeString = `${item.name} (${item.formatted_address})`;
                  const isSelected = selected.includes(cafeString);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.cafeItem,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => toggleCafe(cafeString)}
                    >
                      <View style={styles.cafeInfo}>
                        <Text style={[
                          styles.cafeName,
                          { color: isSelected ? 'white' : colors.text }
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={[
                          styles.cafeAddress,
                          { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.secondaryText }
                        ]}>
                          {item.formatted_address}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.cafesList}
              />
            )}
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
  loader: {
    padding: 20,
  },
  cafesList: {
    paddingBottom: 20,
  },
  cafeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  cafeInfo: {
    flex: 1,
  },
  cafeName: {
    fontFamily: 'K2D-Medium',
    fontSize: 16,
  },
  cafeAddress: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
  }
});
