import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import { View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  const isPujari = user?.role === 'poojari';

  return (
    <Tabs
      initialRouteName={isPujari ? 'pujari' : 'index'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: theme.colors.border,
          height: 68,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {/* Pujari-only dashboard — shown first for pujari users; hidden for others */}
      <Tabs.Screen
        name="pujari"
        options={{
          href: isPujari ? undefined : null,
          title: 'My Poojas',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="temples"
        options={{
          title: 'Temples',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'business' : 'business-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? 'radio' : 'radio-outline'} size={26} color={color} />
              <View style={styles.liveDot} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          href: isPujari ? null : undefined,
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={26} color={color} />,
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  liveDot: {
    position: 'absolute', top: -1, right: -3, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#E53935', borderWidth: 1.5, borderColor: '#fff',
  },
});
