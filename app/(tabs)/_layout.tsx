
import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { View, TouchableOpacity } from "react-native";
import { HapticTab } from '@/components/HapticTab';

export default function TabLayout() {
  const colors = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopColor: 'transparent',
          backgroundColor: '#F97415',
          borderTopWidth: 0,
          height: 70,
          paddingVertical: 12,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'K2D-SemiBold',
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarButton: HapticTab,
      }}
    >

      <Tabs.Screen
        name="matching"
        options={{
          title: 'Explore the Circle',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => {
                const matchingScreen = global.matchingScreen;
                if (matchingScreen?.openFilterModal) {
                  matchingScreen.openFilterModal();
                }
              }}
              style={{ marginRight: 23}}
            >
              <Ionicons name="filter" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipse" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="availability"
        options={{
          title: 'My Availability',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-clear" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Circle Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cafe" size={size} color={color} />
          ),
        }}
      />

    
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size }}>
              <Ionicons name="chatbubbles" size={size} color={color} />
              {global.unreadMessageCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: '#FB1429',
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#F97415',
                }} />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={({ route }) => ({
          title: route.params?.isEditMode ? 'Edit Profile' : 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        })}
      />

      
    </Tabs>
  );
}