
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type SubscriptionCardProps = {
  visible: boolean;
  onSubscribe: () => void;
  onClose: () => void;
};

export default function SubscriptionCard({
  visible,
  onSubscribe,
  onClose,
}: SubscriptionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.cardContainer, { backgroundColor: colors.card }]}>
          {/* <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.secondaryText} />
          </TouchableOpacity> */}

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

          {/* <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={[styles.laterButtonText, { color: colors.secondaryText }]}>
              Maybe later
            </Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
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
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  laterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  laterButtonText: {
    fontSize: 14,
    fontFamily: 'K2D-Medium',
  },
});
