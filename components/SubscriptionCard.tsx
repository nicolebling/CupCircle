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
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Ionicons name="cafe" size={48} color={colors.primary} />
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'K2D-Bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  subscribeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
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