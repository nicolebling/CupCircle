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
import { supabase } from "@/lib/supabase";
import { geoUtils } from "@/utils/geoUtils";

interface CafeSelectorProps {
  selected: string[];
  onChange: (cafes: string[]) => void;
  onCentroidChange?: (centroid: { latitude: number; longitude: number } | null) => void;
  maxSelections?: number;
  isDark?: boolean;
}

export default function CafeSelector({
  selected = [],
  onChange,
  onCentroidChange,
  maxSelections = 3,
  isDark = false,
}: CafeSelectorProps) {
  
  // Calculate centroid from cafe coordinates
  const calculateCentroid = (cafes: string[]): { latitude: number; longitude: number } | null => {
    if (cafes.length === 0) return null;
    
    const coordinates: Array<{ latitude: number; longitude: number }> = [];
    
    for (const cafe of cafes) {
      const parts = cafe.split("|||");
      if (parts.length >= 4) {
        const lng = parseFloat(parts[2]);
        const lat = parseFloat(parts[3]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          coordinates.push({ latitude: lat, longitude: lng });
        }
      }
    }
    
    if (coordinates.length === 0) return null;
    
    // For 1 cafe: use its coordinates
    if (coordinates.length === 1) {
      return coordinates[0];
    }
    
    // For 2 cafes: calculate midpoint
    if (coordinates.length === 2) {
      return {
        latitude: (coordinates[0].latitude + coordinates[1].latitude) / 2,
        longitude: (coordinates[0].longitude + coordinates[1].longitude) / 2
      };
    }
    
    // For 3 cafes: calculate centroid of triangle
    const totalLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0);
    const totalLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0);
    
    return {
      latitude: totalLat / coordinates.length,
      longitude: totalLng / coordinates.length
    };
  };
  
  // Update centroid whenever selected cafes change
  useEffect(() => {
    if (onCentroidChange) {
      const centroid = calculateCentroid(selected);
      onCentroidChange(centroid);
    }
  }, [selected, onCentroidChange]);
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
  const [featuredCafes, setFeaturedCafes] = useState([]);

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
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          };

          setInitialRegion(newRegion);
          setRegion(newRegion);

          // Fetch cafes and featured cafes after setting region
          fetchCafes(coords.latitude, coords.longitude);
          fetchFeaturedCafes();
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

  const handleSelect = (place: any, isFeatured = false) => {
    let cafeString;
    let latitude, longitude;
    
    if (isFeatured) {
      // Featured cafe from our database
      latitude = place.latitude;
      longitude = place.longitude;
      cafeString = `${place.name}|||${place.address}|||${longitude}|||${latitude}`;
    } else {
      // Regular cafe from Google Places
      latitude = place.geometry.location.lat;
      longitude = place.geometry.location.lng;
      cafeString = `${place.name}|||${place.vicinity}|||${longitude}|||${latitude}`;
    }

    // Check if the cafe is within New York State
    if (!geoUtils.isWithinNewYorkState(latitude, longitude)) {
      Alert.alert(
        "Location Not Available",
        "We're currently only available in New York State. Please select a cafe within NY to continue.",
        [{ text: "OK" }]
      );
      return;
    }
    
    if (selected.includes(cafeString)) {
      Alert.alert(
        "Cafe already selected",
        "You've already selected this cafe. Please choose a different one.",
        [{ text: "OK" }],
      );
      return;
    }
    
    if (selected.length < maxSelections) {
      const updatedSelection = [...selected, cafeString];
      onChange(updatedSelection);
    } else {
      Alert.alert(
        "Maximum cafes selected",
        "You've already added 3 cafes. Please remove one to add another.",
        [{ text: "OK" }],
      );
    }
  };

  // Fetch featured cafes from Supabase
  const fetchFeaturedCafes = async () => {
    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('is_featured', true);

      if (error) {
        console.error('Error fetching featured cafes:', error);
        return;
      }

      setFeaturedCafes(data || []);
    } catch (error) {
      console.error('Error fetching featured cafes:', error);
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
        .slice(0, 20);

      return filtered;
    },
    [calculateDistance],
  );

  // Helper function to check if a Google Maps cafe is too close to a featured cafe
  const isNearFeaturedCafe = (googleCafe, featuredCafes, threshold = 15) => {
    // threshold in meters - cafes within 100m are considered the same location
    for (const featuredCafe of featuredCafes) {
      const distance = calculateDistance(
        googleCafe.geometry.location.lat,
        googleCafe.geometry.location.lng,
        featuredCafe.latitude,
        featuredCafe.longitude
      ) * 1000; // Convert km to meters
      
      if (distance <= threshold) {
        return true;
      }
    }
    return false;
  };

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

      const allGoogleCafes = data.results || [];
      
      // Filter out Google Maps cafes that are too close to featured cafes
      const filteredGoogleCafes = allGoogleCafes.filter(googleCafe => 
        !isNearFeaturedCafe(googleCafe, featuredCafes)
      );
      
      setCafes(filteredGoogleCafes);

      // Use the current region for filtering
      const currentRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      const initialVisible = filterVisibleMarkers(filteredGoogleCafes, currentRegion);
      setVisibleMarkers(initialVisible);
      setMarkersLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching cafes:", error);
      setErrorMsg("Failed to load cafes. Please try again.");
      setIsLoading(false);
    }
  };

  // Simple region change handler that only tracks region without updating markers
  const handleRegionChange = useCallback((newRegion) => {
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
      console.log("Invalid region data filtered out:", newRegion);
      return;
    }

    console.log("Region changed to:", newRegion);
    setRegion(newRegion);
    // Removed automatic marker updates - markers only update on initial load and search button
  }, []);

  const fetchCafesInRegion = async () => {
    if (region) {
      setIsLoading(true);
      setMarkersLoaded(false);

      try {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error("Google Maps API key is missing");
          setErrorMsg("Google Maps API key not configured");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${region.latitude},${region.longitude}&radius=2000&type=cafe&keyword=coffee&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        );
        const data = await response.json();

        if (data.status === "REQUEST_DENIED") {
          setErrorMsg(
            "Google Maps API access denied. Please check your API key and permissions.",
          );
          setIsLoading(false);
          return;
        }

        // Also refresh featured cafes first to ensure we have the latest data
        await fetchFeaturedCafes();

        const allGoogleCafes = data.results || [];
        
        // Filter out Google Maps cafes that are too close to featured cafes
        const filteredGoogleCafes = allGoogleCafes.filter(googleCafe => 
          !isNearFeaturedCafe(googleCafe, featuredCafes)
        );
        
        setCafes(filteredGoogleCafes);

        // Update visible markers based on current region
        const newVisible = filterVisibleMarkers(filteredGoogleCafes, region);
        setVisibleMarkers(newVisible);
        
        setMarkersLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching cafes:", error);
        setErrorMsg("Failed to load cafes. Please try again.");
        setIsLoading(false);
      }
    }
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
                    region={region}
                    onRegionChangeComplete={handleRegionChange}
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
                    {location &&
                      typeof location.latitude === "number" &&
                      typeof location.longitude === "number" &&
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
                      )}

                    {/* Featured Cafe markers - always visible with special styling */}
                    {featuredCafes.map((cafe) => (
                      <Marker
                        key={`featured-${cafe.id}`}
                        coordinate={{
                          latitude: cafe.latitude,
                          longitude: cafe.longitude,
                        }}
                        title={cafe.name}
                        description={cafe.address}
                        pinColor="#FFD700" // Gold color for featured cafes
                        tracksViewChanges={false}
                      >
                        <Callout onPress={() => handleSelect(cafe, true)}>
                          <TouchableWithoutFeedback>
                            <View
                              style={{
                                padding: 10,
                                width: 220,
                                alignItems: "center",
                              }}
                            >
                              <View style={{
                                backgroundColor: '#FFD700',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 10,
                                marginBottom: 5,
                              }}>
                                <Text
                                  style={{
                                    fontFamily: "K2D-Bold",
                                    fontSize: 10,
                                    color: 'white',
                                    textAlign: "center",
                                  }}
                                >
                                  ⭐ CAFE SPOTLIGHT
                                </Text>
                              </View>
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
                                {cafe.address}
                              </Text>
                              {cafe.perks && (
                                <View style={{ marginBottom: 5 }}>
                                  <Text
                                    style={{
                                      fontFamily: "K2D-SemiBold",
                                      fontSize: 12,
                                      color: '#333',
                                      textAlign: "center",
                                      marginBottom: 3,
                                    }}
                                  >
                                    Special Perks:
                                  </Text>
                                  {(() => {
                                    try {
                                      const perksObj = typeof cafe.perks === 'string' ? JSON.parse(cafe.perks) : cafe.perks;
                                      return Object.entries(perksObj).map(([key, value], index) => {
                                        let displayText = '';
                                        
                                        if (typeof value === 'boolean' && value) {
                                          // For boolean true values, display the key as a feature
                                          displayText = key.replace(/_/g, ' ');
                                        } else if (typeof value === 'string') {
                                          // For string values, display the actual value
                                          displayText = value;
                                        } else if (typeof value === 'number') {
                                          // For number values, display with the key
                                          displayText = `${key.replace(/_/g, ' ')}: ${value}`;
                                        }
                                        
                                        return displayText ? (
                                          <Text
                                            key={index}
                                            style={{
                                              fontFamily: "K2D-Regular",
                                              fontSize: 11,
                                              color: '#333',
                                              textAlign: "center",
                                              marginBottom: 2,
                                            }}
                                          >
                                            ✓ {displayText}
                                          </Text>
                                        ) : null;
                                      });
                                    } catch (error) {
                                      // Fallback for non-JSON perks
                                      return (
                                        <Text
                                          style={{
                                            fontFamily: "K2D-Regular",
                                            fontSize: 11,
                                            color: '#333',
                                            textAlign: "center",
                                          }}
                                        >
                                          ✓ {cafe.perks}
                                        </Text>
                                      );
                                    }
                                  })()}
                                </View>
                              )}
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
                    ))}

                    {/* Regular Cafe markers */}
                    {visibleMarkers.map((cafe) => (
                      <Marker
                        key={cafe.place_id}
                        coordinate={{
                          latitude: cafe.geometry.location.lat,
                          longitude: cafe.geometry.location.lng,
                        }}
                        title={cafe.name}
                        description={cafe.vicinity || "Unknown location"}
                        tracksViewChanges={false}
                      >
                        <Callout onPress={() => handleSelect(cafe, false)}>
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
                                {cafe.vicinity || "Unknown location"}
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
                    ))}
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
                const [cafeName, cafeAddress] = cafe.split("|||");
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
    fontFamily: "K2D-Regular",
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
