import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
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
          // @ts-ignore
          router.push(url);
        }
      } catch {}
    });
    return () => { try { respRef.current?.remove?.(); } catch {} };
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

        {/* ── Top announcement strip ── */}
        <View style={w.topStrip}>
          <Text style={w.topStripText}>
            ✦  Book Sacred Poojas & Homams Online  •  Sri Pooja Homam  ✦
          </Text>
        </View>

        {/* ── Navigation header ── */}
        <View style={w.navbar}>
          <View style={w.navInner}>
            <TouchableOpacity onPress={() => router.push('/' as any)} style={w.brandRow}>
              <Image source={require('../assets/images/icon.png')} style={w.navLogo} />
              <View>
                <Text style={w.navTelugu}>శ్రీ పూజా హోమం</Text>
                <Text style={w.navLatin}>SRI POOJA HOMAM</Text>
              </View>
            </TouchableOpacity>

            <View style={w.navLinks}>
              <TouchableOpacity onPress={() => router.push('/(tabs)' as any)}>
                <Text style={w.navLink}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/temples' as any)}>
                <Text style={w.navLink}>Temples</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/bookings' as any)}>
                <Text style={w.navLink}>My Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/live' as any)} style={w.livePill}>
                <View style={w.liveDot} />
                <Text style={w.liveLabel}>Live</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} style={w.loginBtn}>
              <Ionicons name="person-circle-outline" size={17} color="#D4AF37" />
              <Text style={w.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
          <View style={w.navGoldLine} />
        </View>

        {/* ── Main content — centered column with dark temple bg on sides ── */}
        <View style={w.pageWrap}>
          {/* Dark temple background on wide screens */}
          <View style={w.pageBg} />
          {/* Centered app column */}
          <View style={w.appColumn}>
            <SafeAreaProvider style={{ flex: 1 }}>
              {inner}
            </SafeAreaProvider>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={w.footer}>
          <View style={w.footerRow}>
            {/* Brand */}
            <TouchableOpacity onPress={() => router.push('/' as any)} style={w.footerBrand}>
              <Image source={require('../assets/images/icon.png')} style={w.footerLogo} />
              <View>
                <Text style={w.footerTelugu}>శ్రీ పూజా హోమం</Text>
                <Text style={w.footerTagline}>Divine devotion at your fingertips</Text>
              </View>
            </TouchableOpacity>

            {/* Links */}
            <View style={w.footerLinks}>
              <Text style={w.footerHead}>Quick Links</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                <Text style={w.footerLink}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/temples' as any)}>
                <Text style={w.footerLink}>Temples</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/legal/privacy-policy' as any)}>
                <Text style={w.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            {/* Download */}
            <View style={w.footerLinks}>
              <Text style={w.footerHead}>Download App</Text>
              <TouchableOpacity
                style={w.storeBtn}
                onPress={() => Linking.openURL('https://play.google.com/store/search?q=sri+pooja+homam')}
              >
                <Ionicons name="logo-android" size={14} color="#A5D6A7" />
                <Text style={w.storeTxt}>Google Play</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={w.storeBtn}
                onPress={() => Linking.openURL('https://apps.apple.com/search?term=sri+pooja+homam')}
              >
                <Ionicons name="logo-apple" size={14} color="#90CAF9" />
                <Text style={w.storeTxt}>App Store</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={w.footerBottom}>
            <Text style={w.copyright}>© 2026 Aatreya Infotech Systems LLP • All rights reserved</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://aatreya.org')}>
              <Text style={w.devTxt}>
                Developed with ❤ by{' '}
                <Text style={w.devName}>Aatreya Infotech Systems LLP</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>{inner}</SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const MAROON = '#8B1515';
const DARK   = '#1C0505';
const GOLD   = '#D4AF37';

const w = StyleSheet.create({
  root: { flex: 1, flexDirection: 'column' } as any,

  // ── Top strip ──
  topStrip: { backgroundColor: '#2D0B00', paddingVertical: 7, alignItems: 'center' },
  topStripText: { color: GOLD, fontSize: 11, letterSpacing: 1.8, fontWeight: '600' } as any,

  // ── Navbar ──
  navbar: {
    backgroundColor: MAROON,
    flexShrink: 0,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 16px rgba(0,0,0,0.5)' } as any : {}),
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { maxWidth: 1100, alignSelf: 'center', width: '100%' } as any : {}),
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 32 },
  navLogo: {
    width: 42, height: 42, borderRadius: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 2px rgba(212,175,55,0.55)' } as any : {}),
  },
  navTelugu: { color: GOLD, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  navLatin: { color: 'rgba(212,175,55,0.6)', fontSize: 8, letterSpacing: 3, fontFamily: 'Cinzel-Bold' },

  navLinks: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  navLink: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 8 },

  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(229,57,53,0.22)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(229,57,53,0.45)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5350' },
  liveLabel: { color: '#EF9A9A', fontSize: 13, fontWeight: '700' },

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

  // ── Content ──
  pageWrap: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  } as any,

  pageBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    ...(Platform.OS === 'web' ? {
      background: 'radial-gradient(ellipse at 50% 0%, #5C1010 0%, #1C0505 55%, #0D0302 100%)',
    } as any : { backgroundColor: '#2D0B00' }),
  } as any,

  appColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    zIndex: 1,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 120px rgba(0,0,0,0.7)',
    } as any : {}),
  } as any,

  // ── Footer ──
  footer: {
    backgroundColor: DARK,
    flexShrink: 0,
    ...(Platform.OS === 'web' ? { boxShadow: 'inset 0 2px 0 rgba(212,175,55,0.12)' } as any : {}),
  },
  footerRow: {
    flexDirection: 'row',
    gap: 32,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 16,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' ? { maxWidth: 1100, alignSelf: 'center', width: '100%' } as any : {}),
  },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 160 },
  footerLogo: { width: 34, height: 34, borderRadius: 8 },
  footerTelugu: { color: GOLD, fontSize: 14, fontWeight: '800' },
  footerTagline: { color: 'rgba(253,251,247,0.38)', fontSize: 11, marginTop: 2 },

  footerLinks: { gap: 8, minWidth: 110 },
  footerHead: { color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  footerLink: { color: 'rgba(253,251,247,0.5)', fontSize: 13 },

  storeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeTxt: { color: 'rgba(253,251,247,0.5)', fontSize: 13 },

  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    ...(Platform.OS === 'web' ? { maxWidth: 1100, alignSelf: 'center', width: '100%' } as any : {}),
  },
  copyright: { color: 'rgba(212,175,55,0.22)', fontSize: 11 },
  devTxt: { color: 'rgba(253,251,247,0.28)', fontSize: 11 } as any,
  devName: { color: 'rgba(212,175,55,0.48)', fontWeight: '700' },
});
