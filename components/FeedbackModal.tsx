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
      if (!visible || !user?.id || !matchId) return;

      try {
        setCheckingFeedback(true);

        const { data, error } = await supabase
          .from("feedback")
          .select("feedback_id")
          .eq("match_id", matchId)
          .eq("user1_id", user.id);

        if (error && error.code !== "PGRST116") {
          // PGRST116 means no rows found, which is expected if no feedback given
          throw error;
        }
        const hasGivenFeedback = !!data;
        console.log("HERE!!!!", hasGivenFeedback);
        console.log("HERE!!!!", matchId);
        console.log("HERE!!!!", user.id);
        console.log("Feedback data:", data);

        setFeedbackAlreadyGiven(hasGivenFeedback);

        if (hasGivenFeedback) {
          Alert.alert(
            "Feedback Already Given",
            "You have already provided feedback for this meeting.",
            [
              {
                text: "OK",
                onPress: () => onClose(),
              },
            ],
          );
        }
      } catch (error) {
        console.error("Error checking existing feedback:", error);
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

      // Final check if feedback already exists before submitting
      const { data: existingFeedback, error: checkError } = await supabase
        .from("feedback")
        .select("feedback_id")
        .eq("match_id", matchId)
        .eq("user1_id", user.id)
        .limit(1);

      if (checkError) {
        console.error("Error checking existing feedback:", checkError);
        Alert.alert(
          "Error",
          "Failed to verify feedback status. Please try again.",
        );
        return;
      }

      if (existingFeedback && existingFeedback.length > 0) {
        setFeedbackAlreadyGiven(true);
        console.log("123", setFeedbackAlreadyGiven);
        Alert.alert(
          "Feedback Already Given",
          "You have already provided feedback for this meeting.",
          [{ text: "OK", onPress: () => onClose() }],
        );
        // setFeedbackAlreadyGiven(true);
        return;
      }

      // Get the match details to find the partner
      const { data: matchData, error: matchError } = await supabase
        .from("matching")
        .select("user1_id, user2_id")
        .eq("match_id", matchId);

      if (matchError) throw matchError;

      // Determine the partner ID
      const partnerId =
        matchData.user1_id === user.id
          ? matchData.user2_id
          : matchData.user1_id;

      // Insert feedback into database with both user IDs for complete tracking
      const { error } = await supabase.from("feedback").insert([
        {
          match_id: matchId,
          user1_id: user.id,
          user2_id: partnerId,
          user_rating: userRating,
          cafe_rating: cafeRating,
          feedback_text: feedbackText.trim(),
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          // PostgreSQL unique_violation
          setFeedbackAlreadyGiven(true);
          Alert.alert(
            "Feedback Already Given",
            "You have already submitted feedback for this meeting.",
            [{ text: "OK", onPress: () => onClose() }],
          );
        } else {
          console.error("Error submitting feedback:", error);
          Alert.alert("Error", "Failed to submit feedback. Please try again.");
        }
        return;
      }

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
                  <Text
                    style={[
                      styles.loadingText,
                      { color: colors.secondaryText },
                    ]}
                  >
                    Checking feedback status...
                  </Text>
                </View>
              )}
              <Text style={styles.actionButtonText}>
                {feedbackAlreadyGiven && !checkingFeedback
                  ? "Feedback Given"
                  : "Give Feedback"}
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
                        styles.cancelButton,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => {
                        onClose();
                        resetForm();
                      }}
                    >
                      <Text
                        style={[
                          styles.cancelButtonText,
                          { color: colors.text },
                        ]}
                      >
                        Skip
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
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
    color: "#FFFFFF",
    fontFamily: "K2D-Medium",
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
});
