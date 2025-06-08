import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import ProfileCard from "@/components/ProfileCard";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router"; // Import useRouter
import IndustrySelector from "@/components/IndustrySelector";
import ExperienceLevelSelector from "@/components/ExperienceLevelSelector";
import InterestSelector from "@/components/InterestSelector";
import LogoAnimation from "@/components/LogoAnimation";

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
  career_transitions?: string[];
  availabilitySlots: TimeSlot[];
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
  const router = useRouter(); // Initialize router
  // Expose the openFilterModal function to the header
  global.matchingScreen = { openFilterModal: null };
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterIndustries, setFilterIndustries] = useState<string[]>([]);
  const [filterExperienceLevels, setFilterExperienceLevels] = useState<
    string[]
  >([]);
  const [filterInterests, setFilterInterests] = useState<string[]>([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedCafe, setSelectedCafe] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [hasMoreProfiles, setHasMoreProfiles] = useState(false);
  const PROFILES_PER_PAGE = 10;

  // Refs for auto-scroll functionality
  const scrollViewRef = useRef<ScrollView>(null);
  const messageInputRef = useRef<TextInput>(null);

  // Animation values
  const cardOffset = useSharedValue(0);
  const cardRotate = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: cardOffset.value },
        { rotate: `${cardRotate.value}deg` },
        { translateY: cardTranslateY.value },
      ],
      opacity: cardOpacity.value,
    };
  });

  // Reset animation values when currentIndex changes
  useEffect(() => {
    cardOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    cardTranslateY.value = 0;
    cardOffset.value = 0;
    cardRotate.value = 0;
  }, [currentIndex]);

  // Define checkUserAvailability outside of useFocusEffect
  const checkUserAvailability = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      const now = new Date();

      const futureAvailability = data?.filter((slot) => {
        if (!slot.start_time) return false;

        const slotDate = new Date(slot.date);
        const [time, period] = slot.start_time.split(" ");
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        slotDate.setHours(hour, parseInt(minutes), 0, 0);
        return slotDate > now;
      });

      const hasValidAvailability =
        futureAvailability && futureAvailability.length > 0;
      setHasAvailability(hasValidAvailability);

      if (hasValidAvailability) {
        await fetchProfiles();
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchProfiles]);

  // Use useFocusEffect to run check when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkUserAvailability();
    }, [checkUserAvailability]),
  );

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      //console.log("Fetching profiles for users with availability");

      // Fetch all active and past meetings with the current user
      // This includes pending, pending_acceptance, and confirmed status
      const { data: allMeetings, error: meetingsError } = await supabase
        .from("matching")
        .select("*")
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .in("status", ["pending", "pending_acceptance", "confirmed"]);

      if (meetingsError) {
        // console.error("Error fetching meetings:", meetingsError);
        throw meetingsError;
      }

      // Extract user IDs that the current user has active chats with or has already met
      const excludedUserIds = new Set();
      allMeetings?.forEach((meeting) => {
        if (meeting.user1_id === user?.id) {
          excludedUserIds.add(meeting.user2_id);
        } else {
          excludedUserIds.add(meeting.user1_id);
        }
      });

      //console.log("Users with active or past meetings:", Array.from(excludedUserIds));

      // Get users with availability
      //console.log("Current user ID:", user?.id);
      const today = new Date().toISOString().split("T")[0];
      //console.log("Fetching availability from date:", today);

      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from("availability")
          .select("*")
          .neq("id", user?.id)
          .order("date", { ascending: true });

      if (availabilityError) {
        // console.error("Error fetching availability data:", availabilityError);
        throw availabilityError;
      }

      // console.log("Retrieved availability data:", availabilityData);

      // Filter out expired time slots for today
      function formatLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      const now = new Date();
      const todayLocal = formatLocalDate(now);
      console.log("Local date:", todayLocal);

      const validAvailability = availabilityData?.filter((slot) => {
        if (!slot) return false;

        // For future dates, keep all slots
        if (slot.date >= today) return true;

        // For today, only keep future time slots
        if (slot.date === today) {
          selectedTimeSlot && { backgroundColor: colors.primary };
          return slot.start_time > currentTime;
        }

        return false;
      });

      // console.log("Filtered availability data:", validAvailability);

      if (!availabilityData || availabilityData.length === 0) {
        //console.log("No users with availability found");
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Get unique user IDs and filter out users that have active or past chats
      let userIds = [
        ...new Set(availabilityData.map((item) => item.id)),
      ].filter((id) => !excludedUserIds.has(id));
      // console.log("Unique user IDs with availability (excluding active and past meetings):", userIds);

      if (userIds.length === 0) {
        // console.log("No users with availability found after filtering");
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Fetch profiles for users with availability in next 7 days
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        // console.error("Error fetching profile data:", profilesError);
        throw profilesError;
      }

      //console.log("Retrieved profiles data:", profilesData);

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Get availability data for each user
      const userAvailabilityMap = {};
      const usersWithUpcomingAvailability = [];

      // Calculate date for 7 days from now
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(now.getDate() + 7);
      const sevenDaysLaterStr = sevenDaysLater.toISOString().split("T")[0];
      const todayStr = now.toISOString().split("T")[0];

      // console.log(
      //   `Filtering availability between ${todayStr} and ${sevenDaysLaterStr}`,
      // );

      for (const userId of userIds) {
        const { data: userAvail, error: availError } = await supabase
          .from("availability")
          .select("*")
          .eq("id", userId)
          .gte("date", todayStr)
          .lte("date", sevenDaysLaterStr)
          .order("date", { ascending: true });

        if (!availError && userAvail && userAvail.length > 0) {
          // Filter for valid time slots (future times)
          const validAvailability = userAvail.filter((slot) => {
            if (!slot.date) return false;

            // For slots today, check if time is in the future
            if (slot.date === todayStr) {
              const currentTime = now.toLocaleTimeString("en-US", {
                hour12: false,
              });
              return slot.start_time > currentTime;
            }

            // All other days in the next 7 days are valid
            return true;
          });

          if (validAvailability.length > 0) {
            userAvailabilityMap[userId] = validAvailability;
            usersWithUpcomingAvailability.push(userId);
          }
        }
      }

      // Filter user IDs to only those with upcoming availability
      userIds = usersWithUpcomingAvailability;
      // console.log(
      //   `Found ${userIds.length} users with availability in the next 7 days`,
      // );

      if (userIds.length === 0) {
        // console.log("No users with upcoming availability found");
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Map profiles to the format expected by ProfileCard
      const formattedProfiles = profilesData
        .filter((profile) => {
          // First check if profile has availability
          const hasAvailability = userAvailabilityMap[profile.id]?.length > 0;

          // Then check industry filter if any are selected
          const matchesIndustry =
            filterIndustries.length === 0 ||
            (profile.industry_categories &&
              profile.industry_categories.some((industry) =>
                filterIndustries.includes(industry),
              ));

          // Check experience level filter if any are selected
          const matchesExperience =
            filterExperienceLevels.length === 0 ||
            (profile.experience_level &&
              filterExperienceLevels.includes(profile.experience_level));

          // Check interests filter if any are selected
          const matchesInterests =
            filterInterests.length === 0 ||
            (profile.interests &&
              profile.interests.some((interest) =>
                filterInterests.includes(interest),
              ));

          // Check keyword filter if any
          const matchesKeyword =
            !filterKeyword ||
            filterKeyword.trim() === "" ||
            (() => {
              const keyword = filterKeyword.toLowerCase().trim();

              if (profile.bio?.toLowerCase().includes(keyword.toLowerCase()))
                return true;

              // Check occupation
              if (
                profile.occupation
                  ?.toLowerCase()
                  .includes(keyword.toLowerCase())
              )
                return true;

              // Check education
              if (
                profile.education?.toLowerCase().includes(keyword.toLowerCase())
              )
                return true;

              // Check employment history
              if (
                profile.employment?.some((job) => {
                  const jobData =
                    typeof job === "string" ? JSON.parse(job) : job;
                  return (
                    jobData.company
                      .toLowerCase()
                      .includes(keyword.toLowerCase()) ||
                    jobData.position
                      .toLowerCase()
                      .includes(keyword.toLowerCase())
                  );
                })
              )
                return true;

              // Check career transitions
              if (
                profile.career_transitions?.some((transition) => {
                  const careerTransition =
                    typeof transition === "string"
                      ? JSON.parse(transition)
                      : transition;
                  return (
                    careerTransition.position1
                      ?.toLowerCase()
                      .includes(keyword.toLowerCase()) ||
                    careerTransition.position2
                      ?.toLowerCase()
                      .includes(keyword.toLowerCase())
                  );
                })
              )
                return true;

              return false;
            })();

          return (
            hasAvailability &&
            matchesIndustry &&
            matchesExperience &&
            matchesInterests &&
            matchesKeyword
          );
        })
        .map((profile) => {
          let interests = [];
          try {
            interests = profile.interests || [];
          } catch (e) {
            console.error("Error parsing interests:", e);
          }

          // console.log("Processing profile:", profile.id, profile.name);
          const formattedProfile = {
            id: profile.id,
            name: profile.name,
            photo:
              profile.photo_url ||
              "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
            occupation: profile.occupation,
            bio: profile.bio,
            experience_level: profile.experience_level,
            city: profile.city,
            education: profile.education,
            industry_categories: profile.industry_categories,
            interests: interests,
            favorite_cafes: profile.favorite_cafes,
            neighborhoods: profile.neighborhoods,
            // Check if there's a cafe match (simplified version)
            matchedCafe: checkCafeMatch(profile.favorite_cafes),
            employment: profile.employment,
            career_transitions: profile.career_transitions || [],
            // Add the user's availability slots
            availabilitySlots: userAvailabilityMap[profile.id] || [],
          };

          return formattedProfile;
        });

      // console.log("Formatted profiles:", formattedProfiles.length);

      // Store all profiles and set pagination
      setAllProfiles(formattedProfiles);

      // Check if there are more than PROFILES_PER_PAGE profiles
      if (formattedProfiles.length > PROFILES_PER_PAGE) {
        // Only show first page of profiles
        setProfiles(formattedProfiles.slice(0, PROFILES_PER_PAGE));
        setHasMoreProfiles(true);
      } else {
        setProfiles(formattedProfiles);
        setHasMoreProfiles(false);
      }

      // Reset pagination state
      setCurrentPage(0);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleArray = (array) => {
    const result = [...array]; //shallow copy
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  };

  const loadNextProfilesPage = async () => {
    // Prevent loading if already loading or no more profiles
    if (isLoading || !hasMoreProfiles) return;

    setIsLoading(true);

    const nextPage = currentPage + 1;
    const startIdx = nextPage * PROFILES_PER_PAGE;
    const endIdx = startIdx + PROFILES_PER_PAGE;

    // Add artificial delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Slice next page profiles
    const nextPageProfiles = allProfiles.slice(startIdx, endIdx);

    // Update state with new profiles
    setProfiles([...profiles, ...nextPageProfiles]);
    setCurrentPage(nextPage);
    setHasMoreProfiles(endIdx < allProfiles.length);
    setIsLoading(false);
  };

  // Watch for currentIndex to auto-load more profiles
  useEffect(() => {
    if (
      currentIndex > 0 &&
      currentIndex % PROFILES_PER_PAGE === PROFILES_PER_PAGE - 1
    ) {
      loadNextProfilesPage();
    }
  }, [currentIndex]);

  // Simplified function to check if there's a cafe match
  // In a real implementation, you would compare with the current user's favorite cafes
  const checkCafeMatch = (cafes: string[] = []) => {
    // Placeholder logic - in real app, compare with current user's cafes
    return cafes && cafes.length > 0;
  };

  const clearSelections = () => {
    // Clear all user selections
    setSelectedCafe("");
    setSelectedTimeSlot(null);
    setMessageText("");
  };

  const handleNext = () => {
    if (profiles.length > 0 && currentIndex < profiles.length - 1) {
      //console.log(`Liked ${profiles[currentIndex].name}`);
      cardOpacity.value = 0; // prepare next card to start invisible
      clearSelections(); // Clear all selections
      setCurrentIndex(currentIndex + 1); // trigger re-render
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      cardOpacity.value = 0; // prepare card to start invisible
      clearSelections(); // Clear all selections
      setCurrentIndex(currentIndex - 1); // trigger re-render, fade handled in useEffect
    }
  };

  const openFilterModal = () => {
    setFilterModalVisible(true);
  };
  // Make the function available to the header
  global.matchingScreen.openFilterModal = openFilterModal;

  const applyFilters = async () => {
    setIsLoading(true);
    setFilterModalVisible(false);
    setCurrentIndex(0); // Reset to first profile

    // Re-fetch profiles with filters
    await fetchProfiles();
    setIsLoading(false);
  };

  const renderNoAvailabilityMessage = () => (
    <View style={[styles.cardsContainer, { justifyContent: "center" }]}>
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
          Add availability at least 24 hours in advance to connect with others.
        </Text>
        <TouchableOpacity
          style={[styles.emptyCardButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            router.push("/(tabs)/availability"); // Navigate to availability tab
          }}
        >
          <Text style={styles.emptyCardButtonText}>Add availability</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {!isLoading &&
        profiles.length > 0 &&
        hasAvailability &&
        currentIndex < profiles.length && (
          <View style={styles.navigationFloating}>
            {currentIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevious}
                style={[styles.floatingButton, styles.leftButton]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                if (currentIndex === profiles.length - 1) {
                  Alert.alert(
                    "End of the list",
                    "You've reached the end of the list. Check back later for more connections.",
                  );
                } else {
                  handleNext(); // move to next profile
                }
              }}
              style={[
                styles.floatingButton,
                styles.rightButton,
                {
                  opacity: currentIndex === profiles.length - 1 ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons name="arrow-forward" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      {!isLoading && !hasAvailability ? (
        renderNoAvailabilityMessage()
      ) : !isLoading && profiles.length === 0 ? (
        <View style={[styles.cardsContainer, { justifyContent: "center" }]}>
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
              A quiet week on the circle. Check back as new coffee times fill
              in!
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
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1, width: "100%", padding: 16 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 120, // Extra padding for keyboard space
              justifyContent: "center",
              alignItems: "center",
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.cardsContainer, { width: "100%" }]}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <LogoAnimation size={120} />
                  {/* <Text style={[styles.loadingText, { color: colors.text }]}>
                    Brewing your circle......
                  </Text> */}
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
                    style={[
                      styles.checkBackText,
                      { color: colors.secondaryText },
                    ]}
                  >
                    A quiet week on the circle. Check back as new coffee times
                    fill in!
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
                    />
                    {profiles[currentIndex] &&
                      profiles[currentIndex].favorite_cafes &&
                      profiles[currentIndex].favorite_cafes.length > 0 &&
                      profiles[currentIndex].availabilitySlots &&
                      profiles[currentIndex].availabilitySlots.length > 0 && (
                        <View
                          style={[
                            styles.instructionContainer,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name="information-circle-outline"
                            size={20}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.instructionText,
                              { color: colors.text },
                            ]}
                          >
                            Pick a café and time below to send your coffee chat
                            invite.
                          </Text>
                        </View>
                      )}
                    {/* Cafe details and availability */}
                    {profiles[currentIndex].favorite_cafes &&
                      profiles[currentIndex].favorite_cafes.length > 0 && (
                        <View
                          style={[
                            selectedCafe && { backgroundColor: colors.primary },
                            styles.detailsCard,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.detailsTitle, { color: colors.text }]}
                          >
                            Cafe preferences
                          </Text>
                          <View style={styles.cafeList}>
                            {profiles[currentIndex].favorite_cafes.map(
                              (cafe, index) => {
                                const [cafeName, cafeAddress] = cafe
                                  ? cafe.split("|||")
                                  : ["", ""];
                                return (
                                  <TouchableOpacity
                                    key={index}
                                    style={[
                                      styles.cafeItem,
                                      {
                                        backgroundColor:
                                          selectedCafe === cafe
                                            ? colors.primary
                                            : colors.card,
                                      },
                                    ]}
                                    onPress={() =>
                                      setSelectedCafe(
                                        selectedCafe === cafe ? null : cafe,
                                      )
                                    }
                                  >
                                    <View style={styles.cafeDetails}>
                                      <Text
                                        style={[
                                          styles.cafeName,
                                          {
                                            color:
                                              selectedCafe === cafe
                                                ? "white"
                                                : colors.text,
                                          },
                                        ]}
                                      >
                                        {/* <Ionicons
                                          name="cafe"
                                          size={16}
                                          color={
                                            selectedCafe === cafe
                                              ? "white"
                                              : colors.primary
                                          }
                                          style={{ marginRight: 5 }}
                                        /> */}
                                        {cafeName}
                                      </Text>
                                      <Text
                                        style={[
                                          styles.cafeAddress,
                                          {
                                            color:
                                              selectedCafe === cafe
                                                ? "rgba(255,255,255,0.8)"
                                                : colors.secondaryText,
                                          },
                                        ]}
                                      >
                                        {cafeAddress}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              },
                            )}
                          </View>
                        </View>
                      )}

                    {profiles[currentIndex].availabilitySlots &&
                      profiles[currentIndex].availabilitySlots.length > 0 && (
                        <View
                          style={[
                            styles.detailsCard,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.detailsTitle, { color: colors.text }]}
                          >
                            Available times
                          </Text>
                          <View style={styles.availabilityList}>
                            {profiles[currentIndex].availabilitySlots.map(
                              (slot, index) => {
                                // Split and use the year, month, and day directly in the local time zone
                                const [year, month, day] = slot.date
                                  .split("-")
                                  .map(Number);

                                // Format the date
                                const date = new Date(year, month - 1, day); // Note: month is 0-indexed
                                const formattedDate = format(
                                  date,
                                  "EEEE, MMMM d",
                                );

                                return (
                                  <TouchableOpacity
                                    key={index}
                                    style={[
                                      styles.timeSlotItem,
                                      {
                                        backgroundColor:
                                          selectedTimeSlot === slot
                                            ? colors.primary
                                            : colors.card,
                                      },
                                    ]}
                                    onPress={() =>
                                      setSelectedTimeSlot(
                                        selectedTimeSlot === slot ? null : slot,
                                      )
                                    }
                                  >
                                    <View style={styles.timeSlotDetails}>
                                      <Text
                                        style={[
                                          styles.timeSlotDate,
                                          {
                                            color:
                                              selectedTimeSlot === slot
                                                ? "white"
                                                : colors.text,
                                          },
                                        ]}
                                      >
                                        {/* <Ionicons
                                          name="calendar"
                                          size={16}
                                          color={
                                            selectedTimeSlot === slot
                                              ? "white"
                                              : colors.primary
                                          }
                                          style={{ marginRight: 5 }}
                                        /> */}
                                        {formattedDate}
                                      </Text>
                                      <Text
                                        style={[
                                          styles.timeSlotTime,
                                          {
                                            color:
                                              selectedTimeSlot === slot
                                                ? "rgba(255,255,255,0.8)"
                                                : colors.secondaryText,
                                          },
                                        ]}
                                      >
                                        {/* <Ionicons
                                          name="time"
                                          size={16}
                                          color={
                                            selectedTimeSlot === slot
                                              ? "rgba(255,255,255,0.8)"
                                              : colors.secondaryText
                                          }
                                          style={{ marginRight: 5 }}
                                        /> */}
                                        {`${slot.start_time.split(":")[0]}:${slot.start_time.split(":")[1]} - ${slot.end_time.split(":")[0]}:${slot.end_time.split(":")[1]}`}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              },
                            )}
                          </View>
                        </View>
                      )}
                    {profiles[currentIndex].availabilitySlots &&
                      profiles[currentIndex].availabilitySlots.length > 0 && (
                        <View
                          style={[
                            styles.detailsCard,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.detailsTitle,
                              { color: colors.text },
                            ]}
                          >
                            Send a message
                          </Text>

                          <TextInput
                            ref={messageInputRef}
                            style={[
                              styles.textArea,
                              isDark
                                ? styles.inputDark
                                : { backgroundColor: "#f8f8f8" },
                            ]}
                            placeholder="..."
                            placeholderTextColor={colors.secondaryText}
                            multiline
                            numberOfLines={2}
                            value={messageText}
                            onChangeText={setMessageText}
                            textAlignVertical="top"
                            onFocus={() => {
                              // Delay to ensure the keyboard animation starts, then scroll to bottom
                              setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                              }, 300); // Wait for keyboard animation
                            }}
                          />
                        </View>
                      )}
                  </Animated.View>

                  <View style={styles.navigationControls}>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          if (!user?.id) {
                            //console.error("No user ID found");
                            return;
                          }

                          const currentProfile = profiles[currentIndex];
                          if (!selectedCafe && !selectedTimeSlot) {
                            alert("Please select both a cafe and a time slot");
                            return;
                          } else if (!selectedCafe) {
                            alert("Please select a cafe");
                            return;
                          } else if (!selectedTimeSlot) {
                            alert("Please select a time slot");
                            return;
                          }

                          const [cafeName, cafeAddress] =
                            selectedCafe.split("|||");

                          const { data, error } = await supabase
                            .from("matching")
                            .insert([
                              {
                                user1_id: user.id,
                                user2_id: currentProfile.id,
                                status: "pending",
                                meeting_date: selectedTimeSlot.date,
                                meeting_location: `${cafeName}|||${cafeAddress}`,
                                start_time: selectedTimeSlot.start_time,
                                end_time: selectedTimeSlot.end_time,
                                initial_message: messageText,
                                created_at: new Date().toISOString(),
                              },
                            ])
                            .select();

                          if (error) throw error;

                          alert("Match request sent successfully!");
                          // Clear selections after successful request
                          setSelectedCafe("");
                          setSelectedTimeSlot(null);
                          setMessageText("");

                          // Refresh index.tsx chats data if function is available
                          if (
                            global.circleChatsScreen &&
                            global.circleChatsScreen.refreshData
                          ) {
                            global.circleChatsScreen.refreshData();
                          }

                          // Move to next profile
                          if (currentIndex < profiles.length - 1) {
                            setCurrentIndex(currentIndex + 1);
                          }
                        } catch (error) {
                          //console.error("Error sending match request:", error);
                          alert(
                            "Failed to send match request. Please try again.",
                          );
                        }
                      }}
                      style={[
                        styles.navButton,
                        {
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons name="cafe" size={20} color={colors.primary} />
                      <Text
                        style={[styles.navButtonText, { color: colors.primary }]}
                      >
                        Send request
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
                    {hasMoreProfiles
                      ? "Ready for more connections?"
                      : "No more profiles to show"}
                  </Text>
                  <Text
                    style={[
                      styles.checkBackText,
                      { color: colors.secondaryText },
                    ]}
                  >
                    {hasMoreProfiles
                      ? "You've seen all profiles on this page. Load more to continue exploring!"
                      : "You've seen all available profiles! Check back later for more connections."}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.refreshButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      if (hasMoreProfiles) {
                        loadNextProfilesPage();
                      } else {
                        setCurrentIndex(0);
                        fetchProfiles();
                      }
                    }}
                  >
                    <Text style={styles.refreshButtonText}>
                      {hasMoreProfiles ? "Load More" : "Refresh"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

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
                Keyword Search
              </Text>
              <View
                style={[
                  styles.searchContainer,
                  { backgroundColor: colors.input, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.secondaryText}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Enter a keyword to search profiles..."
                  placeholderTextColor={colors.secondaryText}
                  value={filterKeyword}
                  onChangeText={setFilterKeyword}
                />
                {filterKeyword.length > 0 && (
                  <TouchableOpacity onPress={() => setFilterKeyword("")}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Industry
              </Text>
              <IndustrySelector
                selected={filterIndustries || []}
                onChange={(industries) => setFilterIndustries(industries)}
                maxIndustries={999}
                isDark={false}
                viewSelectionTracker={false}
              />

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Experience Level
              </Text>
              <ExperienceLevelSelector
                selected={filterExperienceLevels}
                onChange={(level) => {
                  if (filterExperienceLevels.includes(level)) {
                    setFilterExperienceLevels(
                      filterExperienceLevels.filter((l) => l !== level),
                    );
                  } else {
                    setFilterExperienceLevels([
                      ...filterExperienceLevels,
                      level,
                    ]);
                  }
                }}
                multiSelect={true}
              />
              {filterExperienceLevels.length > 0 && (
                <View style={styles.selectedTagsContainer}>
                  {filterExperienceLevels.map((level, index) => (
                    <View
                      key={index}
                      style={[
                        styles.selectedTag,
                        {
                          backgroundColor: "transparent",
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectedTagText,
                          { color: colors.primary },
                        ]}
                      >
                        {level}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Interests
              </Text>
              <InterestSelector
                selected={filterInterests || []}
                onChange={(interests) => setFilterInterests(interests)}
                maxInterests={999}
                isDark={false}
                viewSelectionTracker={false}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.clearButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => {
                  setFilterKeyword("");
                  setFilterIndustries([]);
                  setFilterExperienceLevels([]);
                  setFilterInterests([]);
                }}
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
      {/* <Modal visible={matchAnimation} transparent={true} animationType="fade">
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
      </Modal> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navigationFloating: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    zIndex: 1000,
    top: "50%",
    transform: [{ translateY: -25 }],
    pointerEvents: "box-none",
    left: 0,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "absolute",
  },
  leftButton: {
    left: 20,
  },
  rightButton: {
    right: 20,
  },
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
    justifyContent: "center",
    width: "100%",
    margin: 16,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
  },
  navButtonText: {
    fontFamily: "K2D-Medium",
    fontSize: 16,
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
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCardText: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
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
    fontFamily: "K2D-SemiBold",
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
    flexGrow: 1,
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
    paddingBottom: 60,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 8,
    fontFamily: "K2D-Regular",
    fontSize: 16,
  },
  selectedTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  selectedTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  selectedTagText: {
    fontFamily: "K2D-Medium",
    fontSize: 12,
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
  detailsCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  detailsTitle: {
    fontFamily: "K2D-SemiBold",
    fontSize: 16,
    marginBottom: 12,
  },
  cafeList: {
    marginBottom: 8,
  },
  cafeItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cafeDetails: {
    flex: 1,
  },
  cafeName: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginBottom: 4,
  },
  cafeAddress: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
  },
  availabilityList: {
    marginBottom: 8,
  },
  timeSlotItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  timeSlotDetails: {
    flex: 1,
  },
  timeSlotDate: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginBottom: 4,
  },
  timeSlotTime: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
    fontFamily: "K2D-Regular",
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontFamily: "K2D-Regular",
  },
  inputDark: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#fff",
    marginBottom: 5,
  },
  textArea: {
    fontFamily: "K2D-Regular",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    height: 100,
    textAlignVertical: "top",
  },
  inputDark: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#fff",
  },
  textDark: {
    color: "#fff",
  },
  instructionContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  instructionText: {
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "K2D-Regular",
  },
});
