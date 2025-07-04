import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import LoadingLogoAnimation from "@/components/LoadingLogoAnimation";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  matchId: string;
  partnerName: string;
  coffeePlace: string;
  onSubmitSuccess: () => void;
}

export default function FeedbackModal({
  visible,
  onClose,
  matchId,
  partnerName,
  coffeePlace,
  onSubmitSuccess,
}: FeedbackModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();

  const [userRating, setUserRating] = useState<number>(0);
  const [cafeRating, setCafeRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackAlreadyGiven, setFeedbackAlreadyGiven] = useState(false);
  const [checkingFeedback, setCheckingFeedback] = useState(true);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Check if feedback has already been given when modal opens
  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (!visible || !user?.id || !matchId) {
        console.log("🚫 Feedback check skipped - missing data:", {
          visible,
          userId: user?.id,
          matchId
        });
        return;
      }

      try {
        setCheckingFeedback(true);

        // Only check for existing feedback with actual ratings (not NULL placeholders)
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("match_id", matchId)
          .eq("user1_id", user.id)
          .not("user_rating", "is", null)
          .not("cafe_rating", "is", null);

        if (error) {
          console.log("❌ Supabase error occurred:", error);
          throw error;
        }

        const hasGivenFeedback = data && data.length > 0;
        console.log("✅ Feedback check result:", { hasGivenFeedback, recordCount: data?.length });

        setFeedbackAlreadyGiven(hasGivenFeedback);
      } catch (error) {
        console.error("❌ Error checking existing feedback:", error);
        // On error, allow the user to proceed (fail open)
        setFeedbackAlreadyGiven(false);
      } finally {
        setCheckingFeedback(false);
      }
    };

    checkExistingFeedback();
  }, [visible, user?.id, matchId]);

  const handleStarPress1 = (selectedRating: number) => {
    if (feedbackAlreadyGiven) return;
    setUserRating(selectedRating);
  };

  const handleStarPress2 = (selectedRating: number) => {
    if (feedbackAlreadyGiven) return;
    setCafeRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (feedbackAlreadyGiven) {
      Alert.alert(
        "Feedback Already Given",
        "You have already provided feedback for this meeting.",
      );
      return;
    }

    if (userRating === 0 || cafeRating === 0) {
      Alert.alert(
        "Rating Required",
        "Please provide a rating before submitting.",
      );
      return;
    }

    try {
      setSubmitting(true);

      // Get the match details to find the partner
      const { data: matchData, error: matchError } = await supabase
        .from("matching")
        .select("user1_id, user2_id")
        .eq("match_id", matchId)
        .single();

      if (matchError) {
        console.error("Error fetching match data:", matchError);
        throw matchError;
      }

      // Determine the partner ID
      const partnerId =
        matchData.user1_id === user.id
          ? matchData.user2_id
          : matchData.user1_id;

      console.log("Submitting feedback:", {
        match_id: matchId,
        user1_id: user.id,
        user2_id: partnerId,
        user_rating: userRating,
        cafe_rating: cafeRating,
        feedback_text: feedbackText.trim()
      });

      // Insert feedback into database with proper error handling
      const { data: insertData, error: insertError } = await supabase
        .from("feedback")
        .insert([
          {
            match_id: matchId,
            user1_id: user.id,
            user2_id: partnerId,
            user_rating: userRating,
            cafe_rating: cafeRating,
            feedback_text: feedbackText.trim() || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) {
        console.error("Database insertion error:", insertError);

        if (insertError.code === "23505") {
          // PostgreSQL unique_violation - feedback already exists
          setFeedbackAlreadyGiven(true);
          Alert.alert(
            "Feedback Already Given",
            "You have already submitted feedback for this meeting.",
            [{ text: "OK", onPress: () => onClose() }],
          );
        } else {
          Alert.alert("Error", "Failed to submit feedback. Please try again.");
        }
        return;
      }

      console.log("Feedback submitted successfully:", insertData);

      // Success - show confirmation and close modal
      Alert.alert(
        "Thank You!",
        "Your feedback has been submitted successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              onSubmitSuccess();
              onClose();
              resetForm();
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    // Reset form
    setUserRating(0);
    setCafeRating(0);
    setFeedbackText("");
    setFeedbackAlreadyGiven(false);
    setCheckingFeedback(true);
  };

  const renderStars1 = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress1(i)}
          style={[
            styles.starButton,
            feedbackAlreadyGiven && styles.disabledButton,
          ]}
          disabled={feedbackAlreadyGiven}
        >
          <Ionicons
            name={i <= userRating ? "star" : "star-outline"}
            size={32}
            color={
              feedbackAlreadyGiven
                ? colors.secondaryText + "50"
                : i <= userRating
                  ? "#FFD700"
                  : colors.secondaryText
            }
          />
        </TouchableOpacity>,
      );
    }
    return stars;
  };

  const renderStars2 = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress2(i)}
          style={[
            styles.starButton,
            feedbackAlreadyGiven && styles.disabledButton,
          ]}
          disabled={feedbackAlreadyGiven}
        >
          <Ionicons
            name={i <= cafeRating ? "star" : "star-outline"}
            size={32}
            color={
              feedbackAlreadyGiven
                ? colors.secondaryText + "50"
                : i <= cafeRating
                  ? "#FFD700"
                  : colors.secondaryText
            }
          />
        </TouchableOpacity>,
      );
    }
    return stars;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {checkingFeedback
                    ? "Loading..."
                    : feedbackAlreadyGiven
                      ? "Feedback Already Given"
                      : "How was your coffee chat?"}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {checkingFeedback && (
                <View style={styles.loadingContainer}>
                  <LoadingLogoAnimation />
                </View>
              )}
              <Text style={styles.actionButtonText}>
                {feedbackAlreadyGiven && !checkingFeedback
                  ? "Already submitted feedback for this coffee chat."
                  : "Your insights drive our improvements."}
              </Text>

              {!checkingFeedback && !feedbackAlreadyGiven && (
                <>
                  <Text
                    style={[
                      styles.partnerText,
                      { color: colors.secondaryText },
                    ]}
                  >
                    Your meeting with {partnerName}
                  </Text>

                  <View style={styles.ratingSection}>
                    <Text style={[styles.ratingLabel, { color: colors.text }]}>
                      Rate your experience
                    </Text>
                    <View style={styles.starsContainer}>{renderStars1()}</View>
                  </View>

                  <Text
                    style={[
                      styles.partnerText,
                      { color: colors.secondaryText },
                    ]}
                  >
                    {coffeePlace}
                  </Text>

                  <View style={styles.ratingSection}>
                    <Text style={[styles.ratingLabel, { color: colors.text }]}>
                      Rate the Cafe
                    </Text>
                    <View style={styles.starsContainer}>{renderStars2()}</View>
                  </View>

                  <View style={styles.feedbackSection}>
                    <Text
                      style={[styles.feedbackLabel, { color: colors.text }]}
                    >
                      Tell us more about your experience (optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.feedbackInput,
                        {
                          color: feedbackAlreadyGiven
                            ? colors.secondaryText + "50"
                            : colors.text,
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                        feedbackAlreadyGiven && styles.disabledInput,
                      ]}
                      placeholder="Share your thoughts about the meeting..."
                      placeholderTextColor={colors.secondaryText}
                      value={feedbackText}
                      onChangeText={
                        feedbackAlreadyGiven ? undefined : setFeedbackText
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      maxLength={500}
                      editable={!feedbackAlreadyGiven}
                      onFocus={
                        feedbackAlreadyGiven
                          ? undefined
                          : () => {
                              setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({
                                  animated: true,
                                });
                              }, 300);
                            }
                      }
                    />
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        styles.fullWidthButton,
                        { backgroundColor: colors.primary },
                        (submitting || feedbackAlreadyGiven) &&
                          styles.disabledButton,
                      ]}
                      onPress={handleSubmit}
                      disabled={submitting || feedbackAlreadyGiven}
                    >
                      <Text style={styles.submitButtonText}>
                        {submitting
                          ? "Submitting..."
                          : feedbackAlreadyGiven
                            ? "Feedback Already Given"
                            : "Submit Feedback"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "K2D-SemiBold",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  partnerText: {
    fontSize: 14,
    fontFamily: "K2D-Regular",
    marginBottom: 24,
  },
  actionButtonText: {
    fontFamily: "K2D-Regular",
    fontSize: 14,
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackLabel: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
    marginBottom: 12,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "K2D-Regular",
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "K2D-Medium",
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledInput: {
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
  },
  alreadyGivenContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  alreadyGivenText: {
    fontSize: 16,
    fontFamily: "K2D-Regular",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  fullWidthButton: {
    flex: 1, // Make the submit button take the full width
  }
});