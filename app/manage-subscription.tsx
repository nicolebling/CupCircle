
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigation } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import Superwall from "expo-superwall/compat";

interface SubscriptionInfo {
  status: string;
  productIdentifier?: string;
  renewalDate?: string;
  price?: string;
  planType?: 'free' | 'weekly' | 'monthly' | 'annually';
}

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();

  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      title: "Manage Subscription",
    });
  }, [colors.text, navigation, router]);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const subscriptionStatus = await Superwall.shared.getSubscriptionStatus();
      console.log("Subscription status:", subscriptionStatus);
      
      let planInfo: SubscriptionInfo = {
        status: 'free',
        planType: 'free'
      };

      if (subscriptionStatus?.status) {
        const status = subscriptionStatus.status.toLowerCase();
        
        if (status === 'active') {
          planInfo.status = 'active';
          
          // Try to extract plan type from product identifier
          const productId = subscriptionStatus.productIdentifier?.toLowerCase() || '';
          if (productId.includes('weekly')) {
            planInfo.planType = 'weekly';
          } else if (productId.includes('monthly')) {
            planInfo.planType = 'monthly';
          } else if (productId.includes('annual') || productId.includes('yearly')) {
            planInfo.planType = 'annually';
          } else {
            planInfo.planType = 'monthly'; // default assumption
          }
          
          planInfo.productIdentifier = subscriptionStatus.productIdentifier;
          
          // Format renewal date if available
          if (subscriptionStatus.renewalDate) {
            const renewalDate = new Date(subscriptionStatus.renewalDate);
            planInfo.renewalDate = renewalDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
          
          // Set price based on plan type (you may want to get this from Superwall or store it)
          switch (planInfo.planType) {
            case 'weekly':
              planInfo.price = '$1.99';
              break;
            case 'monthly':
              planInfo.price = '$6.99';
              break;
            case 'annually':
              planInfo.price = '$59.99';
              break;
          }
        }
      }
      
      setSubscriptionInfo(planInfo);
    } catch (error) {
      console.error("Error fetching subscription info:", error);
      setSubscriptionInfo({
        status: 'free',
        planType: 'free'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    try {
      
      await Superwall.shared.register({
        placement: 'subscription_onPress',
      });
      
      // Refresh subscription info after paywall interaction
      setTimeout(() => {
        fetchSubscriptionInfo();
      
      }, 2000);
    } catch (error) {
      console.error("Error triggering paywall:", error);
     
    }
  };

  const handleEndMembership = () => {
    Alert.alert(
      "End Membership",
      "Are you sure you want to cancel your subscription? You'll continue to have access until your current billing period ends.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "End Membership",
          style: "destructive",
          onPress: () => {
            // Open subscription management in device settings
            Alert.alert(
              "Manage Subscription",
              "To cancel your subscription, please go to your device's subscription settings:\n\niOS: Settings > Apple ID > Subscriptions\nAndroid: Play Store > Menu > Subscriptions",
              [{ text: "OK" }]
            );
          }
        }
      ]
    );
  };

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'weekly':
        return 'Weekly Plan';
      case 'monthly':
        return 'Monthly Plan';
      case 'annually':
        return 'Annual Plan';
      default:
        return 'Free Plan';
    }
  };

  const getPlanDescription = (planType: string) => {
    switch (planType) {
      case 'weekly':
        return 'Unlimited coffee chats for 7 days';
      case 'monthly':
        return 'Unlimited coffee chats & filters for 30 days';
      case 'annually':
        return '1 year of unlimited coffee chats';
      default:
        return 'Limited to 1 coffee chat';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
            Loading subscription details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        {/* Current Plan Section */}
        <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planIcon, { backgroundColor: subscriptionInfo?.status === 'active' ? colors.primary : colors.border }]}>
              <Ionicons 
                name={subscriptionInfo?.status === 'active' ? "checkmark" : "cafe"} 
                size={24} 
                color={subscriptionInfo?.status === 'active' ? "white" : colors.secondaryText} 
              />
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planTitle, { color: colors.text }]}>
                {getPlanDisplayName(subscriptionInfo?.planType || 'free')}
              </Text>
              <Text style={[styles.planDescription, { color: colors.secondaryText }]}>
                {getPlanDescription(subscriptionInfo?.planType || 'free')}
              </Text>
            </View>
            {subscriptionInfo?.status === 'active' && (
              <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>

          {subscriptionInfo?.status === 'active' && subscriptionInfo.renewalDate && (
            <View style={[styles.renewalInfo, { borderTopColor: colors.border }]}>
              <View style={styles.renewalRow}>
                <Text style={[styles.renewalLabel, { color: colors.secondaryText }]}>
                  Next billing date
                </Text>
                <Text style={[styles.renewalDate, { color: colors.text }]}>
                  {subscriptionInfo.renewalDate}
                </Text>
              </View>
              {subscriptionInfo.price && (
                <View style={styles.renewalRow}>
                  <Text style={[styles.renewalLabel, { color: colors.secondaryText }]}>
                    Amount
                  </Text>
                  <Text style={[styles.renewalPrice, { color: colors.text }]}>
                    {subscriptionInfo.price}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Plan Benefits */}
        {/* <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {subscriptionInfo?.status === 'active' ? 'Your Benefits' : 'Upgrade Benefits'}
          </Text>
          
          <View style={[styles.benefitItem, { borderColor: colors.border }]}>
            <Ionicons name="infinite" size={20} color={colors.primary} />
            <Text style={[styles.benefitText, { color: colors.text }]}>
              Unlimited coffee chat requests
            </Text>
          </View>
          
          <View style={[styles.benefitItem, { borderColor: colors.border }]}>
            <Ionicons name="filter" size={20} color={colors.primary} />
            <Text style={[styles.benefitText, { color: colors.text }]}>
              Advanced filtering options
            </Text>
          </View>
          
          <View style={[styles.benefitItem, { borderColor: colors.border }]}>
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={[styles.benefitText, { color: colors.text }]}>
              Priority matching
            </Text>
          </View>
        </View> */}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: colors.primary }]}
            onPress={handleChangePlan}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.changeButtonText}>
                  {subscriptionInfo?.status === 'active' ? 'Change Plan' : 'Upgrade Now'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {subscriptionInfo?.status === 'active' && (
            <TouchableOpacity
              style={[styles.endMembershipButton, { borderColor: colors.border }]}
              onPress={handleEndMembership}
            >
              <Text style={[styles.endMembershipText, { color: "#FF3B30" }]}>
                End Membership
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: colors.secondaryText }]}>
            Subscriptions are managed through your device's app store. You can cancel anytime from your subscription settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 20,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'K2D-Medium',
  },
  renewalInfo: {
    borderTopWidth: 1,
    padding: 20,
    paddingTop: 16,
  },
  renewalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  renewalLabel: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
  },
  renewalDate: {
    fontSize: 14,
    fontFamily: 'K2D-Medium',
  },
  renewalPrice: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'K2D-SemiBold',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: 'K2D-Regular',
    flex: 1,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
  endMembershipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  endMembershipText: {
    fontSize: 16,
    fontFamily: 'K2D-Medium',
  },
  footerInfo: {
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'K2D-Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
});
