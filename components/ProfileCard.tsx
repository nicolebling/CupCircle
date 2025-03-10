
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Button from './ui/Button';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ProfileCardProps = {
  profile: {
    id: string;
    name: string;
    age?: number;
    photo: string;
    occupation: string;
    location?: string;
    experience: string;
    bio: string;
    interests: string[];
    favoriteCafes?: string[];
    neighborhoods?: string[];
    matchedCafe?: boolean;
  };
  onLike: () => void;
  onSkip: () => void;
};

export default function ProfileCard({ profile, onLike, onSkip }: ProfileCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: profile.photo }} style={styles.image} />
      
      {profile.matchedCafe && (
        <View style={[styles.matchBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="cafe" size={14} color="white" />
          <Text style={styles.matchBadgeText}>Café Match</Text>
        </View>
      )}
      
      <View style={styles.content}>
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
        
        <View style={[styles.occupationBadge, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="briefcase-outline" size={14} color={colors.primary} style={styles.occupationIcon} />
          <Text style={[styles.occupation, { color: colors.primary }]}>{profile.occupation}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.sectionText, { color: colors.secondaryText }]} numberOfLines={3}>
          {profile.bio}
        </Text>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
        <View style={styles.interestsContainer}>
          {profile.interests.slice(0, 5).map((interest, index) => (
            <View 
              key={index} 
              style={[
                styles.interestTag, 
                { backgroundColor: colors.primary + '20' }
              ]}
            >
              <Text style={[styles.interestText, { color: colors.primary }]}>{interest}</Text>
            </View>
          ))}
        </View>
        
        {profile.favoriteCafes && profile.favoriteCafes.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Favorite Cafes</Text>
            <View style={styles.interestsContainer}>
              {profile.favoriteCafes.slice(0, 3).map((cafe, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.interestTag, 
                    { backgroundColor: colors.primary + '15' }
                  ]}
                >
                  <Text style={[styles.interestText, { color: colors.primary }]}>
                    <Ionicons name="cafe-outline" size={12} color={colors.primary} /> {cafe}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
        
        {profile.neighborhoods && profile.neighborhoods.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Neighborhoods</Text>
            <View style={styles.interestsContainer}>
              {profile.neighborhoods.slice(0, 3).map((neighborhood, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.interestTag, 
                    { backgroundColor: colors.primary + '15' }
                  ]}
                >
                  <Text style={[styles.interestText, { color: colors.primary }]}>
                    <Ionicons name="location-outline" size={12} color={colors.primary} /> {neighborhood}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
        
        {profile.experience && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>
            <Text style={[styles.sectionText, { color: colors.secondaryText }]} numberOfLines={2}>
              {profile.experience}
            </Text>
          </>
        )}
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          onPress={onSkip} 
          style={[styles.actionButton, styles.skipButton, { backgroundColor: '#FEE2E2' }]}
        >
          <Ionicons name="close" size={24} color="#EF4444" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={onLike} 
          style={[styles.actionButton, styles.likeButton, { backgroundColor: '#DCFCE7' }]}
        >
          <Ionicons name="checkmark" size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchBadgeText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    marginLeft: 4,
  },
  occupationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  occupationIcon: {
    marginRight: 6,
  },
  occupation: {
    fontFamily: 'K2D-Medium',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFE9D3',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  sectionText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontFamily: 'K2D-Medium',
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButton: {
    // Styles specific to skip button
  },
  likeButton: {
    // Styles specific to like button
  },
});
