import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";

interface CafeSelectorProps {
  selected: string[];
  onChange: (cafes: string[]) => void;
  maxSelections?: number;
  isDark?: boolean;
}

const retroMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

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
  const [isLoading, setIsLoading] = useState(true);
  const [cafes, setCafes] = useState([]);
  const [initialRegion, setInitialRegion] = useState(null); // Store initial region for first load

  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    const getLocation = async () => {
      try {
        setIsLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        let userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (userLocation && userLocation.coords) {
          setLocation(userLocation.coords);
          // Set initialRegion only once
          if (!initialRegion) {
            setInitialRegion({
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
          // Set region to current user location
          setRegion({
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          fetchCafes(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
          );
        } else {
          setErrorMsg("Could not fetch location. Please try again.");
        }
      } catch (error) {
        setErrorMsg("Error fetching location: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    getLocation();
  }, [initialRegion]);

  const [showMaxDialog, setShowMaxDialog] = useState(false);

  const handleSelect = (place: any) => {
    if (!selected.includes(place)) {
      if (selected.length < maxSelections) {
        const cafeString = `${place.name}|||${place.vicinity}`;
        const updatedSelection = [...selected, cafeString];
        onChange(updatedSelection);
      } else {
        setShowMaxDialog(true);
      }
    }
  };

  const fetchCafes = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=cafe&keyword=coffee&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      setCafes(data.results);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching cafes:", error);
      setIsLoading(false);
    }
  };

  // Function to fetch the image URL of the cafe using the photo_reference
  const getCafeImage = (photoReference: string) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  };

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion); // Save the current map region
  };

  const fetchCafesInRegion = () => {
    if (region) {
      setIsLoading(true);
      fetchCafes(region.latitude, region.longitude); // Fetch cafes based on the saved region
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

            {/* Button to trigger fetching cafes in the current map region */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={fetchCafesInRegion}
            >
              <Text style={styles.searchButtonText}>Search this area</Text>
            </TouchableOpacity>

            <View style={styles.container}>
              {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : errorMsg ? (
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {errorMsg}
                </Text>
              ) : region ? (
                <MapView
                  style={styles.map}
                  customMapStyle={retroMapStyle} // Apply custom map style here
                  region={region} // Bind the region state to the MapView
                  initialRegion={initialRegion} // Set the initial region only once
                  onRegionChangeComplete={setRegion} // Update region on map change
                >
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title="Your Location"
                    pinColor="#FF6347"
                  />

                  {/* Markers for cafes */}
                  {cafes.map((cafe) => (
                    <Marker
                      key={cafe.place_id}
                      coordinate={{
                        latitude: cafe.geometry.location.lat,
                        longitude: cafe.geometry.location.lng,
                      }}
                      title={cafe.name}
                      description={cafe.vicinity}
                      onPress={() => {}}
                    >
                      {/* Callout content */}
                      <Callout onPress={() => handleSelect(cafe)}>
                        <TouchableWithoutFeedback>
                          <View style={{ padding: 10, width: 200 }}>
                            <Text
                              style={{ fontWeight: "bold", marginBottom: 5 }}
                            >
                              {cafe.name}
                            </Text>
                            <Text
                              style={{ fontWeight: "300", marginBottom: 5 }}
                            >
                              {cafe.vicinity}
                            </Text>

                            {/* Show the rating */}
                            {cafe.rating && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  marginBottom: 5,
                                }}
                              >
                                {Array.from({ length: 5 }, (_, index) => {
                                  if (index < Math.floor(cafe.rating)) {
                                    return (
                                      <Ionicons
                                        key={index}
                                        name="star"
                                        size={16}
                                        color="gold"
                                      />
                                    );
                                  } else if (index < Math.ceil(cafe.rating)) {
                                    return (
                                      <Ionicons
                                        key={index}
                                        name="star-half"
                                        size={16}
                                        color="gold"
                                      />
                                    );
                                  }
                                  return (
                                    <Ionicons
                                      key={index}
                                      name="star-outline"
                                      size={16}
                                      color="gold"
                                    />
                                  );
                                })}
                              </View>
                            )}

                            {cafe.photos && cafe.photos.length > 0 ? (
                              <Image
                                source={{
                                  uri: getCafeImage(
                                    cafe.photos[0].photo_reference,
                                  ),
                                }}
                                style={{
                                  width: 120,
                                  height: 120,
                                  borderRadius: 10,
                                }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text>No image available</Text>
                            )}

                            <View pointerEvents="box-none">
                              <TouchableOpacity
                                style={{
                                  backgroundColor: Colors.light.primary,
                                  padding: 10,
                                  borderRadius: 5,
                                  marginTop: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    color: "white",
                                    textAlign: "center",
                                  }}
                                >
                                  Select Cafe
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableWithoutFeedback>
                      </Callout>
                    </Marker>
                  ))}
                </MapView>
              ) : null}
            </View>

            <View style={styles.selectedCafes}>
              {selected.map((cafe, index) => {
                console.log("Selected Cafes:", selected); // Log each cafe object
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.cafeItem, { backgroundColor: colors.input }]}
                    onPress={() =>
                      onChange(selected.filter((_, i) => i !== index))
                    }
                  >
                    <View
                      style={{ flexDirection: "column", flex: 1, height: 40 }}
                    >
                      <Text style={[styles.cafeText, { fontWeight: "bold" }]}>
                        {cafe ? cafe.split('|||')[0] : "Cafe"}
                      </Text>
                      <Text style={styles.cafeText}>
                        {cafe ? cafe.split('|||')[1] : "Address"}
                      </Text>
                    </View>
                    <Ionicons name="close-circle" size={20} color="black" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Max selections dialog */}
      <Modal
        visible={showMaxDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMaxDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.dialogText, { color: colors.text }]}>
              You've already selected {maxSelections} cafes. Please remove one to add another.
            </Text>
            <TouchableOpacity
              style={[styles.dialogButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowMaxDialog(false)}
            >
              <Text style={styles.dialogButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  dialogText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  dialogButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
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
    height: "90%",
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
    padding: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  cafeText: {
    color: "black",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  cafeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  searchButton: {
    backgroundColor: "#F97415", // Green color for the button
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});