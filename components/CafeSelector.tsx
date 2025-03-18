import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

interface CafeSelectorProps {
  selected: string[];
  onChange: (cafes: string[]) => void;
  maxSelections?: number;
  isDark?: boolean;
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

  const handleSelect = (place: any) => {
    const cafeString = `${place.name} (${place.formatted_address})`;
    if (!selected.includes(cafeString) && selected.length < maxSelections) {
      onChange([...selected, cafeString]);
    }
  };

  const removeCafe = (index: number) => {
    onChange(selected.filter((_, i) => i !== index));
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

            <GooglePlacesAutocomplete
              placeholder='Search for cafes...'
              onPress={(data, details: any) => {
                if (details) {
                  handleSelect({
                    name: details.name,
                    formatted_address: details.formatted_address
                  });
                }
              }}
              query={{
                key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                language: 'en',
                types: ['cafe', 'restaurant'],
                location: '40.7128,-74.0060', // NYC coordinates
                radius: '10000',
                components: 'country:us'
              }}
              styles={{
                textInput: {
                  height: 40,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
                listView: {
                  backgroundColor: colors.background,
                },
                description: {
                  color: colors.text,
                }
              }}
            />

            <FlatList
              data={selected}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.cafeItem, { backgroundColor: colors.primary, borderColor: colors.border }]}
                  onPress={() => removeCafe(index)}
                >
                  <Text style={styles.cafeText}>{item}</Text>
                  <Ionicons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              )}
              style={styles.selectedList}
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
  selectedList: {
    marginTop: 20,
  },
  cafeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cafeText: {
    color: 'white',
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  }
});