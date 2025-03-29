import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
  EvilIcons,
  FontAwesome,
  FontAwesome6,
  Entypo,
} from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";


// List of all interests
const INTERESTS = [
  "Reading",
  "Writing",
  "Self-Development",
  "Mindfulness",
  "Languages",
  "Psychology",
  "Philosophy",
  "Education",
  "Mentoring",
  "Leadership",
  "Technology",
  "Business",
  "Startups",
  "Innovation",
  "Sustainability",
  "Social Impact",
  "Marketing",
  "Design",
  "Finance",
  "Entrepreneurship",
  "Public Speaking",
  "Networking",
  "Project Management",
  "Data Science",
  "Photography",
  "Travel",
  "Cooking",
  "Music",
  "Art",
  "Sports",
  "Gaming",
  "Fashion",
  "Fitness",
  "Hiking",
  "Movies",
  "Theatre",
  "Dance",
  "Food & Wine",
  "Coffee",
  "Tea",
  "Yoga",
  "Meditation",
  "Podcasts",
  "Blogging",
];

interface InterestSelectorProps {
  selected: string[];
  onChange: (interests: string[]) => void;
  maxInterests?: number;
  isDark?: boolean;
}

export default function InterestSelector({
  selected = [],
  onChange,
  maxInterests = 10,
  isDark = false,
}: InterestSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Filter interests based on search text
  const filteredInterests = useMemo(() => {
    if (!searchText.trim()) return INTERESTS;
    const searchLower = searchText.toLowerCase();
    const filtered = INTERESTS.filter((interest) =>
      interest.toLowerCase().includes(searchLower)
    );
    return filtered;
  }, [searchText]);

  const showCustomOption = useMemo(() => {
    return searchText.trim() && !INTERESTS.some(interest => 
      interest.toLowerCase() === searchText.trim().toLowerCase()
    );
  }, [searchText]);

  // Handle interest selection/deselection
  const toggleInterest = (interest: string) => {
    let newSelectedInterests;

    if (selected.includes(interest)) {
      // Remove the interest
      newSelectedInterests = selected.filter((i) => i !== interest);
    } else {
      // Add the interest if under the limit
      if (selected.length < maxInterests) {
        newSelectedInterests = [...selected, interest];
      } else {
        // Show alert or toast that max limit is reached
        console.log(`Maximum of ${maxInterests} interests allowed`);
        return;
      }
    }

    onChange(newSelectedInterests);
  };

  const handleAddCustomInterest = () => {
    const words = customInterest.split(" ");
    if (words.length > 10) {
      //Ideally, replace this with a proper toast notification
      console.log("Interest cannot exceed 100 words");
      return;
    }
    const formattedInterest = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    toggleInterest(formattedInterest);
    setCustomInterest("");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          {Array.isArray(selected) && selected.length > 0 ? (
            <Text
              style={[styles.selectorText, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selected.length} interests selected
            </Text>
          ) : (
            <Text
              style={[styles.selectorText, { color: colors.secondaryText }]}
            >
              Select your interests
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.secondaryText} />
      </TouchableOpacity>

      {Array.isArray(selected) && selected.length > 0 && (
        <View style={styles.selectedContainer}>
          {selected.map((industry, index) => (
            <View
              key={index}
              style={[
                styles.selectedBubble,
                { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[styles.selectedBubbleText, { color: colors.primary }]}
              >
                {industry}
              </Text>
            </View>
          ))}
        </View>
      )}

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
                Select Interests ({selected.length}/{maxInterests})
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.secondaryText} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search or type custom interest..."
                  placeholderTextColor={colors.secondaryText}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              {showCustomOption && (
                <TouchableOpacity
                  style={[styles.customOption, { borderColor: colors.border }]}
                  onPress={() => {
                    const words = searchText.split(" ");
                    if (words.length > 10) {
                      console.log("Interest cannot exceed 10 words");
                      return;
                    }
                    const formattedInterest = words
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(" ");
                    toggleInterest(formattedInterest);
                    setSearchText("");
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  <Text style={[styles.customOptionText, { color: colors.text }]}>
                    Add "{searchText}" as custom interest
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.selectedPreview}>
              <Text
                style={[styles.previewTitle, { color: colors.secondaryText }]}
              >
                Selected:
              </Text>
              <View style={styles.tagsContainer}>
                {selected.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: colors.primary + "20",
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>
                       {interest}
                    </Text>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FlatList
              data={filteredInterests}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.interestItem,
                      isSelected && { backgroundColor: colors.primary + "10" },
                    ]}
                    onPress={() => toggleInterest(item)}
                  >
                    <View style={styles.interestContent}>
                      <Text
                        style={[styles.interestText, { color: colors.text }]}
                      >
                        {item}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.interestsList}
            />

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  selector: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
  },
  selectorContent: {
    flex: 1,
  },
  selectorText: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: "K2D-SemiBold",
    fontSize: 18,
  },
  inputContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 8,
    fontFamily: "K2D-Regular",
    fontSize: 16,
  },
  customOption: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  customOptionText: {
    marginLeft: 8,
    fontFamily: "K2D-Regular",
    fontSize: 14,
  },
  selectedPreview: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  previewTitle: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  selectedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 16,
  },
  selectedBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedBubbleText: {
    fontFamily: "K2D-Medium",
    fontSize: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagText: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginRight: 6,
  },
  interestsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  interestItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  interestContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  interestText: {
    fontFamily: "K2D-Regular",
    fontSize: 16,
  },
  doneButton: {
    marginHorizontal: 16,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    fontFamily: "K2D-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});