import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet, Image, Linking, TouchableOpacity, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '../src/context/AuthContext';
import { AppAlertHost } from '../src/components/AppAlert';

export default function RootLayout() {
  const router = useRouter();
  const respRef = useRef<any>(null);

  useEffect(() => {
    Font.loadAsync({
      'Cinzel-Bold': require('../assets/fonts/Cinzel-Bold.ttf'),
      'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    respRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const url = response?.notification?.request?.content?.data?.url;
        if (typeof url === 'string' && url.length > 0) {
          // @ts-ignore expo-router dynamic route
          router.push(url);
        }
      } catch {}
    });
    return () => {
      try { respRef.current?.remove?.(); } catch {}
    };
  }, [router]);

  const inner = (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
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
      <AppAlertHost />
    </AuthProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView style={w.root}>
        {/* ── Top announcement bar ── */}
        <View style={w.topBar}>
          <Text style={w.topBarText}>✦ Book Sacred Poojas & Homams Online • Sri Pooja Homam ✦</Text>
        </View>

        {/* ── Main Navigation Header ── */}
        <View style={w.header}>
          <View style={w.headerInner}>
            {/* Logo + Brand */}
            <TouchableOpacity onPress={() => router.push('/' as any)} style={w.brandBlock}>
              <Image source={require('../assets/images/icon.png')} style={w.headerLogo} />
              <View style={w.brandNames}>
                <Text style={w.headerTelugu}>శ్రీ పూజా హోమం</Text>
                <Text style={w.headerLatin}>SRI POOJA HOMAM</Text>
              </View>
            </TouchableOpacity>

            {/* Navigation links */}
            <View style={w.navLinks}>
              <TouchableOpacity onPress={() => router.push('/(tabs)' as any)} style={w.navItem}>
                <Text style={w.navText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/temples' as any)} style={w.navItem}>
                <Text style={w.navText}>Temples</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/live' as any)} style={w.navItem}>
                <View style={w.liveChip}>
                  <View style={w.liveDot} />
                  <Text style={w.liveText}>Live</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/bookings' as any)} style={w.navItem}>
                <Text style={w.navText}>My Bookings</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In button */}
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} style={w.signInBtn}>
              <Ionicons name="person-circle-outline" size={16} color="#D4AF37" />
              <Text style={w.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Gold border bottom */}
          <View style={w.headerBorder} />
        </View>

        {/* ── Page content (full width) ── */}
        <View style={w.pageContent}>
          <SafeAreaProvider style={{ flex: 1 }}>
            {inner}
          </SafeAreaProvider>
        </View>

        {/* ── Footer ── */}
        <View style={w.footer}>
          <View style={w.footerTop}>
            <Text style={w.footerDecor}>✦ ॥ ✦</Text>
          </View>
          <View style={w.footerInner}>
            {/* Brand column */}
            <View style={w.footerBrand}>
              <Image source={require('../assets/images/icon.png')} style={w.footerLogo} />
              <Text style={w.footerBrandName}>శ్రీ పూజా హోమం</Text>
              <Text style={w.footerTagline}>Divine devotion at your fingertips</Text>
            </View>

            {/* Quick links */}
            <View style={w.footerLinks}>
              <Text style={w.footerLinkHead}>Quick Links</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)' as any)}>
                <Text style={w.footerLink}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/temples' as any)}>
                <Text style={w.footerLink}>Temples</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                <Text style={w.footerLink}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/legal/privacy-policy' as any)}>
                <Text style={w.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            {/* Download column */}
            <View style={w.footerLinks}>
              <Text style={w.footerLinkHead}>Download App</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://play.google.com/store/search?q=sri+pooja+homam')}
                style={w.storeBtn}
              >
                <Ionicons name="logo-android" size={14} color="#A5D6A7" />
                <Text style={w.storeBtnText}>Google Play</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://apps.apple.com/search?term=sri+pooja+homam')}
                style={w.storeBtn}
              >
                <Ionicons name="logo-apple" size={14} color="#90CAF9" />
                <Text style={w.storeBtnText}>App Store</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom bar */}
          <View style={w.footerBottom}>
            <Text style={w.footerCopy}>© 2026 Aatreya Infotech Systems LLP • All rights reserved</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://aatreya.org')}>
              <Text style={w.devCredit}>
                Developed with ❤ by{' '}
                <Text style={w.devName}>Aatreya Infotech Systems LLP</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  // ── Native mobile (unchanged) ──
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {inner}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const MAROON = '#8B1515';
const DARK   = '#2D0B00';
const GOLD   = '#D4AF37';

const w = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F0E8' } as any,

  // ── Top announcement bar ──
  topBar: {
    backgroundColor: DARK,
    paddingVertical: 6,
    alignItems: 'center',
  },
  topBarText: {
    color: GOLD,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  } as any,

  // ── Header ──
  header: {
    backgroundColor: MAROON,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
    } as any : {}),
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    gap: 32,
    ...(Platform.OS === 'web' ? { maxWidth: 1200, alignSelf: 'center', width: '100%' } as any : {}),
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 0,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 0 2px rgba(212,175,55,0.6)',
    } as any : {}),
  },
  brandNames: { gap: 1 },
  headerTelugu: {
    color: GOLD,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerLatin: {
    color: 'rgba(212,175,55,0.65)',
    fontSize: 8,
    letterSpacing: 3,
    fontFamily: 'Cinzel-Bold',
  },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  navText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229,57,53,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.5)',
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#EF5350',
  },
  liveText: { color: '#EF9A9A', fontSize: 13, fontWeight: '700' },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  signInText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerBorder: {
    height: 2,
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6) 30%, rgba(212,175,55,0.6) 70%, transparent)',
    } as any : { backgroundColor: 'rgba(212,175,55,0.4)' }),
  },

  // ── Content ──
  pageContent: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },

  // ── Footer ──
  footer: {
    backgroundColor: DARK,
    ...(Platform.OS === 'web' ? {
      boxShadow: 'inset 0 2px 0 rgba(212,175,55,0.15)',
    } as any : {}),
  },
  footerTop: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  footerDecor: {
    color: 'rgba(212,175,55,0.4)',
    fontSize: 16,
    letterSpacing: 6,
  },
  footerInner: {
    flexDirection: 'row',
    gap: 40,
    paddingHorizontal: 40,
    paddingBottom: 24,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' ? { maxWidth: 1200, alignSelf: 'center', width: '100%' } as any : {}),
  },
  footerBrand: { flex: 1, minWidth: 180, gap: 8 },
  footerLogo: { width: 36, height: 36, borderRadius: 8 },
  footerBrandName: { color: GOLD, fontSize: 15, fontWeight: '800' },
  footerTagline: { color: 'rgba(253,251,247,0.4)', fontSize: 12 },
  footerLinks: { gap: 10, minWidth: 120 },
  footerLinkHead: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  footerLink: {
    color: 'rgba(253,251,247,0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  storeBtnText: {
    color: 'rgba(253,251,247,0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    ...(Platform.OS === 'web' ? { maxWidth: 1200, alignSelf: 'center', width: '100%' } as any : {}),
  },
  footerCopy: {
    color: 'rgba(212,175,55,0.25)',
    fontSize: 11,
  },
  devCredit: {
    color: 'rgba(253,251,247,0.3)',
    fontSize: 11,
  } as any,
  devName: {
    color: 'rgba(212,175,55,0.5)',
    fontWeight: '700',
  },
});
