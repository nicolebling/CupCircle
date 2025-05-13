import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#f0f0f0', // Replace with your actual color
      },
      headerTintColor: '#000', // Replace with your actual color
      headerBackTitle: " ",
      headerBackTitleVisible: false,
    }}/>
  );
}