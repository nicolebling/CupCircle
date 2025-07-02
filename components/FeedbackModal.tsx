import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";

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

  const [rating1, setRating1] = useState<number>(0);
   const [rating2, setRating2] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStarPress1 = (selectedRating: number) => {
    setRating1(selectedRating);
  };

  const handleStarPress2 = (selectedRating: number) => {
    setRating2(selectedRating);
  };

  const handleSubmit = async () => {
    if (rating1 || rating2 === 0) {
      Alert.alert(
        "Rating Required",
        "Please provide a rating before submitting.",
      );
      return;
    }

    try {
      setSubmitting(true);

      // Insert feedback into database
      const { error } = await supabase.from("feedback").insert([
        {
          match_id: matchId,
          rating1: rating1,
          rating2: rating2,
          feedback: feedback.trim(),
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

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
    setRating1(0);
    setRating2(0);
    setFeedback("");
  };

  const renderStars1 = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress1(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating1 ? "star" : "star-outline"}
            size={32}
            color={i <= rating1 ? "#FFD700" : colors.secondaryText}
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
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating2 ? "star" : "star-outline"}
            size={32}
            color={i <= rating2 ? "#FFD700" : colors.secondaryText}
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
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                How was your coffee chat?
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.partnerText, { color: colors.secondaryText }]}>
              Your meeting with {partnerName}
            </Text>

            <View style={styles.ratingSection}>
              <Text style={[styles.ratingLabel, { color: colors.text }]}>
                Rate your experience
              </Text>
              <View style={styles.starsContainer}>{renderStars1()}</View>
            </View>

            <Text style={[styles.partnerText, { color: colors.secondaryText }]}>
              {coffeePlace}
            </Text>

            <View style={styles.ratingSection}>
              <Text style={[styles.ratingLabel, { color: colors.text }]}>
                Rate the Cafe
              </Text>
              <View style={styles.starsContainer}>{renderStars2()}</View>
            </View>

            <View style={styles.feedbackSection}>
              <Text style={[styles.feedbackLabel, { color: colors.text }]}>
                Tell us more about your experience (optional)
              </Text>
              <TextInput
                style={[
                  styles.feedbackInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Share your thoughts about the meeting..."
                placeholderTextColor={colors.secondaryText}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  onClose();
                  resetForm();
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Skip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  submitting && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
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
});
