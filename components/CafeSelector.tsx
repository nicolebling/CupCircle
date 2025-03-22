import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";


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
  isDark = false,
}: CafeSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [modalVisible, setModalVisible] = useState(false);

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          Alert.alert("Permission Denied", "Please enable location permissions in settings.");
          return;
        }

      let userLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (userLocation && userLocation.coords) {
          setLocation(userLocation.coords); // ✅ Safely setting state
        } else {
          setErrorMsg("Could not fetch location. Please try again.");
        }
      } catch (error) {
        setErrorMsg("Error fetching location: " + error.message);
      } finally {
        setLoading(false); // ✅ Stop loading regardless of success/failure
      }
    };

    getLocation(); // ✅ Calling function inside useEffect
  }, []);

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
        style={[
          styles.selector,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            { color: selected.length ? colors.text : colors.secondaryText },
          ]}
        >
          {selected.length
            ? `${selected.length} cafe${selected.length === 1 ? "" : "s"} selected`
            : "Select favorite cafes"}
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Cafes ({selected.length}/{maxSelections})
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.container}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker
                    coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                    title="Your Location"
                  />
                </MapView>
            </View>

            <View style={styles.selectedCafes}>
              {selected.map((cafe, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.cafeItem, { backgroundColor: colors.primary }]}
                  onPress={() =>
                    onChange(selected.filter((_, i) => i !== index))
                  }
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
  container: {
    flex: 1,
  },
  selector: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  selectedCafes: {
    marginTop: 20,
  },
  cafeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cafeText: {
    color: "white",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
