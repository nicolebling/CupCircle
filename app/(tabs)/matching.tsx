
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import ProfileCard from '@/components/ProfileCard';

export default function MatchingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Mock profiles data
  const [profiles] = useState([
    {
      id: '1',
      name: 'Alex Thompson',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      occupation: 'Software Engineer',
      experience: '5 years at Google, 2 years at StartupXYZ',
      bio: 'Passionate about building scalable web applications and mentoring junior developers. Looking to expand my network in the tech community.',
      interests: ['React', 'Node.js', 'Cloud Architecture', 'Mentoring'],
    },
    {
      id: '2',
      name: 'Sophia Wang',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      occupation: 'UX/UI Designer',
      experience: '4 years at Design Studio, 3 years freelancing',
      bio: 'Creative designer with a strong focus on user-centered design. I enjoy collaborating with developers and product teams to create intuitive experiences.',
      interests: ['User Research', 'Wireframing', 'Figma', 'Design Systems'],
    },
    {
      id: '3',
      name: 'Marcus Johnson',
      photo: 'https://randomuser.me/api/portraits/men/67.jpg',
      occupation: 'Product Manager',
      experience: '7 years in product management across fintech and e-commerce',
      bio: 'Strategic product manager with experience taking products from concept to market. Looking to connect with engineers and designers.',
      interests: ['Agile', 'Product Strategy', 'Market Research', 'FinTech'],
    },
  ]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleLike = () => {
    // Here you would typically send a like request to your backend
    console.log(`Liked ${profiles[currentIndex].name}`);
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleSkip = () => {
    console.log(`Skipped ${profiles[currentIndex].name}`);
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Find Connections</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Discover professionals for your next coffee chat
        </Text>
      </View>
      
      <View style={styles.cardsContainer}>
        {currentIndex < profiles.length ? (
          <ProfileCard
            profile={profiles[currentIndex]}
            onLike={handleLike}
            onSkip={handleSkip}
          />
        ) : (
          <View style={[styles.noMoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noMoreText, { color: colors.text }]}>
              No more profiles to show at the moment.
            </Text>
            <Text style={[styles.checkBackText, { color: colors.secondaryText }]}>
              Check back later for more connections!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'K2D-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'K2D-Regular',
    fontSize: 16,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMoreCard: {
    width: '90%',
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noMoreText: {
    fontFamily: 'K2D-SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  checkBackText: {
    fontFamily: 'K2D-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

type MatchProfile = {
  id: string;
  name: string;
  position: string;
  company: string;
  distance: string;
  commonInterests: string[];
  compatibility: number;
  photo: string;
};

export default function MatchingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [activeTab, setActiveTab] = useState('suggested');

  const [suggestedMatches, setSuggestedMatches] = useState<MatchProfile[]>([
    {
      id: '1',
      name: 'Emily Williams',
      position: 'Product Manager',
      company: 'InnoTech',
      distance: '0.8 miles',
      commonInterests: ['Product Strategy', 'User Research', 'Market Analysis'],
      compatibility: 92,
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: '2',
      name: 'David Lee',
      position: 'Frontend Developer',
      company: 'WebCore',
      distance: '1.2 miles',
      commonInterests: ['React', 'UI Design', 'Mobile Development'],
      compatibility: 87,
      photo: 'https://randomuser.me/api/portraits/men/42.jpg',
    },
    {
      id: '3',
      name: 'Jessica Chen',
      position: 'UI/UX Designer',
      company: 'Creative Minds',
      distance: '0.5 miles',
      commonInterests: ['User Experience', 'Design Systems', 'Prototyping'],
      compatibility: 85,
      photo: 'https://randomuser.me/api/portraits/women/11.jpg',
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      position: 'Data Scientist',
      company: 'DataViz',
      distance: '2.1 miles',
      commonInterests: ['Machine Learning', 'Data Visualization', 'Statistics'],
      compatibility: 78,
      photo: 'https://randomuser.me/api/portraits/men/62.jpg',
    },
  ]);
  
  const [pendingRequests, setPendingRequests] = useState<MatchProfile[]>([
    {
      id: '5',
      name: 'Sarah Johnson',
      position: 'UX Designer',
      company: 'Design Co',
      distance: '0.7 miles',
      commonInterests: ['User Research', 'Prototyping', 'Usability Testing'],
      compatibility: 90,
      photo: 'https://randomuser.me/api/portraits/women/32.jpg',
    },
  ]);
  
  const renderMatchCard = ({ item }: { item: MatchProfile }) => (
    <View style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.compatibilityBadge}>
        <Text style={styles.compatibilityText}>{item.compatibility}%</Text>
      </View>
      
      <Image source={{ uri: item.photo }} style={styles.profileImage} />
      
      <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.position, { color: colors.secondaryText }]}>{item.position}</Text>
      <Text style={[styles.company, { color: colors.secondaryText }]}>{item.company}</Text>
      
      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color={colors.primary} />
        <Text style={[styles.distance, { color: colors.secondaryText }]}>{item.distance}</Text>
      </View>
      
      <View style={styles.interestsContainer}>
        <Text style={[styles.interestsLabel, { color: colors.text }]}>Common Interests:</Text>
        <View style={styles.interestTags}>
          {item.commonInterests.map((interest, index) => (
            <View 
              key={index} 
              style={[styles.interestTag, { 
                backgroundColor: `${colors.primary}20`,
                borderColor: colors.primary,
              }]}
            >
              <Text style={[styles.interestText, { color: colors.primary }]}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        {activeTab === 'suggested' ? (
          <>
            <TouchableOpacity style={[styles.declineButton, { borderColor: colors.border }]}>
              <Ionicons name="close" size={24} color={colors.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.connectButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.connectText}>Connect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.declineButton, { borderColor: colors.border }]}>
              <Text style={[styles.declineText, { color: colors.secondaryText }]}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Coffee Partners</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.tabContainer, { borderColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'suggested' && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('suggested')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'suggested' ? { color: colors.primary } : { color: colors.secondaryText }
            ]}
          >
            Suggested
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'pending' && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'pending' ? { color: colors.primary } : { color: colors.secondaryText }
            ]}
          >
            Pending
            {pendingRequests.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={activeTab === 'suggested' ? suggestedMatches : pendingRequests}
        renderItem={renderMatchCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.matchList}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {activeTab === 'suggested' ? 'No suggested matches yet' : 'No pending requests'}
            </Text>
            {activeTab === 'suggested' && (
              <TouchableOpacity style={[styles.updateButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.updateButtonText}>Update Preferences</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'K2D-Bold',
  },
  matchList: {
    padding: 16,
    paddingTop: 0,
  },
  matchCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#F97415',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  compatibilityText: {
    color: 'white',
    fontFamily: 'K2D-Bold',
    fontSize: 14,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 4,
  },
  position: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    marginBottom: 2,
  },
  company: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  distance: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  interestsContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  interestsLabel: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginBottom: 8,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  interestTag: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  declineButton: {
    height: 48,
    width: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  connectButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  connectText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  declineText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
  acceptButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  acceptText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  updateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  updateButtonText: {
    color: 'white',
    fontFamily: 'K2D-SemiBold',
    fontSize: 16,
  },
});
