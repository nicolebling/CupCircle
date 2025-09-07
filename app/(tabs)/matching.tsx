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
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { notificationService } from "@/services/notificationService";
import { useRouter } from "expo-router"; // Import useRouter
import ProfileCard from "@/components/ProfileCard";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { format } from "date-fns";
import Superwall from "expo-superwall/compat";
import IndustrySelector from "@/components/IndustrySelector";
import ExperienceLevelSelector from "@/components/ExperienceLevelSelector";
import InterestSelector from "@/components/InterestSelector";
import LogoAnimation from "@/components/LogoAnimation";
import SubscriptionCard from "@/components/SubscriptionCard";
import { geoUtils } from "@/utils/geoUtils";

// Define the profile type for better type checking
interface Profile {
  id: string;
  name: string;
  last_name?: string;
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
  global.matchingScreen = { 
    openFilterModal: null,
    showSubscriptionCard: false 
  };
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
  const [filterMaxDistance, setFilterMaxDistance] = useState<number>(50); // Default 50 miles
  const [userCentroid, setUserCentroid] = useState<{ latitude: number; longitude: number } | null>(null);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedCafe, setSelectedCafe] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [hasMoreProfiles, setHasMoreProfiles] = useState(false);
  const [showSubscriptionCard, setShowSubscriptionCard] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [featuredCafes, setFeaturedCafes] = useState<any[]>([]);
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

  // Function to check subscription status and successful_chat count
  const checkSubscriptionAndPaywall = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get subscription status directly from Superwall
      const subscriptionStatus = await Superwall.shared.getSubscriptionStatus();
      console.log("Subscription status:", subscriptionStatus);

      let isPaidUser = false;
      // subscriptionStatus is an object with a status property
      const status = subscriptionStatus?.status?.toLowerCase();
      switch (status) {
        case 'active':
          console.log("User has active subscription");
          isPaidUser = true;
          break;
        case 'inactive':
          console.log("User is on free plan");
          isPaidUser = false;
          break;
        case 'unknown':
        default:
          console.log("User subscription status is unknown/inactive");
          isPaidUser = false;
          break;
      }

      // Get successful_chat count
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("successful_chat")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching successful_chat count:", error);
        return;
      }

      const successfulChatCount = profileData?.successful_chat || 0;
      console.log("Successful chat count:", successfulChatCount);

      // Store subscription status in state
      setIsPaidUser(isPaidUser);

      // Logic: If user has 1+ successful chats and is NOT subscribed, show subscription card
      if (successfulChatCount >= 1 && !isPaidUser) {
        console.log(`Showing subscription card for non-subscribed user with ${successfulChatCount} successful chat(s)`);
        setShowSubscriptionCard(true);
      } else {
        setShowSubscriptionCard(false);
      }

    } catch (error) {
      console.error("Error checking subscription status and successful_chat count:", error);
    }
  }, [user?.id]);

  // Function to handle subscription button press
  const handleSubscribe = () => {
    setShowSubscriptionCard(false);
    console.log("Triggering paywall from subscription card");
    Superwall.shared.register({
      placement: 'matching',
    });
    
    // Refresh subscription status after paywall interaction
    setTimeout(() => {
      checkSubscriptionAndPaywall();
    }, 2000);
  };

  // Function to close subscription card
  const handleCloseSubscriptionCard = () => {
    setShowSubscriptionCard(false);
  };

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

  // Fetch featured cafes from database
  const fetchFeaturedCafes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cafes")
        .select("*")
        .eq("is_featured", true);

      if (error) {
        console.error("Error fetching featured cafes:", error);
        return;
      }

      setFeaturedCafes(data || []);
    } catch (error) {
      console.error("Error fetching featured cafes:", error);
    }
  }, []);

  // Check if a cafe is featured in spotlight
  const isCafeFeatured = useCallback((cafeString: string) => {
    if (!cafeString || !featuredCafes.length) return false;
    
    const [cafeName, cafeAddress] = cafeString.split("|||");
    
    return featuredCafes.some(featuredCafe => {
      // Only consider cafes that are actually featured
      if (!featuredCafe.is_featured) return false;
      
      // Check if name matches (case insensitive)
      const nameMatch = featuredCafe.name?.toLowerCase().includes(cafeName?.toLowerCase()) ||
                       cafeName?.toLowerCase().includes(featuredCafe.name?.toLowerCase());
      
      // Check if address matches (case insensitive)
      const addressMatch = featuredCafe.address?.toLowerCase().includes(cafeAddress?.toLowerCase()) ||
                          cafeAddress?.toLowerCase().includes(featuredCafe.address?.toLowerCase());
      
      return nameMatch && addressMatch;
    });
  }, [featuredCafes]);

  // Fetch user's centroid for distance calculations
  const fetchUserCentroid = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("centroid_lat, centroid_long, favorite_cafes")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user centroid:", error);
        return;
      }

      if (data?.centroid_lat && data?.centroid_long) {
        console.log("Found user centroid:", data.centroid_lat, data.centroid_long);
        setUserCentroid({
          latitude: data.centroid_lat,
          longitude: data.centroid_long
        });
      } else {
        console.log("User centroid not found, trying to calculate from favorite cafes");

        // Try to calculate centroid from favorite cafes
        if (data?.favorite_cafes && data.favorite_cafes.length > 0) {
          const coordinates: Array<{ latitude: number; longitude: number }> = [];

          for (const cafe of data.favorite_cafes) {
            const parts = cafe.split("|||");
            if (parts.length >= 4) {
              const lng = parseFloat(parts[2]);
              const lat = parseFloat(parts[3]);

              if (!isNaN(lat) && !isNaN(lng)) {
                coordinates.push({ latitude: lat, longitude: lng });
              }
            }
          }

          if (coordinates.length > 0) {
            const centroid = geoUtils.calculateCentroid(coordinates);
            console.log("Calculated user centroid from cafes:", centroid);
            setUserCentroid(centroid);

            // Update the database with the calculated centroid
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ 
                centroid_lat: centroid.latitude, 
                centroid_long: centroid.longitude 
              })
              .eq("id", user.id);

            if (updateError) {
              console.error("Error updating user centroid:", updateError);
            } else {
              console.log("Updated user centroid in database");
            }
          } else {
            console.log("No valid cafe coordinates found for user");
            setUserCentroid(null);
          }
        } else {
          console.log("User has no favorite cafes, cannot calculate centroid");
          setUserCentroid(null);
        }
      }
    } catch (error) {
      console.error("Error fetching user centroid:", error);
    }
  }, [user?.id]);

  // Use useFocusEffect to run check when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only do full reload on initial load or if no profiles are loaded
      if (!hasInitiallyLoaded || profiles.length === 0) {
        checkUserAvailability();
        setHasInitiallyLoaded(true);
      }
      // Always check subscription status and user centroid (lightweight operations)
      checkSubscriptionAndPaywall();
      fetchUserCentroid();
      fetchFeaturedCafes();
    }, [checkUserAvailability, checkSubscriptionAndPaywall, fetchUserCentroid, hasInitiallyLoaded, profiles.length]),
  );

  // Periodic background refresh for new profiles (every 5 minutes)
  useEffect(() => {
    const backgroundRefresh = setInterval(() => {
      if (!isLoading && profiles.length > 0) {
        // Silently refresh available profiles in background
        fetchProfiles().catch(console.error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(backgroundRefresh);
  }, [isLoading, profiles.length]);

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

      // Fetch profiles for users with availability in next 7 days (including centroid data)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*, centroid_lat, centroid_long")
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
      let formattedProfiles = profilesData
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

        
          const formattedProfile = {
            id: profile.id,
            name: profile.name,
            last_name: profile.last_name,
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
            // Add centroid data for distance calculations
            centroid_lat: profile.centroid_lat,
            centroid_long: profile.centroid_long,
          };

          return formattedProfile;
        });

      // Apply KNN sorting by distance if user has centroid
      if (userCentroid) {
        console.log(`User centroid: ${userCentroid.latitude}, ${userCentroid.longitude}`);
        console.log(`Filter max distance: ${filterMaxDistance} miles`);
        console.log(`Profiles before distance sorting: ${formattedProfiles.length}`);

        // Log profile centroids before sorting
        formattedProfiles.forEach(profile => {
          if (profile.centroid_lat && profile.centroid_long) {
            console.log(`Profile ${profile.name}: ${profile.centroid_lat}, ${profile.centroid_long}`);
          } else {
            console.log(`Profile ${profile.name}: No centroid data`);
          }
        });

        formattedProfiles = geoUtils.sortProfilesByDistance(userCentroid, formattedProfiles);

        // Log sorted profiles with distances
        formattedProfiles.forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.name}: ${profile.distance ? profile.distance.toFixed(2) + ' miles' : 'No distance'}`);
        });

        // Apply distance filter if set
        if (filterMaxDistance !== null) {
          const beforeFilterCount = formattedProfiles.length;
          formattedProfiles = geoUtils.filterProfilesByDistance(formattedProfiles, filterMaxDistance);
          console.log(`Profiles after distance filtering (${filterMaxDistance} miles): ${formattedProfiles.length} (filtered out ${beforeFilterCount - formattedProfiles.length})`);
        }
      } else {
        console.log("No user centroid available for distance filtering");
      }

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

  // Background preloading function
  const preloadNextProfilesBatch = async () => {
    if (hasMoreProfiles && allProfiles.length > 0) {
      const nextPage = currentPage + 1;
      const startIdx = nextPage * PROFILES_PER_PAGE;
      const endIdx = startIdx + PROFILES_PER_PAGE;
      
      if (startIdx < allProfiles.length) {
        const nextPageProfiles = allProfiles.slice(startIdx, endIdx);
        // Preload these profiles silently without updating the UI
        console.log(`Preloaded ${nextPageProfiles.length} profiles for next batch`);
      }
    }
  };

  // Watch for currentIndex to auto-load more profiles and preload next batch
  useEffect(() => {
    if (
      currentIndex > 0 &&
      currentIndex % PROFILES_PER_PAGE === PROFILES_PER_PAGE - 1
    ) {
      loadNextProfilesPage();
    }
    
    // Preload next batch when user is 2 profiles away from the end of current batch
    if (
      currentIndex > 0 &&
      currentIndex % PROFILES_PER_PAGE === PROFILES_PER_PAGE - 3 &&
      hasMoreProfiles
    ) {
      preloadNextProfilesBatch();
    }
  }, [currentIndex, hasMoreProfiles]);

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
  
  // Update global subscription card state
  useEffect(() => {
    if (global.matchingScreen) {
      global.matchingScreen.showSubscriptionCard = showSubscriptionCard;
    }
  }, [showSubscriptionCard]);

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
      {/* Show subscription card if user has 1 successful chat and is not subscribed */}
      {showSubscriptionCard && (
        <SubscriptionCard
          onSubscribe={handleSubscribe}
        />
      )}

      {/* Only show matching content if user is subscribed OR has not reached the paywall trigger */}
      {!showSubscriptionCard && (
        <>
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
                                const isSpotlightCafe = isCafeFeatured(cafe);
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
                                        borderWidth: isSpotlightCafe ? 2 : 0,
                                        borderColor: isSpotlightCafe ? "#FFD700" : "transparent",
                                      },
                                    ]}
                                    onPress={() =>
                                      setSelectedCafe(
                                        selectedCafe === cafe ? null : cafe,
                                      )
                                    }
                                  >
                                    <View style={styles.cafeDetails}>
                                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                                        {isSpotlightCafe && (
                                          <View style={[styles.spotlightCircle, { marginRight: 6 }]}>
                                          </View>
                                        )}
                                        <Text
                                          style={[
                                            styles.cafeName,
                                            {
                                              color:
                                                selectedCafe === cafe
                                                  ? "white"
                                                  : colors.text,
                                              flex: 1,
                                            },
                                          ]}
                                        >
                                          {cafeName}
                                        </Text>
                                      </View>
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
                                      {isSpotlightCafe && (
                                        <Text
                                          style={[
                                            styles.spotlightLabel,
                                            {
                                              color:
                                                selectedCafe === cafe
                                                  ? "rgba(255,255,255,0.9)"
                                                  : "#FFD700",
                                            },
                                          ]}
                                        >
                                          Café Spotlight
                                        </Text>
                                      )}
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
                      )}{profiles[currentIndex].availabilitySlots &&
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
                            console.error("No user ID found");
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

                          // Trigger send request placement for all users when they try to send a request
                          try {
                            console.log('🎯 Triggering send request  Superwall placement on send request button press');
                            await Superwall.shared.register({
                              placement: 'send request_onPress',
                            });
                            console.log('✅ Successfully triggered send request placement');
                            
                            // Check if user should be blocked by paywall
                            // Get subscription status
                            const subscriptionStatus = await Superwall.shared.getSubscriptionStatus();
                            const status = subscriptionStatus?.status?.toLowerCase();
                            const isPaidUser = status === 'active';
                            
                            // Get successful_chat count
                            const { data: profileData, error: profileError } = await supabase
                              .from("profiles")
                              .select("successful_chat")
                              .eq("id", user.id)
                              .single();

                            if (profileError) {
                              console.error("Error fetching successful_chat count:", profileError);
                              // Continue with request if we can't check - don't block user
                            } else {
                              const successfulChatCount = profileData?.successful_chat || 0;
                              console.log(`User has ${successfulChatCount} successful chats, isPaidUser: ${isPaidUser}`);
                              
                              // If user has 1+ successful chats and is NOT subscribed, show paywall and block request
                              if (successfulChatCount >= 1 && !isPaidUser) {
                                console.log('Blocking request - user should upgrade subscription');
                                // The paywall was already triggered above, so just return without sending request
                                return;
                              }
                            }
                            
                          } catch (error) {
                            console.error('❌ Failed to trigger send request placement:', error);
                            // Continue with request even if Superwall fails
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
                                timezone: "America/New_York", // Default timezone, could be made dynamic
                                created_at: new Date().toISOString(),
                              },
                            ])
                            .select();

                          if (error) throw error;

                          

                          // Send coffee request notification
                          if (currentProfile.id) {
                            await notificationService.sendCoffeeRequestNotification(
                              currentProfile.id,
                              user?.id,
                              selectedCafe || "a café"
                            );
                          }

                          // Show success alert to user
                          alert("Match request sent successfully!");
                          
                          // Brief delay to allow user to see the success message
                          await new Promise(resolve => setTimeout(resolve, 100));
                          
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

                          // Optimistically remove the current user from the profiles array
                          const updatedProfiles = profiles.filter(profile => profile.id !== currentProfile.id);
                          const updatedAllProfiles = allProfiles.filter(profile => profile.id !== currentProfile.id);
                          
                          setProfiles(updatedProfiles);
                          setAllProfiles(updatedAllProfiles);
                          
                          // Adjust current index if we're at the end
                          if (currentIndex >= updatedProfiles.length && updatedProfiles.length > 0) {
                            setCurrentIndex(updatedProfiles.length - 1);
                          } else if (updatedProfiles.length === 0) {
                            setCurrentIndex(0);
                          }
                          // If currentIndex < updatedProfiles.length, keep the same index to show next profile

                        } catch (error) {
                          console.error("Error sending match request:", error);
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
                Filter
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

              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Distance Range
              </Text>
              <View style={styles.distanceContainer}>
                <Text style={[styles.distanceLabel, { color: colors.secondaryText }]}>
                  Within {Math.round(filterMaxDistance)} miles
                </Text>
                <Slider
                  style={styles.distanceSlider}
                  minimumValue={1}
                  maximumValue={50}
                  value={filterMaxDistance}
                  onValueChange={setFilterMaxDistance}
                  step={1}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={{ backgroundColor: colors.primary }}
                />
                <View style={styles.distanceLabels}>
                  <Text style={[styles.distanceEndLabel, { color: colors.secondaryText }]}>
                    1 mile
                  </Text>
                  <Text style={[styles.distanceEndLabel, { color: colors.secondaryText }]}>
                    50 miles
                  </Text>
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.clearButton,
                  { borderColor: colors.border },
                ]}
                onPress={async () => {
                  setFilterKeyword("");
                  setFilterIndustries([]);
                  setFilterExperienceLevels([]);
                  setFilterInterests([]);
                  setFilterMaxDistance(50);
                  // Also refresh profiles to reset distance ordering
                  setCurrentIndex(0);
                  await fetchProfiles();
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

      </>
      )}

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
  distanceContainer: {
    marginBottom: 16,
  },
  distanceLabel: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  distanceSlider: {
    width: "100%",
    height: 40,
  },
  distanceLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  distanceEndLabel: {
    fontFamily: "K2D-Regular",
    fontSize: 12,
  },
  spotlightCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD700",
  },
  spotlightLabel: {
    fontFamily: "K2D-Medium",
    fontSize: 10,
    marginTop: 2,
  },
});