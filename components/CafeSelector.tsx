
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
import Supercluster from "supercluster";

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
  const [markersLoaded, setMarkersLoaded] = useState(false);

  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Initialize Supercluster
  const cluster = useMemo(() => {
    return new Supercluster({
      radius: 40, // Cluster radius in pixels
      maxZoom: 16, // Maximum zoom level for clustering
      minZoom: 0, // Minimum zoom level
      minPoints: 2, // Minimum points to form a cluster
    });
  }, []);

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

  // Calculate zoom level from region
  const getZoomLevel = useCallback((region) => {
    const { longitudeDelta } = region;
    return Math.round(Math.log(360 / longitudeDelta) / Math.LN2);
  }, []);

  // Get map bounds for clustering
  const getMapBounds = useCallback((region) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    return [
      longitude - longitudeDelta / 2, // westLng
      latitude - latitudeDelta / 2,   // southLat
      longitude + longitudeDelta / 2, // eastLng
      latitude + latitudeDelta / 2,   // northLat
    ];
  }, []);

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
      
      // Validate and transform data for clustering
      const validCafes = allCafes.filter((cafe) => {
        const lat = cafe?.geometry?.location?.lat;
        const lng = cafe?.geometry?.location?.lng;
        
        return (
          typeof lat === 'number' &&
          typeof lng === 'number' &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          cafe?.place_id &&
          cafe?.name
        );
      }).slice(0, 10); // Limit to maximum 10 markers

      console.log(`Loaded ${validCafes.length} valid cafes out of ${allCafes.length} total (limited to 10 for performance)`);
      
      // Transform data for supercluster
      const points = validCafes.map((cafe) => ({
        type: "Feature",
        properties: {
          cluster: false,
          place_id: cafe.place_id,
          name: cafe.name,
          vicinity: cafe.vicinity || 'Unknown location',
          rating: cafe.rating || 0,
        },
        geometry: {
          type: "Point",
          coordinates: [cafe.geometry.location.lng, cafe.geometry.location.lat],
        },
      }));

      // Load points into cluster
      cluster.load(points);
      
      setCafes(validCafes);
      setMarkersLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching cafes:", error);
      setErrorMsg("Failed to load cafes. Please try again.");
      setIsLoading(false);
    }
  };

  // Get clustered markers for current region (limited to 10)
  const clusteredMarkers = useMemo(() => {
    if (!region || cafes.length === 0) return [];

    // Validate region before clustering
    if (
      typeof region.latitude !== "number" ||
      typeof region.longitude !== "number" ||
      isNaN(region.latitude) ||
      isNaN(region.longitude) ||
      region.latitudeDelta <= 0 ||
      region.longitudeDelta <= 0
    ) {
      console.log('Invalid region for clustering:', region);
      return [];
    }

    try {
      const bounds = getMapBounds(region);
      const zoom = getZoomLevel(region);
      
      console.log(`Getting clusters for zoom ${zoom} with bounds:`, bounds);
      
      const clusters = cluster.getClusters(bounds, zoom).slice(0, 10); // Limit to 10 markers
      
      console.log(`Generated ${clusters.length} clusters/markers (limited to 10 for performance)`);
      
      return clusters.map((feature, index) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        
        // Validate coordinates
        if (
          typeof latitude !== 'number' ||
          typeof longitude !== 'number' ||
          isNaN(latitude) ||
          isNaN(longitude)
        ) {
          console.log('Invalid cluster coordinates:', feature);
          return null;
        }

        return {
          id: feature.properties.cluster_id || `marker-${index}`,
          latitude,
          longitude,
          point_count: feature.properties.point_count,
          properties: feature.properties,
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error generating clusters:', error);
      return [];
    }
  }, [region, cafes, cluster, getMapBounds, getZoomLevel]);

  // Throttled region change handler with enhanced validation
  const handleRegionChange = useCallback(
    (newRegion) => {
      // Enhanced validation to prevent crashes
      if (
        !newRegion ||
        typeof newRegion.latitude !== "number" ||
        typeof newRegion.longitude !== "number" ||
        isNaN(newRegion.latitude) ||
        isNaN(newRegion.longitude) ||
        newRegion.latitudeDelta <= 0 ||
        newRegion.longitudeDelta <= 0 ||
        Math.abs(newRegion.latitude) > 90 ||
        Math.abs(newRegion.longitude) > 180 ||
        newRegion.latitudeDelta > 180 ||
        newRegion.longitudeDelta > 360
      ) {
        console.log('Invalid region data filtered out:', newRegion);
        return;
      }

      // Ensure minimum deltas to prevent zoom crashes
      const safeRegion = {
        ...newRegion,
        latitudeDelta: Math.max(newRegion.latitudeDelta, 0.001),
        longitudeDelta: Math.max(newRegion.longitudeDelta, 0.001),
      };

      console.log('Region changed to:', safeRegion);
      setRegion(safeRegion);
    },
    [],
  );

  // Enhanced throttling and debouncing to prevent crashes
  const throttledRegionChange = useMemo(() => {
    let timeoutId;
    let lastUpdate = 0;
    const THROTTLE_DELAY = 500; // Increased delay
    const MIN_UPDATE_INTERVAL = 100;
    
    return (newRegion) => {
      const now = Date.now();
      
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // If enough time has passed, update immediately
      if (now - lastUpdate > MIN_UPDATE_INTERVAL) {
        lastUpdate = now;
        handleRegionChange(newRegion);
      } else {
        // Otherwise, schedule an update
        timeoutId = setTimeout(() => {
          lastUpdate = Date.now();
          handleRegionChange(newRegion);
        }, THROTTLE_DELAY);
      }
    };
  }, [handleRegionChange]);

  const fetchCafesInRegion = () => {
    if (region) {
      setIsLoading(true);
      setMarkersLoaded(false);
      fetchCafes(region.latitude, region.longitude);
    }
  };

  // Handle cluster press to zoom in
  const onClusterPress = useCallback((clusterId) => {
    try {
      if (!clusterId || !cluster || !region) {
        console.log('Invalid cluster press data:', { clusterId, cluster: !!cluster, region: !!region });
        return;
      }

      // Get the cluster's children (leaves)
      const clusterFeatures = cluster.getLeaves(clusterId, Infinity);
      
      if (clusterFeatures && clusterFeatures.length > 0) {
        // Calculate the center of all points in the cluster
        let totalLat = 0;
        let totalLng = 0;
        let validPoints = 0;

        clusterFeatures.forEach(feature => {
          const [lng, lat] = feature.geometry.coordinates;
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            totalLat += lat;
            totalLng += lng;
            validPoints++;
          }
        });

        if (validPoints > 0) {
          const centerLat = totalLat / validPoints;
          const centerLng = totalLng / validPoints;
          
          // Calculate new region with validated bounds
          const newLatDelta = Math.max(region.latitudeDelta / 2, 0.001); // Minimum delta to prevent crash
          const newLngDelta = Math.max(region.longitudeDelta / 2, 0.001);
          
          const newRegion = {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: newLatDelta,
            longitudeDelta: newLngDelta,
          };
          
          console.log('Zooming to cluster center:', newRegion);
          setRegion(newRegion);
        }
      }
    } catch (error) {
      console.error('Error handling cluster press:', error);
    }
  }, [cluster, region]);

  // Render cluster or individual marker
  const renderMarker = (marker) => {
    const { id, latitude, longitude, point_count, properties } = marker;

    if (point_count && point_count > 1) {
      // Render cluster marker
      return (
        <Marker
          key={id}
          coordinate={{ latitude, longitude }}
          onPress={() => onClusterPress(properties.cluster_id)}
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
    const cafe = properties;
    
    return (
      <Marker
        key={cafe.place_id || id}
        coordinate={{ latitude, longitude }}
        title={cafe.name}
        description={cafe.vicinity || 'Unknown location'}
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
                    maxZoomLevel={20}
                    minZoomLevel={3}
                    onMapReady={() => console.log('Map ready')}
                    onError={(error) => {
                      console.error('MapView error:', error);
                      setErrorMsg('Map error occurred. Please try refreshing.');
                    }}
                  >
                    {location && 
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
                      />
                    )}

                    {/* Render clustered markers with error handling */}
                    {clusteredMarkers.length > 0 && clusteredMarkers.map((marker) => {
                      try {
                        return renderMarker(marker);
                      } catch (error) {
                        console.error('Error rendering marker:', error, marker);
                        return null;
                      }
                    })}
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
  tagIcon: {
    marginRight: 8,
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
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: "K2D-Bold",
  },
});
