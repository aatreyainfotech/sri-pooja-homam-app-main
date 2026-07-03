import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
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
      ...(Platform.OS === 'web' ? { contentStyle: { backgroundColor: 'transparent' } } : {}),
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
      <Stack.Screen name="hotel-manager" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="accommodation/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="accommodation/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="destinations" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="travel-packages" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="yatra-pass" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="blogs" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="contact" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

// ── Mega Nav Data ──────────────────────────────────────────────────────────
const MEGA_NAV: Array<{
  label: string; route?: string; live?: boolean;
  children?: Array<{ label: string; sub: string; route: string }>;
}> = [
  {
    label: 'Destinations',
    children: [
      { label: 'Andhra Pradesh', sub: 'Tirupati · Srisailam', route: '/destinations?state=andhra-pradesh' },
      { label: 'Telangana', sub: 'Yadagirigutta · Dharmapuri', route: '/destinations?state=telangana' },
      { label: 'Tamil Nadu', sub: 'Madurai · Rameshwaram', route: '/destinations?state=tamil-nadu' },
      { label: 'Karnataka', sub: 'Udupi · Kukke Subramanya', route: '/destinations?state=karnataka' },
      { label: 'Kerala', sub: 'Guruvayur · Sabarimala', route: '/destinations?state=kerala' },
      { label: 'Maharashtra', sub: 'Shirdi · Pandharpur', route: '/destinations?state=maharashtra' },
      { label: 'Gujarat', sub: 'Dwarka · Somnath', route: '/destinations?state=gujarat' },
      { label: 'Uttarakhand', sub: 'Char Dham · Haridwar', route: '/destinations?state=uttarakhand' },
      { label: 'Uttar Pradesh', sub: 'Varanasi · Mathura', route: '/destinations?state=uttar-pradesh' },
    ],
  },
  {
    label: 'Accommodation',
    children: [
      { label: 'Dharamshala', sub: 'Pilgrimage dharamshalas', route: '/accommodation' },
      { label: 'Ashram', sub: 'Spiritual retreat stays', route: '/accommodation' },
      { label: 'Temple Guest House', sub: 'Temple-managed stays', route: '/accommodation' },
      { label: 'Hotels', sub: 'Comfortable hotel stays', route: '/accommodation' },
    ],
  },
  { label: 'Puja Booking', route: '/(tabs)/temples' },
  { label: 'Live Darshan', route: '/(tabs)/live', live: true },
  {
    label: 'More',
    children: [
      { label: 'Temple Information', sub: 'History, timings & routes', route: '/(tabs)/temples' },
      { label: 'Travel Packages', sub: 'Char Dham, Jyotirlinga & more', route: '/travel-packages' },
      { label: 'Yatra Pass', sub: 'Digital pilgrim pass', route: '/yatra-pass' },
      { label: 'Events & Festivals', sub: 'Temple events calendar', route: '/(tabs)/calendar' },
      { label: 'Blogs', sub: 'Stories, guides & travel tips', route: '/blogs' },
      { label: 'Contact Us', sub: 'Phone, WhatsApp & email', route: '/contact' },
    ],
  },
];

// ── Auth-aware Web Navbar (must be inside AuthProvider) ────────────────────
// ── Government / tourism-portal style utility bar (above the navbar) ────────
function UtilityBar() {
  const { width } = useWindowDimensions();
  const compact = width < 768;
  const SOCIALS: Array<{ icon: string; color: string; url: string }> = [
    { icon: 'logo-whatsapp',  color: '#25D366', url: 'https://wa.me/918309067121' },
    { icon: 'logo-facebook',  color: '#4C8BF5', url: 'https://facebook.com/sripoojahomam' },
    { icon: 'logo-instagram', color: '#F06292', url: 'https://instagram.com/sripoojahomam' },
    { icon: 'logo-youtube',   color: '#FF5252', url: 'https://youtube.com/@sripoojahomam' },
  ];
  return (
    <View style={w.utilBar}>
      <View style={w.utilInner}>
        <View style={w.utilLeft}>
          <TouchableOpacity style={w.utilItem} onPress={() => Linking.openURL('tel:+918644297366')}>
            <Ionicons name="call-outline" size={12} color={GOLD} />
            <Text style={w.utilText}>+91 86442 97366</Text>
          </TouchableOpacity>
          {!compact && (
            <TouchableOpacity style={w.utilItem} onPress={() => Linking.openURL('mailto:support@aatreya.org')}>
              <Ionicons name="mail-outline" size={12} color={GOLD} />
              <Text style={w.utilText}>support@aatreya.org</Text>
            </TouchableOpacity>
          )}
          {!compact && (
            <View style={w.utilItem}>
              <Ionicons name="time-outline" size={12} color={GOLD} />
              <Text style={w.utilText}>Open 24 / 7</Text>
            </View>
          )}
        </View>
        <View style={w.utilRight}>
          {!compact && <Text style={w.utilTagline}>Book Sacred Poojas & Homams Online</Text>}
          {SOCIALS.map((sm) => (
            <TouchableOpacity key={sm.icon} style={w.utilSocial} onPress={() => Linking.openURL(sm.url)}>
              <Ionicons name={sm.icon as any} size={14} color={sm.color} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

function WebNavbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isHotelMgr = user?.role === 'hotel_manager';
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const go = (route: string) => { setActiveMenu(null); setMobileOpen(false); router.push(route as any); };
  const activeItem = MEGA_NAV.find(n => n.label === activeMenu);

  // ── Mobile navbar: brand + hamburger + slide-down menu ──────────────────
  if (isMobile) {
    return (
      <View style={[w.navbar, { zIndex: 50 } as any]}>
        <View style={[w.navInner, { paddingHorizontal: 16 }]}>
          <TouchableOpacity onPress={() => go('/(tabs)')} style={[w.brandRow, { flex: 1, marginRight: 0 }]}>
            <Image source={require('../assets/images/icon.png')} style={w.navLogo} />
            <View>
              <Text style={w.navTelugu}>శ్రీ పూజా హోమం</Text>
              <Text style={w.navLatin}>SRI POOJA HOMAM</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMobileOpen(o => !o)} style={mNav.burger}>
            <Ionicons name={mobileOpen ? 'close' : 'menu'} size={26} color={GOLD} />
          </TouchableOpacity>
        </View>

        {mobileOpen && (
          <View style={mNav.sheet}>
            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={() => go('/(tabs)')} style={mNav.row}>
                <Ionicons name="home-outline" size={17} color={GOLD} />
                <Text style={mNav.rowText}>Home</Text>
              </TouchableOpacity>

              {MEGA_NAV.map((item) => (
                <View key={item.label}>
                  {item.children ? (
                    <>
                      <View style={mNav.sectionHead}>
                        {item.live && <View style={w.liveDotNav} />}
                        <Text style={mNav.sectionHeadText}>{item.label}</Text>
                      </View>
                      {item.children.map((child) => (
                        <TouchableOpacity key={child.label} onPress={() => go(child.route)} style={[mNav.row, { paddingLeft: 20 }]}>
                          <Ionicons name="chevron-forward" size={14} color="rgba(212,175,55,0.5)" />
                          <View style={{ flex: 1 }}>
                            <Text style={mNav.rowText}>{child.label}</Text>
                            <Text style={mNav.rowSub}>{child.sub}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => go(item.route!)} style={mNav.row}>
                      {item.live && <View style={w.liveDotNav} />}
                      <Text style={[mNav.rowText, item.live && { color: '#EF9A9A' }]}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {user && (
                <TouchableOpacity onPress={() => go('/(tabs)/bookings')} style={mNav.row}>
                  <Ionicons name="receipt-outline" size={17} color={GOLD} />
                  <Text style={mNav.rowText}>My Bookings</Text>
                </TouchableOpacity>
              )}
              {isAdmin && (
                <TouchableOpacity onPress={() => go('/admin')} style={mNav.row}>
                  <Ionicons name="shield-checkmark" size={17} color={GOLD} />
                  <Text style={mNav.rowText}>Admin CMS</Text>
                </TouchableOpacity>
              )}
              {isHotelMgr && (
                <TouchableOpacity onPress={() => go('/hotel-manager')} style={mNav.row}>
                  <Ionicons name="business-outline" size={17} color={GOLD} />
                  <Text style={mNav.rowText}>My Hotel</Text>
                </TouchableOpacity>
              )}

              <View style={mNav.divider} />
              {user ? (
                <TouchableOpacity
                  onPress={async () => { setMobileOpen(false); await logout(); router.replace('/(auth)/login' as any); }}
                  style={[mNav.row]}
                >
                  <Ionicons name="log-out-outline" size={17} color="#EF9A9A" />
                  <Text style={[mNav.rowText, { color: '#EF9A9A' }]}>Sign Out ({user.full_name})</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => go('/(auth)/login')} style={mNav.signInBtn}>
                  <Ionicons name="person-circle-outline" size={18} color={MAROON} />
                  <Text style={mNav.signInText}>Sign In</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        <View style={w.navGoldLine} />
      </View>
    );
  }

  return (
    <>
      {activeMenu !== null && (
        <TouchableOpacity
          onPress={() => setActiveMenu(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 } as any}
        />
      )}

      <View style={[w.navbar, { zIndex: 50 } as any]}>
        <View style={w.navInner}>
          {/* Brand */}
          <TouchableOpacity onPress={() => go('/(tabs)')} style={w.brandRow}>
            <Image source={require('../assets/images/icon.png')} style={w.navLogo} />
            <View>
              <Text style={w.navTelugu}>శ్రీ పూజా హోమం</Text>
              <Text style={w.navLatin}>SRI POOJA HOMAM</Text>
            </View>
          </TouchableOpacity>

          {/* Nav links */}
          <View style={w.navLinks}>
            <TouchableOpacity onPress={() => go('/(tabs)')} style={w.navLinkWrap}>
              <Text style={w.navLink}>Home</Text>
            </TouchableOpacity>
            {MEGA_NAV.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => item.children ? setActiveMenu(activeMenu === item.label ? null : item.label) : go(item.route!)}
                style={[w.navLinkWrap, activeMenu === item.label && w.navLinkActive]}
              >
                {item.live && <View style={w.liveDotNav} />}
                <Text style={[
                  w.navLink,
                  item.live && { color: '#EF9A9A' },
                  activeMenu === item.label && { color: GOLD },
                ]}>
                  {item.label}
                </Text>
                {item.children && (
                  <Ionicons
                    name={activeMenu === item.label ? 'chevron-up' : 'chevron-down'}
                    size={11}
                    color={activeMenu === item.label ? GOLD : 'rgba(255,255,255,0.45)'}
                  />
                )}
              </TouchableOpacity>
            ))}
            {user && (
              <TouchableOpacity onPress={() => go('/(tabs)/bookings')} style={w.navLinkWrap}>
                <Text style={w.navLink}>My Bookings</Text>
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity onPress={() => go('/admin')} style={w.adminPill}>
                <Ionicons name="shield-checkmark" size={13} color="#C9922A" />
                <Text style={w.adminLabel}>Admin CMS</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Auth area */}
          {user ? (
            <View style={w.authRow}>
              {isHotelMgr && (
                <TouchableOpacity onPress={() => go('/hotel-manager')} style={w.adminPill}>
                  <Ionicons name="business-outline" size={13} color="#C9922A" />
                  <Text style={w.adminLabel}>My Hotel</Text>
                </TouchableOpacity>
              )}
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
            <TouchableOpacity onPress={() => go('/(auth)/login')} style={w.loginBtn}>
              <Ionicons name="person-circle-outline" size={17} color="#C9922A" />
              <Text style={w.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Mega Dropdown Panel ── */}
        {activeMenu && activeItem?.children && (
          <View style={w.megaPanel}>
            <View style={w.megaInner}>
              {activeItem.label === 'Destinations' ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {activeItem.children.map((child) => (
                    <TouchableOpacity key={child.label} onPress={() => go(child.route)} style={w.megaDestItem}>
                      <View style={w.megaDestDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={w.megaItemLabel}>{child.label}</Text>
                        <Text style={w.megaItemSub}>{child.sub}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={12} color="rgba(212,175,55,0.45)" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {activeItem.children.map((child) => (
                    <TouchableOpacity key={child.label} onPress={() => go(child.route)} style={w.megaItem}>
                      <View>
                        <Text style={w.megaItemLabel}>{child.label}</Text>
                        <Text style={w.megaItemSub}>{child.sub}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="rgba(212,175,55,0.35)" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={w.navGoldLine} />
      </View>
    </>
  );
}

// ── Admin CMS Sidebar ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',         icon: 'grid-outline',         route: '/admin' },
  { label: 'Temples',           icon: 'business-outline',     route: '/admin/temples' },
  { label: 'Poojas',            icon: 'flower-outline',       route: '/admin/poojas' },
  { label: 'Live Streams',      icon: 'radio-outline',        route: '/admin/live-streams' },
  { label: 'Videos',            icon: 'videocam-outline',     route: '/admin/videos' },
  { label: 'Bookings',          icon: 'receipt-outline',      route: '/admin/bookings' },
  { label: 'Add Pujari',        icon: 'person-add-outline',   route: '/admin/create-pujari' },
  { label: 'Pujari Stats',      icon: 'bar-chart-outline',    route: '/admin/pujari-stats' },
  { label: 'Payouts',           icon: 'send-outline',         route: '/admin/payouts' },
  { label: 'Accommodation',     icon: 'bed-outline',          route: '/admin/properties' },
  { label: 'Platform Settings', icon: 'settings-outline',     route: '/admin/settings' },
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
                color={active ? '#C9922A' : 'rgba(255,255,255,0.45)'}
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
        <Ionicons name="shield-checkmark" size={13} color="#C9922A" />
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

  // Mobile web = browser on a small screen (phone/tablet < 768px)
  const isAdminWeb   = Platform.OS === 'web' && screenWidth >= 768 && (pathname?.startsWith('/admin') ?? false);
  const AUTH_PATHS   = ['/login', '/register', '/forgot-password', '/verify-otp', '/reset-password-otp'];
  const isAuthRoute  = Platform.OS === 'web' && AUTH_PATHS.some(p => pathname === p);

  useEffect(() => {
    Font.loadAsync({
      'Cinzel-Bold':   require('../assets/fonts/Cinzel-Bold.ttf'),
      'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    }).catch(() => {});
  }, []);

  // Keep the browser tab title set — Expo Router clears document.title on web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const TITLE = 'Sri Pooja Homam';
    if (document.title !== TITLE) document.title = TITLE;
  }, [pathname]);

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

  // ── 1. Native mobile app only (bottom tab bar) ─────────────────────────
  // Mobile web browsers now get the public website layout (below) instead of
  // the app tab bar, so every visitor sees the same responsive website.
  if (Platform.OS !== 'web') {
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
            <UtilityBar />
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
  root: { flex: 1, backgroundColor: '#0D0807' } as any,
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
  sidebarTitle: { color: '#C9922A', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  sidebarSub: { color: 'rgba(212,175,55,0.42)', fontSize: 10, letterSpacing: 1.5, marginTop: 1 },
  divider: { height: 1, backgroundColor: 'rgba(212,175,55,0.1)', marginHorizontal: 16, marginVertical: 4 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 11,
    marginHorizontal: 8, borderRadius: 10, position: 'relative', marginBottom: 2,
  },
  navItemActive: { backgroundColor: 'rgba(212,175,55,0.08)' },
  activeBar: { position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, backgroundColor: '#C9922A', borderRadius: 2 },
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
  avatarText: { color: '#C9922A', fontSize: 15, fontWeight: '800' },
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
  cmsBadgeText: { color: '#C9922A', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
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
const MAROON = '#7A3020';   // warm brownish-red (was blood-red #8B1515)
const DARK   = '#1A0C07';   // warm near-black
const GOLD   = '#C9922A';

const w = StyleSheet.create({
  root: { flex: 1, flexDirection: 'column', backgroundColor: DARK } as any,

  // Announcement strip
  topStrip: { backgroundColor: '#3D1A0A', paddingVertical: 7, alignItems: 'center' },
  topStripText: { color: GOLD, fontSize: 11, letterSpacing: 1.8, fontWeight: '600' } as any,

  // Government / tourism-portal style utility bar
  utilBar: {
    backgroundColor: '#2A0F06',
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,146,42,0.18)',
  },
  utilInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', rowGap: 4,
    paddingHorizontal: 16, paddingVertical: 6,
    ...(Platform.OS === 'web' ? { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any : {}),
  },
  utilLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  utilRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  utilItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  utilText: { color: 'rgba(253,251,247,0.72)', fontSize: 11.5, fontWeight: '500' } as any,
  utilTagline: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginRight: 6 } as any,
  utilSocial: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(201,146,42,0.22)',
  },

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

  // Mega nav additions
  navLinkWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 7 },
  navLinkActive: { backgroundColor: 'rgba(212,175,55,0.1)' },
  liveDotNav: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5350' },
  megaPanel: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: '#1C0D07',
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    borderBottomWidth: 1, borderColor: 'rgba(212,175,55,0.15)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 16px 48px rgba(0,0,0,0.65)' } as any : {}),
  } as any,
  megaInner: { maxWidth: 1280, alignSelf: 'center', width: '100%', paddingHorizontal: 28, paddingVertical: 24 },
  megaDestItem: {
    width: '33%', flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
  },
  megaDestDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9922A', flexShrink: 0 },
  megaItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, minWidth: 260,
  },
  megaItemLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  megaItemSub: { color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2 },

  adminPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', marginLeft: 4,
  },
  adminLabel: { color: '#C9922A', fontSize: 13, fontWeight: '700' },

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
      backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.55) 25%, rgba(212,175,55,0.55) 75%, transparent 100%)',
    } as any : { backgroundColor: 'rgba(212,175,55,0.35)' }),
  },

  // Page content
  pageWrap: {
    flex: 1, position: 'relative',
    ...(Platform.OS === 'web'
      ? { overflowY: 'auto', backgroundColor: '#0D0807' } as any
      : { overflow: 'hidden' }),
  } as any,
  pageBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    ...(Platform.OS === 'web' ? {
      background: 'radial-gradient(ellipse at 50% 40%, #5A2010 0%, #1C0C07 50%, #0D0807 100%)',
      minHeight: '100%',
    } as any : { backgroundColor: '#3D1A0A' }),
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

// ── Mobile web navbar (hamburger menu) styles ──────────────────────────────
const mNav = StyleSheet.create({
  burger: {
    width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
  },
  sheet: {
    backgroundColor: '#1C0D07',
    borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.18)',
    paddingVertical: 8, paddingHorizontal: 12,
    ...(Platform.OS === 'web' ? { boxShadow: '0 16px 40px rgba(0,0,0,0.6)' } as any : {}),
  } as any,
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10,
  },
  rowText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginTop: 1 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingTop: 12, paddingBottom: 4, paddingHorizontal: 12,
  },
  sectionHeadText: { color: GOLD, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(212,175,55,0.15)', marginVertical: 8 },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GOLD, paddingVertical: 13, borderRadius: 12, marginTop: 4, marginBottom: 6,
  },
  signInText: { color: MAROON, fontSize: 15, fontWeight: '800' },
});
