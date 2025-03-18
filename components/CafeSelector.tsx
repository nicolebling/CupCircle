import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
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
    const cafeString = place.description;
    if (!selected.includes(cafeString) && selected.length < maxSelections) {
      onChange([...selected, cafeString]);
      setModalVisible(false);
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


              <GooglePlacesAutocomplete
              placeholder="Search for cafes..."
              
              onPress={(data) => {
                console.log('Selected place:', data);
                handleSelect(data);
              }}
              onFail={(error) => console.error('Places API error:', error)}
              query={{
                key: "AIzaSyDYiKrt8lG2X2HxF4DUqVqIFi4wpGo6Aec",
                language: 'en',
              }}
              requestUrl={{
                url: 'https://maps.googleapis.com/maps/api',
                useOnPlatform: 'web',
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
              

            <View style={styles.selectedCafes}>
              {selected.map((cafe, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.cafeItem, { backgroundColor: colors.primary }]}
                  onPress={() => onChange(selected.filter((_, i) => i !== index))}
                >
                  <Text style={styles.cafeText}>{cafe}</Text>
                  <Ionicons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1
  },
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedCafes: {
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
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  }
});