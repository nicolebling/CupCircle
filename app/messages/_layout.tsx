
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

export default function MessagesLayout() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Stack 
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'K2D-SemiBold',
        },
        headerTitle: () => (
          <View style={styles.headerContainer}>
            <Image
              source={{
                uri: profile?.photo_url || 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'
              }}
              style={styles.profileImage}
            />
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile?.name || 'My Messages'}
            </Text>
          </View>
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'K2D-SemiBold',
  },
});
