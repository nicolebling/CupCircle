
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get("window");

type SubscriptionCardProps = {
  onSubscribe: () => void;
};

export default function SubscriptionCard({
  onSubscribe,
}: SubscriptionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="cafe" size={48} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        Great Start!
      </Text>

      <Text style={[styles.description, { color: colors.secondaryText }]}>
        One chat down, endless connections to go! Choose your plan to brew more opportunities.
      </Text>

      <TouchableOpacity
        style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
        onPress={onSubscribe}
      >
        <Text style={styles.subscribeButtonText}>Subscribe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: width - 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(249, 116, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  subscribeButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
});
