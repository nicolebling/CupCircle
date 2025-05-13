
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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
        headerBackTitle: " ",
        headerBackTitleVisible: false,
        headerShadowVisible: false,
      }}
    />
  );
}
