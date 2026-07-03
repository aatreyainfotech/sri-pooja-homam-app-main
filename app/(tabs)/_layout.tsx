import { Tabs, Slot } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';

const BRAND = '#8B1515';
const GOLD = '#C9922A';
const MUTED = '#B0B0B0';
const PILL_BG = '#FFEBEE';

type TabIconProps = {
  iconFocused: string;
  iconBlur: string;
  label: string;
  focused: boolean;
  badge?: boolean;
};

function TabIcon({ iconFocused, iconBlur, label, focused, badge }: TabIconProps) {
  return (
    <View style={styles.tabWrap}>
      <View style={[styles.pill, focused && styles.pillActive]}>
        <View style={{ position: 'relative' }}>
          <Ionicons
            name={(focused ? iconFocused : iconBlur) as any}
            size={21}
            color={focused ? BRAND : MUTED}
          />
          {badge && <View style={styles.badgeDot} />}
        </View>
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;

  if (loading) return null;

  // Desktop web: no auth gate, no tab bar — website navbar handles navigation
  if (isWebDesktop) return <Slot />;

  // Mobile app / mobile web: guests can browse the home page and public tabs.
  // Protected tabs (Bookings, Profile) show their own sign-in prompt.
  const isPujari = user?.role === 'poojari';

  return (
    <Tabs
      initialRouteName={isPujari ? 'pujari' : 'index'}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="pujari"
        options={{
          href: isPujari ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon iconFocused="grid" iconBlur="grid-outline" label="My Poojas" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconFocused="home" iconBlur="home-outline" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="temples"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconFocused="business" iconBlur="business-outline" label="Temples" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconFocused="calendar" iconBlur="calendar-outline" label="Calendar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconFocused="radio" iconBlur="radio-outline" label="Live" focused={focused} badge />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          href: isPujari ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon iconFocused="receipt" iconBlur="receipt-outline" label="Bookings" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconFocused="person-circle" iconBlur="person-circle-outline" label="Profile" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    height: 78,
    borderTopWidth: 0,
    paddingBottom: 0,
    elevation: 32,
    shadowColor: '#8B1515',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
  },
  tabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 8,
  },
  pill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: PILL_BG,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: BRAND,
    fontWeight: '800',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
