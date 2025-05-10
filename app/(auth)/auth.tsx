
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function Auth() {
  const router = useRouter();
  
  React.useEffect(() => {
    // Redirect to login page
    router.replace('/(auth)/login');
  }, []);

  return <View />;
}
