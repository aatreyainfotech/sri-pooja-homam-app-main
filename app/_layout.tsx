import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import {
  Platform, View, Text, StyleSheet, Image, Linking,
  TouchableOpacity, ScrollView, useWindowDimensions,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AppAlertHost } from '../src/components/AppAlert';

// ── Shared screen stack ────────────────────────────────────────────────────
function AppStack() {
  return (
    <Stack screenOptions={{
      headerShown: false, animation: 'fade',
      ...(Platform.OS === 'web' ? { contentStyle: { backgroundColor: '#0D0302' } } : {}),
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="temple/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="book-pooja/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="live-stream/[id]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="live-broadcast/[id]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="legal/privacy-policy" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="legal/terms" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="legal/refund" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notification-settings" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

// ── Auth-aware Web Navbar (must be inside AuthProvider) ────────────────────
function WebNavbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <View style={w.navbar}>
      <View style={w.navInner}>
        {/* Brand */}
        <TouchableOpacity onPress={() => router.push('/(tabs)' as any)} style={w.brandRow}>
          <Image source={require('../assets/images/icon.png')} style={w.navLogo} />
          <View>
            <Text style={w.navTelugu}>శ్రీ పూజా హోమం</Text>
            <Text style={w.navLatin}>SRI POOJA HOMAM</Text>
          </View>
        </TouchableOpacity>

        {/* Nav links */}
        <View style={w.navLinks}>
          <TouchableOpacity onPress={() => router.push('/(tabs)' as any)}>
            <Text style={w.navLink}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/temples' as any)}>
            <Text style={w.navLink}>Temples</Text>
          </TouchableOpacity>
          {user && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/bookings' as any)}>
              <Text style={w.navLink}>My Bookings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/(tabs)/live' as any)} style={w.livePill}>
            <View style={w.liveDot} />
            <Text style={w.liveLabel}>Live</Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity onPress={() => router.push('/admin' as any)} style={w.adminPill}>
              <Ionicons name="shield-checkmark" size={13} color="#D4AF37" />
              <Text style={w.adminLabel}>Admin CMS</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Right: auth */}
        {user ? (
          <View style={w.authRow}>
            <View style={w.userChip}>
              <View style={w.userDot}>
                <Text style={w.userDotText}>{(user.full_name || 'U').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={w.userName} numberOfLines={1}>{user.full_name}</Text>
            </View>
            <TouchableOpacity
              onPress={async () => { await logout(); router.replace('/(auth)/login' as any); }}
              style={w.logoutBtn}
            >
              <Ionicons name="log-out-outline" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={w.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} style={w.loginBtn}>
            <Ionicons name="person-circle-outline" size={17} color="#D4AF37" />
            <Text style={w.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={w.navGoldLine} />
    </View>
  );
}

// ── Admin CMS Sidebar ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',    icon: 'grid-outline',         route: '/admin' },
  { label: 'Temples',      icon: 'business-outline',     route: '/admin/temples' },
  { label: 'Poojas',       icon: 'flower-outline',       route: '/admin/poojas' },
  { label: 'Live Streams', icon: 'radio-outline',        route: '/admin/live-streams' },
  { label: 'Videos',       icon: 'videocam-outline',     route: '/admin/videos' },
  { label: 'Bookings',     icon: 'receipt-outline',      route: '/admin/bookings' },
  { label: 'Add Pujari',   icon: 'person-add-outline',   route: '/admin/create-pujari' },
  { label: 'Pujari Stats', icon: 'bar-chart-outline',    route: '/admin/pujari-stats' },
  { label: 'Payouts',      icon: 'send-outline',         route: '/admin/payouts' },
  { label: 'Accommodation', icon: 'bed-outline',          route: '/admin/properties' },
];
const SUPER_ITEMS = [
  { label: 'Users',        icon: 'people-outline',       route: '/admin/users' },
  { label: 'Create Admin', icon: 'shield-outline',       route: '/admin/create-admin' },
  { label: 'WhatsApp',     icon: 'logo-whatsapp',        route: '/admin/whatsapp-test' },
];

function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = [...NAV_ITEMS, ...(user?.role === 'super_admin' ? SUPER_ITEMS : [])];

  const isActive = (route: string) =>
    route === '/admin' ? pathname === '/admin' : pathname?.startsWith(route);

  return (
    <View style={cms.sidebar}>
      <View style={cms.sidebarBrand}>
        <Image source={require('../assets/images/icon.png')} style={cms.sidebarLogo} />
        <View>
          <Text style={cms.sidebarTitle}>Sri Pooja Homam</Text>
          <Text style={cms.sidebarSub}>Admin CMS</Text>
        </View>
      </View>

      <View style={cms.divider} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
        {items.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={[cms.navItem, active && cms.navItemActive]}
            >
              {active && <View style={cms.activeBar} />}
              <Ionicons
                name={item.icon as any}
                size={17}
                color={active ? '#D4AF37' : 'rgba(255,255,255,0.45)'}
                style={{ width: 22 }}
              />
              <Text style={[cms.navLabel, active && cms.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
        {user?.role === 'super_admin' && (
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Text style={cms.sectionHead}>SUPER ADMIN</Text>
          </View>
        )}
      </ScrollView>

      <View style={cms.divider} />

      <View style={cms.sidebarFooter}>
        <View style={cms.userRow}>
          <View style={cms.avatar}>
            <Text style={cms.avatarText}>{(user?.full_name || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={cms.userName} numberOfLines={1}>{user?.full_name || 'Admin'}</Text>
            <Text style={cms.userRole}>{(user?.role || '').replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)' as any)} style={cms.footerBtn}>
          <Ionicons name="home-outline" size={14} color="rgba(255,255,255,0.38)" />
          <Text style={cms.footerBtnText}>Back to Website</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { await logout(); router.replace('/(auth)/login' as any); }}
          style={[cms.footerBtn, { marginTop: 4 }]}
        >
          <Ionicons name="log-out-outline" size={14} color="#FF8A80" />
          <Text style={[cms.footerBtnText, { color: '#FF8A80' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AdminTopBar() {
  const pathname = usePathname();
  const raw = pathname?.replace('/admin', '').replace(/^\//, '') || '';
  const pageName = raw
    ? raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, ' ')
    : 'Dashboard';
  return (
    <View style={cms.topBar}>
      <View style={cms.breadcrumb}>
        <Text style={cms.breadHome}>Admin</Text>
        <Ionicons name="chevron-forward" size={13} color="rgba(212,175,55,0.4)" style={{ marginHorizontal: 5 }} />
        <Text style={cms.breadPage}>{pageName}</Text>
      </View>
      <View style={cms.cmsBadge}>
        <Ionicons name="shield-checkmark" size={13} color="#D4AF37" />
        <Text style={cms.cmsBadgeText}>CMS</Text>
      </View>
    </View>
  );
}

// ── Root Layout ────────────────────────────────────────────────────────────
export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const respRef = useRef<any>(null);
  const { width: screenWidth } = useWindowDimensions();

  // Mobile = native app OR browser on small screen (phone/tablet < 768px)
  const isMobileWeb  = Platform.OS === 'web' && screenWidth < 768;
  const isAdminWeb   = Platform.OS === 'web' && screenWidth >= 768 && (pathname?.startsWith('/admin') ?? false);
  const AUTH_PATHS   = ['/login', '/register', '/forgot-password', '/verify-otp', '/reset-password-otp'];
  const isAuthRoute  = Platform.OS === 'web' && AUTH_PATHS.some(p => pathname === p);

  useEffect(() => {
    Font.loadAsync({
      'Cinzel-Bold':   require('../assets/fonts/Cinzel-Bold.ttf'),
      'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    respRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const url = response?.notification?.request?.content?.data?.url;
        if (typeof url === 'string' && url.length > 0) router.push(url as any);
      } catch {}
    });
    return () => { try { respRef.current?.remove?.(); } catch {} };
  }, [router]);

  // ── 1. Native mobile OR mobile web browser ─────────────────────────────
  if (Platform.OS !== 'web' || isMobileWeb) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <AppStack />
            <AppAlertHost />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // ── 2. Desktop web: Admin CMS sidebar ──────────────────────────────────
  if (isAdminWeb) {
    return (
      <GestureHandlerRootView style={cms.root}>
        <AuthProvider>
          <StatusBar style="light" />
          <View style={cms.layout}>
            <AdminSidebar />
            <View style={cms.mainArea}>
              <AdminTopBar />
              <View style={cms.contentWrap}>
                <SafeAreaProvider style={{ flex: 1 }}>
                  <AppStack />
                </SafeAreaProvider>
              </View>
            </View>
          </View>
          <AppAlertHost />
        </AuthProvider>
      </GestureHandlerRootView>
    );
  }

  // ── 3. Desktop web: Public website layout ──────────────────────────────
  return (
    <GestureHandlerRootView style={w.root}>
      <AuthProvider>
        <StatusBar style="light" />

        {/* Announcement strip + Navbar — hidden on auth pages */}
        {!isAuthRoute && (
          <>
            <View style={w.topStrip}>
              <Text style={w.topStripText}>
                ✦  Book Sacred Poojas & Homams Online  •  Sri Pooja Homam  ✦
              </Text>
            </View>
            <WebNavbar />
          </>
        )}

        {/* Scrollable page body */}
        <View style={w.pageWrap}>
          <View style={w.pageBg} />
          <View style={w.appColumn}>
            <SafeAreaProvider style={{ flex: 1, backgroundColor: 'transparent' } as any}>
              <AppStack />
            </SafeAreaProvider>
          </View>
        </View>

        {/* Floating WhatsApp — fixed to viewport */}
        <TouchableOpacity
          style={w.waFloat}
          onPress={() => Linking.openURL('https://wa.me/918309067121?text=Namaste%2C%20I%20want%20to%20book%20a%20Pooja')}
        >
          <Ionicons name="logo-whatsapp" size={26} color="#fff" />
          <Text style={w.waFloatText}>Chat</Text>
        </TouchableOpacity>

        <AppAlertHost />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// ── CMS Styles ─────────────────────────────────────────────────────────────
const cms = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0302' } as any,
  layout: {
    flex: 1, flexDirection: 'row',
    ...(Platform.OS === 'web' ? { height: '100vh' } as any : {}),
  },
  sidebar: {
    width: 232, backgroundColor: '#140808', flexDirection: 'column', flexShrink: 0,
    ...(Platform.OS === 'web' ? { boxShadow: '4px 0 24px rgba(0,0,0,0.55)', overflowY: 'auto' } as any : {}),
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingTop: 22 },
  sidebarLogo: {
    width: 40, height: 40, borderRadius: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 2px rgba(212,175,55,0.45)' } as any : {}),
  },
  sidebarTitle: { color: '#D4AF37', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  sidebarSub: { color: 'rgba(212,175,55,0.42)', fontSize: 10, letterSpacing: 1.5, marginTop: 1 },
  divider: { height: 1, backgroundColor: 'rgba(212,175,55,0.1)', marginHorizontal: 16, marginVertical: 4 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 11,
    marginHorizontal: 8, borderRadius: 10, position: 'relative', marginBottom: 2,
  },
  navItemActive: { backgroundColor: 'rgba(212,175,55,0.08)' },
  activeBar: { position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, backgroundColor: '#D4AF37', borderRadius: 2 },
  navLabel: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  navLabelActive: { color: '#E8D5A3', fontWeight: '700' },
  sectionHead: { fontSize: 9, color: 'rgba(212,175,55,0.3)', fontWeight: '800', letterSpacing: 2 },
  sidebarFooter: { padding: 14, paddingBottom: 20 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 10,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)',
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#8B1515', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
  },
  avatarText: { color: '#D4AF37', fontSize: 15, fontWeight: '800' },
  userName: { color: '#fff', fontSize: 12, fontWeight: '700' },
  userRole: { color: 'rgba(212,175,55,0.55)', fontSize: 9, letterSpacing: 1, marginTop: 1 },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 4 },
  footerBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.38)', fontWeight: '500' },
  topBar: {
    height: 52, backgroundColor: '#1E0C0C', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, flexShrink: 0,
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.12)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.3)' } as any : {}),
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center' },
  breadHome: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  breadPage: { color: '#E8D5A3', fontSize: 13, fontWeight: '700' },
  cmsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
  },
  cmsBadgeText: { color: '#D4AF37', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  mainArea: {
    flex: 1, flexDirection: 'column', backgroundColor: '#F7F2EC',
    ...(Platform.OS === 'web' ? { overflow: 'hidden' } as any : {}),
  },
  contentWrap: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } as any : {}),
  },
});

// ── Website Styles ──────────────────────────────────────────────────────────
const MAROON = '#8B1515';
const DARK   = '#1C0505';
const GOLD   = '#D4AF37';

const w = StyleSheet.create({
  root: { flex: 1, flexDirection: 'column', backgroundColor: DARK } as any,

  // Announcement strip
  topStrip: { backgroundColor: '#2D0B00', paddingVertical: 7, alignItems: 'center' },
  topStripText: { color: GOLD, fontSize: 11, letterSpacing: 1.8, fontWeight: '600' } as any,

  // Navbar
  navbar: {
    backgroundColor: MAROON, flexShrink: 0,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 16px rgba(0,0,0,0.5)' } as any : {}),
  },
  navInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 10,
    ...(Platform.OS === 'web' ? { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any : {}),
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 24 },
  navLogo: {
    width: 42, height: 42, borderRadius: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 2px rgba(212,175,55,0.55)' } as any : {}),
  },
  navTelugu: { color: GOLD, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  navLatin:  { color: 'rgba(212,175,55,0.6)', fontSize: 8, letterSpacing: 3 },
  navLinks:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap' },
  navLink:   { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', paddingHorizontal: 11, paddingVertical: 8 },

  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(229,57,53,0.22)', paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(229,57,53,0.45)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5350' },
  liveLabel: { color: '#EF9A9A', fontSize: 13, fontWeight: '700' },

  adminPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', marginLeft: 4,
  },
  adminLabel: { color: '#D4AF37', fontSize: 13, fontWeight: '700' },

  // Auth area (right side of navbar)
  authRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  userDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  userDotText: { color: MAROON, fontSize: 12, fontWeight: '800' },
  userName: { color: '#fff', fontSize: 13, fontWeight: '600', maxWidth: 120 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  logoutText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(212,175,55,0.12)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
  },
  loginBtnText: { color: GOLD, fontSize: 13, fontWeight: '700' },

  navGoldLine: {
    height: 2,
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.55) 25%, rgba(212,175,55,0.55) 75%, transparent 100%)',
    } as any : { backgroundColor: 'rgba(212,175,55,0.35)' }),
  },

  // Page content
  pageWrap: {
    flex: 1, position: 'relative',
    ...(Platform.OS === 'web'
      ? { overflowY: 'auto', backgroundColor: '#0D0302' } as any
      : { overflow: 'hidden' }),
  } as any,
  pageBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    ...(Platform.OS === 'web' ? {
      background: 'radial-gradient(ellipse at 50% 40%, #4A0E0E 0%, #1C0505 50%, #0D0302 100%)',
      minHeight: '100%',
    } as any : { backgroundColor: '#2D0B00' }),
  } as any,
  appColumn: {
    flex: 1, width: '100%', zIndex: 1,
    ...(Platform.OS === 'web' ? { backgroundColor: 'transparent' } as any : {}),
  } as any,

  // Floating WhatsApp button — fixed to viewport so it stays visible while scrolling
  waFloat: {
    bottom: 28, right: 28, zIndex: 9999,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#25D366', paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 999,
    ...(Platform.OS === 'web'
      ? { position: 'fixed', boxShadow: '0 4px 20px rgba(37,211,102,0.45)', cursor: 'pointer' }
      : { position: 'absolute' }) as any,
  } as any,
  waFloatText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
