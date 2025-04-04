import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";
import ProfileCard from "@/components/ProfileCard";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";

// Define the profile type for better type checking
interface Profile {
  id: string;
  name: string;
  photo_url?: string;
  photo?: string;
  birthday?: string;
  age?: number;
  occupation: string;
  experience_level?: string;
  industry_categories?: string[];
  skills?: string[];
  experience?: string;
  education?: string;
  bio: string;
  city?: string;
  location?: string;
  neighborhoods?: string[];
  favorite_cafes?: string[];
  interests: string[];
  matchedCafe?: boolean;
  employment?: string[];
}

interface TimeSlot {
  avail_id: number;
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function MatchingScreen() {
  // Expose the openFilterModal function to the header
  global.matchingScreen = { openFilterModal: null };
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);

  // Animation values
  const cardOffset = useSharedValue(0);
  const cardRotate = useSharedValue(0);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: cardOffset.value },
        { rotate: `${cardRotate.value}deg` },
      ],
    };
  });

  useEffect(() => {
    // Check if current user has any availability slots
    const checkUserAvailability = async () => {
      if (!user) return;

      try {
        console.log("Checking availability for user:", user.id);
        const { data, error } = await supabase
          .from("availability")
          .select("*")
          .eq("id", user.id);

        if (error) {
          console.error("Error fetching user availability:", error);
          throw error;
        }

        console.log("User availability data:", data);

        // Filter out past availability
        const now = new Date();
        const futureAvailability = data?.filter((slot) => {
          if (!slot.start_time) return false;

          const slotDate = new Date(slot.date);
          const [time, period] = slot.start_time.split(" ");
          const [hours, minutes] = time.split(":");
          let hour = parseInt(hours);

          // Convert to 24-hour format
          if (period === "PM" && hour !== 12) hour += 12;
          if (period === "AM" && hour === 12) hour = 0;

          slotDate.setHours(hour, parseInt(minutes), 0, 0);
          return slotDate > now;
        });

        const hasValidAvailability =
          futureAvailability && futureAvailability.length > 0;
        console.log("User has valid availability:", hasValidAvailability);
        setHasAvailability(hasValidAvailability);

        // Always fetch profiles - we'll show appropriate UI based on hasAvailability state
        fetchProfiles();
      } catch (error) {
        console.error("Error checking availability:", error);
        setIsLoading(false);
      }
    };

    checkUserAvailability();
  }, [user]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching profiles for users with availability");

      // Get users with availability
      console.log("Current user ID:", user?.id);
      const today = new Date().toISOString().split("T")[0];
      console.log("Fetching availability from date:", today);
      

      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from("availability")
          .select("*")
          .neq("id", user?.id)
          .order("date", { ascending: true });
      
      if (availabilityError) {
        console.error("Error fetching availability data:", availabilityError);
        
        throw availabilityError;
      }
    
      console.log("Retrieved availability data:", availabilityData);

      // Filter out expired time slots for today
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-US", { hour12: true });

      const validAvailability = availabilityData?.filter((slot) => {
        if (!slot) return false;

        // For future dates, keep all slots
        if (slot.date > today) return true;

        // For today, only keep future time slots
        if (slot.date === today) {
          return slot.start_time > currentTime;
        }

        return false;
      });

      console.log("Filtered availability data:", validAvailability);

      if (!availabilityData || availabilityData.length === 0) {
        console.log("No users with availability found");
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(availabilityData.map((item) => item.id))];
      console.log("Unique user IDs with availability:", userIds);

      if (userIds.length === 0) {
        console.log("No users with availability found after filtering");
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profile data:", profilesError);
        throw profilesError;
      }

      console.log("Retrieved profiles data:", profilesData);

      if (!profilesData || profilesData.length === 0) {
        console.log("No profile data found for available users");
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Map profiles to the format expected by ProfileCard
      const formattedProfiles =
        profilesData.map((profile) => {
          let interests = [];
          try {
            interests = profile.interests || [];
          } catch (e) {
            console.error("Error parsing interests:", e);
          }

          console.log("Processing profile:", profile.id, profile.name);
          const formattedProfile = {
            id: profile.id,
            name: profile.name || "Anonymous User",
            photo: profile.photo_url || "https://via.placeholder.com/150",
            occupation: profile.occupation || "Professional",
            bio: profile.bio || "No bio available",
            experience_level: profile.experience_level,
            city: profile.city,
            industry_categories: profile.industry_categories,
            interests: interests,
            favorite_cafes: profile.favorite_cafes,
            neighborhoods: profile.neighborhoods,
            // Check if there's a cafe match (simplified version)
            matchedCafe: checkCafeMatch(profile.favorite_cafes),
            employment: profile.employment,
          };

          return formattedProfile;
        }) || [];

      console.log("Formatted profiles:", formattedProfiles.length);
      setProfiles(formattedProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified function to check if there's a cafe match
  // In a real implementation, you would compare with the current user's favorite cafes
  const checkCafeMatch = (cafes: string[] = []) => {
    // Placeholder logic - in real app, compare with current user's cafes
    return cafes && cafes.length > 0;
  };

  const handleLike = () => {
    // Animate card off-screen to the right
    cardOffset.value = withSpring(500);
    cardRotate.value = withSpring(20);

    if (profiles.length > 0 && currentIndex < profiles.length) {
      console.log(`Liked ${profiles[currentIndex].name}`);

      // Here you would typically send a like request to your backend
      // For example: createMatch(profiles[currentIndex].id)

      // Show match animation randomly (simulate mutual match)
      if (Math.random() > 0.7) {
        setTimeout(() => {
          setMatchAnimation(true);
          setTimeout(() => setMatchAnimation(false), 3000);
        }, 500);
      }
    }

    // Small delay before moving to next profile
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Reset animation values
        cardOffset.value = 0;
        cardRotate.value = 0;
      }
    }, 300);
  };

  const handleSkip = () => {
    // Animate card off-screen to the left
    cardOffset.value = withSpring(-500);
    cardRotate.value = withSpring(-20);

    if (profiles.length > 0 && currentIndex < profiles.length) {
      console.log(`Skipped ${profiles[currentIndex].name}`);
    }

    // Small delay before moving to next profile
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Reset animation values
        cardOffset.value = 0;
        cardRotate.value = 0;
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const openFilterModal = () => {
    setFilterModalVisible(true);
  };
  // Make the function available to the header
  global.matchingScreen.openFilterModal = openFilterModal;

  const applyFilters = () => {
    setIsLoading(true);
    setFilterModalVisible(false);

    // Re-fetch profiles with filters
    fetchProfiles();
  };

  const renderNoAvailabilityMessage = () => (
    <View
      style={[
        styles.emptyCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Ionicons name="calendar-outline" size={48} color={colors.primary} />
      <Text style={[styles.emptyCardTitle, { color: colors.text }]}>
        Set Your Availability
      </Text>
      <Text style={[styles.emptyCardText, { color: colors.secondaryText }]}>
        You need to add some available time slots before you can match with
        others.
      </Text>
      <TouchableOpacity
        style={[styles.emptyCardButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          /* Navigate to availability tab */
        }}
      >
        <Text style={styles.emptyCardButtonText}>Go to Availability</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.cardsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Finding perfect matches...
              </Text>
            </View>
          ) : !hasAvailability ? (
            renderNoAvailabilityMessage()
          ) : profiles.length === 0 ? (
            <View
              style={[
                styles.noMoreCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="people" size={48} color={colors.primary} />
              <Text style={[styles.noMoreText, { color: colors.text }]}>
                No matches available
              </Text>
              <Text
                style={[styles.checkBackText, { color: colors.secondaryText }]}
              >
                We couldn't find any profiles matching your criteria. Try
                adjusting your filters or check back later!
              </Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={openFilterModal}
              >
                <Text style={styles.refreshButtonText}>Adjust Filters</Text>
              </TouchableOpacity>
            </View>
          ) : currentIndex < profiles.length ? (
            <>
              <Animated.View
                style={[styles.animatedCardContainer, cardAnimatedStyle]}
              >
                <ProfileCard
                  userId={profiles[currentIndex].id}
                  profile={profiles[currentIndex]}
                  isNewUser={false}
                  onLike={handleLike}
                  onSkip={handleSkip}
                />
              </Animated.View>

              <View style={styles.navigationControls}>
                <TouchableOpacity
                  onPress={handlePrevious}
                  style={[
                    styles.navButton,
                    {
                      backgroundColor: colors.card,
                      opacity: currentIndex > 0 ? 1 : 0.5,
                    },
                  ]}
                  disabled={currentIndex === 0}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.navButtonText, { color: colors.primary }]}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {}}
                  style={[styles.navButton, { backgroundColor: colors.card }]}
                >
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <Text
                    style={[styles.navButtonText, { color: colors.primary }]}
                  >
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View
              style={[
                styles.noMoreCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="cafe" size={48} color={colors.primary} />
              <Text style={[styles.noMoreText, { color: colors.text }]}>
                No more profiles to show
              </Text>
              <Text
                style={[styles.checkBackText, { color: colors.secondaryText }]}
              >
                You've seen all available profiles! Check back later for more
                connections.
              </Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setCurrentIndex(0);
                  fetchProfiles();
                }}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
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
                Filter Matches
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Industry
              </Text>
              <View style={styles.filterOptions}>
                {[
                  "Technology",
                  "Design",
                  "Finance",
                  "Marketing",
                  "Education",
                ].map((industry) => (
                  <TouchableOpacity
                    key={industry}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.filterChipText, { color: colors.text }]}
                    >
                      {industry}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Experience Level
              </Text>
              <View style={styles.filterOptions}>
                {["Entry", "Mid-Level", "Senior", "Executive"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.filterChipText, { color: colors.text }]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Neighborhoods
              </Text>
              <View style={styles.filterOptions}>
                {[
                  "Downtown",
                  "Midtown",
                  "Financial District",
                  "Tech District",
                  "Arts District",
                ].map((neighborhood) => (
                  <TouchableOpacity
                    key={neighborhood}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.filterChipText, { color: colors.text }]}
                    >
                      {neighborhood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Favorite Cafés
              </Text>
              <View style={styles.filterOptions}>
                {[
                  "Coffee House",
                  "The Roastery",
                  "Bean There",
                  "Morning Brew",
                  "Finance Cafe",
                ].map((cafe) => (
                  <TouchableOpacity
                    key={cafe}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.filterChipText, { color: colors.text }]}
                    >
                      {cafe}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.clearButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={{ color: colors.text }}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.applyButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Match Animation Modal */}
      <Modal visible={matchAnimation} transparent={true} animationType="fade">
        <View style={styles.matchModalOverlay}>
          <View style={styles.matchModalContent}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and{" "}
              {currentIndex < profiles.length
                ? profiles[currentIndex].name
                : ""}{" "}
              have agreed to connect
            </Text>
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={() => setMatchAnimation(false)}
            >
              <Text style={styles.sendMessageText}>Send a Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setMatchAnimation(false)}
            >
              <Text style={styles.continueText}>Continue Exploring</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: "K2D-Bold",
    fontSize: 24,
  },
  filterButton: {
    padding: 8,
  },
  subtitle: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
  },
  cardsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  animatedCardContainer: {
    width: "100%",
    alignItems: "center",
  },
  navigationControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: "center",
  },
  navButtonText: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginLeft: 8,
  },
  emptyCard: {
    width: "90%",
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyCardTitle: {
    fontFamily: "K2D-SemiBold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCardText: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyCardButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyCardButtonText: {
    color: "white",
    fontFamily: "K2D-Medium",
    fontSize: 16,
  },
  noMoreCard: {
    width: "90%",
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noMoreText: {
    fontFamily: "K2D-SemiBold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  checkBackText: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: "white",
    fontFamily: "K2D-Medium",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
    marginTop: 16,
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
    fontFamily: "K2D-Bold",
    fontSize: 20,
  },
  modalBody: {
    flex: 1,
  },
  filterLabel: {
    fontFamily: "K2D-SemiBold",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  clearButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  applyButton: {
    marginLeft: 8,
  },
  applyButtonText: {
    color: "white",
    fontFamily: "K2D-Medium",
    fontSize: 16,
  },
  matchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  matchModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "85%",
  },
  matchTitle: {
    fontFamily: "K2D-Bold",
    fontSize: 28,
    color: "#1E1916",
    marginTop: 20,
    marginBottom: 10,
  },
  matchSubtitle: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  sendMessageButton: {
    backgroundColor: "#F97415",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  sendMessageText: {
    color: "white",
    fontFamily: "K2D-Medium",
    fontSize: 16,
  },
  continueButton: {
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  continueText: {
    color: "#666",
    fontFamily: "K2D-Medium",
    fontSize: 16,
  },
});
