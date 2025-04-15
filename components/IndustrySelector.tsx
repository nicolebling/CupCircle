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
const INDUSTRIES = [
  "Advertising",
  "Architecture",
  "Arts",
  "Beauty",
  "Blogging",
  "Charity",
  "Coaching",
  "Crafts",
  "Crypto",
  "Culture",
  "Education",
  "Entertainment",
  "Entrepreneurship",
  "Environment",
  "Fashion",
  "Filmmaking",
  "Finance",
  "Food",
  "Gaming",
  "Government",
  "Graphic Design",
  "Hospitality",
  "HR",
  "Industrial Design",
  "Interior Design",
  "Journalism",
  "Law",
  "Marketing",
  "Media",
  "Medicine",
  "Music",
  "Photography",
  "PR",
  "Psychotherapy",
  "Retail",
  "Science",
  "Sports",
  "Tech",
  "Theater",
  "Travel",
  "UI/UX design",
  "Venture Capital",
  "Writing",
];

interface IndustrySelectorProps {
  selected: string[];
  onChange: (industries: string[]) => void;
  maxIndustries?: number;
  isDark?: boolean;
  viewSelectionTracker?: boolean;
}

export default function IndustrySelector({
  selected = [],
  onChange,
  maxIndustries = 3,
  isDark = false,
  viewSelectionTracker = true, // Added default value
}: IndustrySelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Filter interests based on search text
  const filteredIndustries = useMemo(() => {
    if (!searchText.trim()) return INDUSTRIES;
    return INDUSTRIES.filter((industry) =>
      industry.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [searchText]);

  // Handle interest selection/deselection
  const toggleIndustry = (industry: string) => {
    let newSelectedIndustries;

    if (selected.includes(industry)) {
      // Remove the interest
      newSelectedIndustries = selected.filter((i) => i !== industry);
    } else {
      // Add the interest if under the limit
      if (selected.length < maxIndustries) {
        newSelectedIndustries = [...selected, industry];
      } else {
        // Show alert or toast that max limit is reached
        console.log(`Maximum of ${maxIndustries} industries allowed`);
        return;
      }
    }

    onChange(newSelectedIndustries);
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
              {selected.length} industries selected
            </Text>
          ) : (
            <Text
              style={[styles.selectorText, { color: colors.secondaryText }]}
            >
              Select industries
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
                {viewSelectionTracker !== false ? `Select Industries (${selected.length}/${maxIndustries})` : 'Select Industries'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.searchContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={20} color={colors.secondaryText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search industries..."
                placeholderTextColor={colors.secondaryText}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.secondaryText}
                  />
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
                {selected.map((industry) => (
                  <TouchableOpacity
                    key={industry}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: "transparent",
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => toggleIndustry(industry)}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {industry}
                    </Text>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.primary}
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FlatList
              data={filteredIndustries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.industryItem,
                      isSelected && { backgroundColor: colors.primary + "10" },
                    ]}
                    onPress={() => toggleIndustry(item)}
                  >
                    <View style={styles.industryContent}>
                      <Text
                        style={[styles.industryText, { color: colors.text }]}
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
              contentContainerStyle={styles.industriesList}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 8,
    fontFamily: "K2D-Regular",
    fontSize: 16,
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
  tagText: {
    fontFamily: "K2D-Medium",
    fontSize: 14,
    marginRight: 6,
  },
  industriesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  industryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  industryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiText: {
    fontSize: 18,
    marginRight: 12,
  },
  industryText: {
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