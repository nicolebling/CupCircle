import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const [initialRegion, setInitialRegion] = useState(null);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const [markersLoaded, setMarkersLoaded] = useState(false);

  // Cache and debouncing refs
  const cafeCache = useRef(new Map());
  const debounceTimer = useRef(null);
  const lastFetchLocation = useRef(null);
  const apiCallCount = useRef(0);
  const lastApiCall = useRef(0);

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
          accuracy: Location.Accuracy.Balanced, // Use balanced instead of high for better performance
        });

        if (userLocation && userLocation.coords) {
          setLocation(userLocation.coords);
          
          const newRegion = {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          
          setInitialRegion(newRegion);
          setRegion(newRegion);
          
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
    
    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

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

  // Rate limiting helper
  const canMakeApiCall = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall.current;
    const callsPerMinute = 10; // Limit to 10 calls per minute
    
    if (timeSinceLastCall < 60000 / callsPerMinute) {
      return false;
    }
    
    lastApiCall.current = now;
    apiCallCount.current++;
    return true;
  }, []);

  // Generate cache key for location
  const getCacheKey = useCallback((lat, lng, radius = 1500) => {
    // Round to 3 decimal places to group nearby locations
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    return `${roundedLat},${roundedLng},${radius}`;
  }, []);

  // Check if location is significantly different from last fetch
  const shouldFetchNewData = useCallback((lat, lng) => {
    if (!lastFetchLocation.current) return true;
    
    const distance = calculateDistance(
      lastFetchLocation.current.lat,
      lastFetchLocation.current.lng,
      lat,
      lng
    );
    
    // Only fetch if moved more than 0.5km
    return distance > 0.5;
  }, [calculateDistance]);

  // Filter markers based on current map region to prevent overload
  const filterVisibleMarkers = useCallback(
    (allCafes, currentRegion) => {
      if (!currentRegion || !allCafes.length) return [];

      const maxDistance =
        Math.max(
          currentRegion.latitudeDelta * 111,
          currentRegion.longitudeDelta * 111,
        ) / 2;

      // Limit to 15 markers max and prioritize by rating
      const filtered = allCafes
        .filter((cafe) => {
          const distance = calculateDistance(
            currentRegion.latitude,
            currentRegion.longitude,
            cafe.geometry.location.lat,
            cafe.geometry.location.lng,
          );
          return distance <= maxDistance;
        })
        .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating
        .slice(0, 15); // Limit to 15 markers for better performance

      return filtered;
    },
    [calculateDistance],
  );

  const fetchCafes = async (lat, lng, useCache = true) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key is missing");
        setErrorMsg("Google Maps API key not configured");
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = getCacheKey(lat, lng, 1500);
      if (useCache && cafeCache.current.has(cacheKey)) {
        console.log("Using cached cafe data");
        const cachedData = cafeCache.current.get(cacheKey);
        setCafes(cachedData);
        
        const currentRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        const initialVisible = filterVisibleMarkers(cachedData, currentRegion);
        setVisibleMarkers(initialVisible);
        setMarkersLoaded(true);
        setIsLoading(false);
        return;
      }

      // Check if we should make API call
      if (!canMakeApiCall()) {
        console.log("Rate limit reached, using existing data");
        setIsLoading(false);
        return;
      }

      // Check if location changed significantly
      if (!shouldFetchNewData(lat, lng)) {
        console.log("Location change too small, skipping fetch");
        setIsLoading(false);
        return;
      }

      console.log(`Making API call ${apiCallCount.current} for location: ${lat}, ${lng}`);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=cafe&keyword=coffee&key=${apiKey}`,
        {
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "REQUEST_DENIED") {
        setErrorMsg("Google Maps API access denied. Please check your API key and permissions.");
        setIsLoading(false);
        return;
      }

      if (data.status === "OVER_QUERY_LIMIT") {
        setErrorMsg("Too many requests. Please try again later.");
        setIsLoading(false);
        return;
      }

      const allCafes = data.results || [];
      
      // Cache the results
      cafeCache.current.set(cacheKey, allCafes);
      
      // Store last fetch location
      lastFetchLocation.current = { lat, lng };
      
      setCafes(allCafes);

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

  // Function to fetch the image URL of the cafe using the photo_reference
  const getCafeImage = (photoReference: string) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  };

  // Debounced region change handler to update visible markers
  const onRegionChangeComplete = useCallback(
    (newRegion) => {
      setRegion(newRegion);

      // Clear any existing debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Update visible markers immediately for better UX
      if (cafes.length > 0) {
        const newVisible = filterVisibleMarkers(cafes, newRegion);
        setVisibleMarkers(newVisible);
      }

      // Debounce API calls for 2 seconds
      debounceTimer.current = setTimeout(() => {
        if (shouldFetchNewData(newRegion.latitude, newRegion.longitude)) {
          // Only fetch if we've moved significantly and have cache space
          if (cafeCache.current.size < 50) { // Limit cache size
            fetchCafes(newRegion.latitude, newRegion.longitude, false);
          }
        }
      }, 2000);
    },
    [cafes, filterVisibleMarkers, shouldFetchNewData],
  );

  const fetchCafesInRegion = () => {
    if (region && canMakeApiCall()) {
      setIsLoading(true);
      setMarkersLoaded(false);
      fetchCafes(region.latitude, region.longitude, false); // Force fresh fetch
    } else {
      Alert.alert(
        "Rate Limit",
        "Please wait a moment before searching again to avoid excessive API usage.",
        [{ text: "OK" }]
      );
    }
  };

  // Memoize markers to prevent unnecessary re-renders
  const memoizedMarkers = useMemo(() => {
    if (!markersLoaded || visibleMarkers.length === 0) return [];

    return visibleMarkers.map((cafe) => (
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
                {cafe.vicinity}
              </Text>

              {/* Show the rating */}
              {cafe.rating && (
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 5,
                    justifyContent: "center",
                    alignItems: "center",
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
                  <Text
                    style={{
                      marginLeft: 5,
                      fontSize: 12,
                      fontFamily: "K2D-SemiBold",
                    }}
                  >
                    {cafe.rating.toFixed(1)}
                  </Text>
                </View>
              )}

              {cafe.photos && cafe.photos.length > 0 ? (
                <Image
                  source={{
                    uri: getCafeImage(cafe.photos[0].photo_reference),
                  }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 10,
                    alignSelf: "center",
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ textAlign: "center" }}>No image available</Text>
              )}

              <View pointerEvents="box-none" style={{ width: "100%" }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: Colors.light.primary,
                    padding: 10,
                    borderRadius: 5,
                    marginTop: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "K2D-Medium",
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
    ));
  }, [visibleMarkers, markersLoaded]);

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
                    customMapStyle={retroMapStyle} // Apply custom map style here
                    region={region} // Bind the region state to the MapView
                    initialRegion={initialRegion} // Set the initial region only once
                    onRegionChangeComplete={onRegionChangeComplete} // Update region on map change with debouncing
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    loadingEnabled={true}
                    moveOnMarkerPress={false}
                    maxZoomLevel={18}
                    minZoomLevel={10}
                  >
                    {location && (
                      <Marker
                        coordinate={{
                          latitude: location.latitude,
                          longitude: location.longitude,
                        }}
                        title="Your Location"
                        pinColor="#FF6347"
                      />
                    )}

                    {/* Lazy-loaded markers */}
                    {memoizedMarkers}
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
});
