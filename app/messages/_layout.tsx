
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

export default function MessagesLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: "test",
          headerBackTitle: "Chats",
        }}
      />
    </Stack>
  );
}
