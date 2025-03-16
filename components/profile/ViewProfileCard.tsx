
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProfileData } from '../ProfileCard';
import { getCoffeeTheme, getCoffeeColor } from '@/utils/profileUtils';

type ViewProfileCardProps = {
  profile: UserProfileData;
};

export default function ViewProfileCard({ profile }: ViewProfileCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ScrollView>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: profile.photo }} style={styles.profilePhoto} />
        </View>

        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]}>
            {profile.name} {profile.age && <Text>{profile.age}</Text>}
          </Text>
          {profile.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={colors.secondaryText} />
              <Text style={[styles.location, { color: colors.secondaryText }]}>{profile.location}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
          <Text style={[styles.value, { color: colors.text }]}>{profile.bio}</Text>
        </View>

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.tagsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Details</Text>
          <Text style={[styles.label, { color: colors.secondaryText }]}>Occupation</Text>
          <Text style={[styles.value, { color: colors.text }]}>{profile.occupation}</Text>

          {profile.experienceLevel && (
            <>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Experience Level</Text>
              <View style={styles.coffeeExperienceContainer}>
                <Text style={[styles.value, { color: colors.text }]}>{profile.experienceLevel}</Text>
                <View style={[styles.coffeeBadge, { backgroundColor: getCoffeeColor(profile.experienceLevel) + "20" }]}>
                  <Ionicons name="cafe" size={14} color={getCoffeeColor(profile.experienceLevel)} />
                  <Text style={[styles.coffeeBadgeText, { color: getCoffeeColor(profile.experienceLevel) }]}>
                    {getCoffeeTheme(profile.experienceLevel)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Add more sections as needed */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontWeight: '500',
    fontSize: 12,
  },
  coffeeExperienceContainer: {
    marginBottom: 16,
  },
  coffeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  coffeeBadgeText: {
    fontWeight: '500',
    fontSize: 12,
    marginLeft: 4,
  },
});
