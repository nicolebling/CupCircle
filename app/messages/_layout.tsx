
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";

export default function MessagesLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: "Chat",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: 'K2D-SemiBold',
          },
        }}
      />
    </Stack>
  );
}
