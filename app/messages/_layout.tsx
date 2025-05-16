import { Stack } from "expo-router";

export default function MessagesLayout() {
  return (
    <Stack>
      <Stack.Screen
        options={{
          headerShown: false}}
        /
    </Stack>
  );
}
