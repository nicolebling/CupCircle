
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function MessagesLayout() {
  const { profile } = useAuth();
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
        title: profile?.name || 'Messages'
      }}
    />
  );
}
