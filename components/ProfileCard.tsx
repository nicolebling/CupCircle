
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Button from './ui/Button';

const { width } = Dimensions.get('window');

type ProfileCardProps = {
  profile: {
    id: string;
    name: string;
    photo: string;
    occupation: string;
    experience: string;
    bio: string;
    interests: string[];
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
      
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>
        <Text style={[styles.occupation, { color: colors.secondaryText }]}>{profile.occupation}</Text>
        
        <View style={styles.divider} />
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>
        <Text style={[styles.sectionText, { color: colors.secondaryText }]}>{profile.experience}</Text>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.sectionText, { color: colors.secondaryText }]} numberOfLines={3}>
          {profile.bio}
        </Text>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
        <View style={styles.interestsContainer}>
          {profile.interests.map((interest, index) => (
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
      </View>
      
      <View style={styles.buttonsContainer}>
        <Button 
          title="Skip" 
          variant="outline" 
          onPress={onSkip} 
          style={styles.button} 
        />
        <Button 
          title="Connect" 
          onPress={onLike} 
          style={styles.button} 
        />
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
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  name: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  occupation: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
    marginBottom: 16,
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
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});
