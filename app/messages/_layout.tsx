
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

export default function MessagesLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerBackTitleVisible: false,
      }}
    />
  );
}
