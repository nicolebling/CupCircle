
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type SubscriptionCardProps = {
  onSubscribe: () => void;
};

export default function SubscriptionCard({
  onSubscribe,
}: SubscriptionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="cafe" size={64} color={colors.primary} />
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
          <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: colors.secondaryText }]}>
          Continue exploring profiles and connecting with professionals
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(249, 116, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'K2D-Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    fontFamily: 'K2D-Regular',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  subscribeButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
