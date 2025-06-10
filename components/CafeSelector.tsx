import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import LogoAnimation from "@/components/LogoAnimation";

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
  const [visibleMarkers, setVisibleMarkers] = useState([]); // Markers currently visible on map
  const [markersLoaded, setMarkersLoaded] = useState(false);

  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      try {
        setIsLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted) {
            setErrorMsg("Permission to access location was denied");
            setIsLoading(false);
          }
          return;
        }

        let userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (userLocation && userLocation.coords && isMounted) {
          const coords = userLocation.coords;
          setLocation(coords);

          const newRegion = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };

          setInitialRegion(newRegion);
          setRegion(newRegion);

          // Fetch cafes after setting region
          fetchCafes(coords.latitude, coords.longitude);
        } else if (isMounted) {
          setErrorMsg("Could not fetch location. Please try again.");
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMsg("Error fetching location: " + error.message);
          setIsLoading(false);
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []); // Remove initialRegion dependency to prevent loops

  const handleSelect = (place: any) => {
    if (!selected.includes(place)) {
      if (selected.length < maxSelections) {
        const cafeString = `${place.name}|||${place.vicinity}`;
        const updatedSelection = [...selected, cafeString];
        onChange(updatedSelection);
      } else {
        Alert.alert(
          "Maximum cafes selected",
          "You've already added 3 cafes. Please remove one to add another.",
          [{ text: "OK" }],
        );
      }
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Filter markers based on current map region to prevent overload
  const filterVisibleMarkers = useCallback(
    (allCafes, currentRegion) => {
      if (!currentRegion || !allCafes || !allCafes.length) return [];

      const maxDistance =
        Math.max(
          currentRegion.latitudeDelta * 111, // Convert degrees to km (roughly)
          currentRegion.longitudeDelta * 111,
        ) / 2;

      // Limit to 15 markers max to prevent performance issues
      const filtered = allCafes
        .filter((cafe) => {
          if (
            !cafe?.geometry?.location?.lat ||
            !cafe?.geometry?.location?.lng
          ) {
            return false;
          }

          const distance = calculateDistance(
            currentRegion.latitude,
            currentRegion.longitude,
            cafe.geometry.location.lat,
            cafe.geometry.location.lng,
          );
          return distance <= maxDistance && !isNaN(distance);
        })
        .slice(0, 15);

      return filtered;
    },
    [calculateDistance],
  );

  const fetchCafes = async (lat, lng) => {
    try {
      setMarkersLoaded(false);

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key is missing");
        setErrorMsg("Google Maps API key not configured");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=cafe&keyword=coffee&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();

      if (data.status === "REQUEST_DENIED") {
        setErrorMsg(
          "Google Maps API access denied. Please check your API key and permissions.",
        );
        setIsLoading(false);
        return;
      }

      const allCafes = data.results || [];
      setCafes(allCafes);

      // Use the current region for filtering
      const currentRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      const initialVisible = filterVisibleMarkers(allCafes, currentRegion);
      setVisibleMarkers(initialVisible);
      setMarkersLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching cafes:", error);
      setErrorMsg("Failed to load cafes. Please try again.");
      setIsLoading(false);
    }
  };

  // Throttled region change handler to update visible markers
  const handleRegionChange = useCallback(
    (newRegion) => {
      // Validate region to prevent crashes
      if (
        !newRegion ||
        typeof newRegion.latitude !== "number" ||
        typeof newRegion.longitude !== "number" ||
        isNaN(newRegion.latitude) ||
        isNaN(newRegion.longitude) ||
        newRegion.latitudeDelta <= 0 ||
        newRegion.longitudeDelta <= 0
      ) {
        console.log('Invalid region data filtered out:', newRegion);
        return;
      }

      console.log('Region changed to:', newRegion);
      setRegion(newRegion);

      // Update visible markers based on new region
      if (cafes.length > 0) {
        const newVisible = filterVisibleMarkers(cafes, newRegion);
        console.log(`Updated visible markers: ${newVisible.length} out of ${cafes.length} total cafes`);
        setVisibleMarkers(newVisible);
      }
    },
    [cafes, filterVisibleMarkers],
  );

  // Throttle the region change handler to prevent excessive re-renders
  const throttledRegionChange = useMemo(() => {
    let timeoutId;
    return (region) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleRegionChange(region), 300);
    };
  }, [handleRegionChange]);

  const fetchCafesInRegion = () => {
    if (region) {
      setIsLoading(true);
      setMarkersLoaded(false);
      fetchCafes(region.latitude, region.longitude); // Fetch cafes based on the saved region
    }
  };

  // Transform cafes data for clustering with validation
  const clusteredData = useMemo(() => {
    if (!visibleMarkers?.length) return [];

    const validatedData = visibleMarkers
      .filter((cafe) => {
        // Validate marker data before rendering
        const lat = cafe?.geometry?.location?.lat;
        const lng = cafe?.geometry?.location?.lng;

        if (
          typeof lat !== 'number' ||
          typeof lng !== 'number' ||
          isNaN(lat) ||
          isNaN(lng) ||
          !cafe?.place_id ||
          !cafe?.name
        ) {
          console.log('Invalid cafe data filtered out:', cafe);
          return false;
        }

        return true;
      })
      .map((cafe) => ({
        geometry: {
          coordinates: [cafe.geometry.location.lng, cafe.geometry.location.lat]
        },
        properties: {
          ...cafe,
          place_id: cafe.place_id,
          name: cafe.name,
          vicinity: cafe.vicinity || 'Unknown location',
          rating: cafe.rating || 0,
        }
      }));

    console.log(`Rendering ${validatedData.length} valid markers out of ${visibleMarkers.length} total`);
    return validatedData;
  }, [visibleMarkers]);

  // Render cluster or individual marker with validation
  const renderCluster = (cluster, onPress) => {
    // Validate cluster data
    if (!cluster || !cluster.coordinate) {
      console.log('Invalid cluster data:', cluster);
      return null;
    }

    const { id, point_count, coordinate } = cluster;

    // Validate coordinate
    const lat = coordinate?.latitude;
    const lng = coordinate?.longitude;

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      console.log('Invalid coordinate data:', coordinate);
      return null;
    }

    const clusterId = `cluster-${id}`;

    if (point_count > 1) {
      // Render cluster marker
      return (
        <Marker
          key={clusterId}
          coordinate={coordinate}
          onPress={onPress}
          tracksViewChanges={false}
        >
          <View style={[styles.clusterMarker, { backgroundColor: colors.primary }]}>
            <Text style={[styles.clusterText, { color: colors.background }]}>
              {point_count}
            </Text>
          </View>
        </Marker>
      );
    }

    // Render individual cafe marker
    const cafe = cluster.properties;

    // Validate cafe data
    if (!cafe?.place_id || !cafe?.name) {
      console.log('Invalid cafe properties:', cafe);
      return null;
    }

    return (
      <Marker
        key={cafe.place_id}
        coordinate={coordinate}
        title={cafe.name}
        description={cafe.vicinity || 'Unknown location'}
        onPress={() => {}}
        tracksViewChanges={false}
      >
        <Callout onPress={() => handleSelect(cafe)}>
          <TouchableWithoutFeedback>
            <View
              style={{
                padding: 10,
                width: 200,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "K2D-SemiBold",
                  marginBottom: 5,
                  textAlign: "center",
                }}
              >
                {cafe.name}
              </Text>
              <Text
                style={{
                  fontFamily: "K2D-Regular",
                  marginBottom: 5,
                  textAlign: "center",
                }}
              >
                {cafe.vicinity || 'Unknown location'}
              </Text>
              <Text
                style={{
                  fontFamily: "K2D-Regular",
                  fontSize: 12,
                  color: colors.primary,
                  textAlign: "center",
                }}
              >
                {cafe.rating ? `⭐ ${cafe.rating}` : ""}
              </Text>
              <Text
                style={{
                  fontFamily: "K2D-SemiBold",
                  color: colors.primary,
                  marginTop: 5,
                  textAlign: "center",
                }}
              >
                Select this café
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </Callout>
      </Marker>
    );
  };

  return (
    <View>
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
              : "Select top 3 cafes"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.secondaryText}
          />
        </TouchableOpacity>

        {selected.length > 0 && (
          <View style={styles.selectedTagsContainer}>
            {selected.map((cafe, index) => {
              const [cafeName, cafeAddress] = cafe.split("|||");
              return (
                <View
                  key={index}
                  style={[
                    styles.selectedTag,
                    {
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <View style={styles.tagContent}>
                    <Ionicons
                      name="cafe"
                      size={12}
                      color={colors.primary}
                      style={styles.tagIcon}
                    />
                    <View>
                      <Text style={[styles.tagName, { color: colors.primary }]}>
                        {cafeName}
                      </Text>
                      <Text
                        style={[
                          styles.tagAddress,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {cafeAddress}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        onChange(selected.filter((_, i) => i !== index))
                      }
                      style={styles.removeButton}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

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
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <LogoAnimation size={120} />
                  <Text
                    style={{
                      fontFamily: "K2D-Regular",
                    }}
                  >
                    Warming up the café pins...
                  </Text>
                </View>
              ) : errorMsg ? (
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {errorMsg}
                </Text>
              ) : region ? (
                <View style={styles.container}>
                  <MapView
                    style={styles.map}
                    customMapStyle={retroMapStyle}
                    region={region}
                    initialRegion={initialRegion}
                    onRegionChangeComplete={throttledRegionChange}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    loadingEnabled={true}
                    moveOnMarkerPress={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    scrollEnabled={true}
                    zoomEnabled={true}
                  >
                    {/* Temporarily removed all markers to test crash prevention */}
                    {/* User location marker commented out */}
                    {/* {location && 
                      typeof location.latitude === 'number' && 
                      typeof location.longitude === 'number' && 
                      !isNaN(location.latitude) && 
                      !isNaN(location.longitude) && (
                      <Marker
                        coordinate={{
                          latitude: location.latitude,
                          longitude: location.longitude,
                        }}
                        title="Your Location"
                        pinColor="#FF6347"
                        tracksViewChanges={false}
                      />
                    )} */}

                    {/* Cafe markers commented out */}
                    {/* {clusteredData.map((cluster, index) => {
                      const lat = cluster?.geometry?.coordinates?.[1];
                      const lng = cluster?.geometry?.coordinates?.[0];

                      if (
                        typeof lat !== 'number' ||
                        typeof lng !== 'number' ||
                        isNaN(lat) ||
                        isNaN(lng)
                      ) {
                        console.log('Invalid cluster geometry:', cluster);
                        return null;
                      }

                      const onPress = () => {
                        const newRegion = {
                          latitude: lat,
                          longitude: lng,
                          latitudeDelta: region.latitudeDelta / 2,
                          longitudeDelta: region.longitudeDelta / 2,
                        };
                        setRegion(newRegion);
                      };

                      return renderCluster({
                        id: index,
                        point_count: 1,
                        coordinate: {
                          latitude: lat,
                          longitude: lng,
                        },
                        properties: cluster.properties,
                      }, onPress);
                    }).filter(Boolean)} */}
                  </MapView>

                  {/* Floating Search Button */}
                  <TouchableOpacity
                    style={styles.floatingSearchButton}
                    onPress={fetchCafesInRegion}
                  >
                    <Text style={styles.floatingSearchButtonText}>
                      Search this area
                    </Text>
                  </TouchableOpacity>

                  {/* Loading indicator for markers */}
                  {!markersLoaded && (
                    <View style={styles.markerLoadingOverlay}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text
                        style={[
                          styles.markerLoadingText,
                          { color: colors.text },
                        ]}
                      >
                        Loading cafes...
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>

            <View style={styles.selectedCafes}>
              {selected.map((cafe, index) => {
                const [cafeName, cafeAddress] = cafe
                  ? cafe.split("|||")
                  : ["", ""];
                return (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: colors.primary,
                        marginBottom: 8,
                        padding: 8,
                      },
                    ]}
                  >
                    <View style={styles.tagContent}>
                      <Ionicons
                        name="cafe"
                        size={12}
                        color={colors.primary}
                        style={{ marginRight: 8 }}
                      />
                      <View>
                        <Text
                          style={[styles.tagName, { color: colors.primary }]}
                        >
                          {cafeName}
                        </Text>
                        <Text
                          style={[
                            styles.tagAddress,
                            { color: colors.secondaryText },
                          ]}
                        >
                          {cafeAddress}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          onChange(selected.filter((_, i) => i !== index))
                        }
                        style={styles.removeButton}
                      >
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagName: {
    fontSize: 14,
    fontFamily: "K2D-Medium",
  },
  tagAddress: {
    fontSize: 12,
    fontFamily: "K2D-Regular",
    marginTop: 2,
  },
  removeButton: {
    marginLeft: "auto",
  },
  selectedTagsContainer: {
    marginTop: 8,
  },
  selectedTag: {
    borderRadius: 8,
    marginBottom: 6,
    padding: 8,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagIcon: {
    marginRight: 8,
  },
  tagName: {
    fontSize: 14,
    fontFamily: "K2D-Medium",
  },
  tagAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    marginLeft: "auto",
  },
  errorText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    fontFamily: "K2D-Regular",
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
    fontFamily: "K2D-Bold",
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
    fontFamily: "K2D-Regular",
    color: "black",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  cafeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  floatingSearchButton: {
    position: "absolute",
    top: 20,
    backgroundColor: "#F97415",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 200,
    alignSelf: "center",
  },
  floatingSearchButtonText: {
    fontFamily: "K2D-Medium",
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  markerLoadingOverlay: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerLoadingText: {
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "K2D-Regular",
  },
    clusterMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  clusterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});