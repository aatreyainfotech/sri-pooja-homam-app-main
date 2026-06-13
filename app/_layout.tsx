import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '../src/context/AuthContext';
import { AppAlertHost } from '../src/components/AppAlert';

export default function RootLayout() {
  const router = useRouter();
  const respRef = useRef<any>(null);
  const [clockTime, setClockTime] = useState(() => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    Font.loadAsync({
      'Cinzel-Bold': require('../assets/fonts/Cinzel-Bold.ttf'),
      'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const t = setInterval(() => {
      const d = new Date();
      setClockTime(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(t);
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
      <GestureHandlerRootView style={webStyles.root}>
        {/* Rich traditional background */}
        <View style={webStyles.gradBg} />
        {/* Om watermark */}
        <Text style={webStyles.omWatermark} aria-hidden="true">ॐ</Text>
        {/* Decorative lotus watermarks */}
        <Text style={webStyles.lotusLeft} aria-hidden="true">❀</Text>
        <Text style={webStyles.lotusRight} aria-hidden="true">❀</Text>

        {/* Traditional top border */}
        <Text style={webStyles.topBorder}>✦ ॥ శ్రీ గణేశాయ నమః ॥ ✦</Text>

        {/* Desktop brand header */}
        <View style={webStyles.brandRow}>
          <Image source={require('../assets/images/icon.png')} style={webStyles.brandIcon} />
          <View style={webStyles.brandText}>
            <Text style={webStyles.brandTelugu}>శ్రీ పూజా హోమం</Text>
            <Text style={webStyles.brandLatin}>SRI POOJA HOMAM</Text>
          </View>
        </View>
        <Text style={webStyles.brandTagline}>✦ Divine devotion at your fingertips ✦</Text>

        {/* Gold divider */}
        <View style={webStyles.goldDivider}>
          <View style={webStyles.dividerLine} />
          <Text style={webStyles.dividerDot}>❋</Text>
          <View style={webStyles.dividerLine} />
        </View>

        {/* Phone device */}
        <View style={webStyles.deviceBezel}>
          {/* Decorative side buttons */}
          <View style={webStyles.volBtn1} />
          <View style={webStyles.volBtn2} />
          <View style={webStyles.powerBtn} />

          {/* Phone screen */}
          <View style={webStyles.deviceScreen}>
            {/* Fake status bar */}
            <View style={webStyles.statusBar}>
              <Text style={webStyles.sbTime}>{clockTime}</Text>
              <View style={webStyles.sbCenter}>
                <View style={webStyles.sbCamDot} />
              </View>
              <View style={webStyles.sbRight}>
                <Ionicons name="wifi" size={12} color="rgba(255,255,255,0.8)" />
                <Ionicons name="battery-full" size={14} color="rgba(255,255,255,0.8)" />
              </View>
            </View>

            {/* App content */}
            <View style={webStyles.appArea}>
              <SafeAreaProvider>
                {inner}
              </SafeAreaProvider>
            </View>

            {/* Home indicator */}
            <View style={webStyles.homeArea}>
              <View style={webStyles.homePill} />
            </View>
          </View>
        </View>

        {/* Store links */}
        <View style={webStyles.storeRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://play.google.com/store/search?q=sri+pooja+homam')}
            style={webStyles.storeBtn}
          >
            <Ionicons name="logo-android" size={14} color="#A5D6A7" />
            <Text style={webStyles.storeBtnText}>Google Play</Text>
          </TouchableOpacity>
          <View style={webStyles.storeDot} />
          <TouchableOpacity
            onPress={() => Linking.openURL('https://apps.apple.com/search?term=sri+pooja+homam')}
            style={webStyles.storeBtn}
          >
            <Ionicons name="logo-apple" size={14} color="#90CAF9" />
            <Text style={webStyles.storeBtnText}>App Store</Text>
          </TouchableOpacity>
        </View>

        {/* Developer footer */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://aatreya.org')}
          style={webStyles.devRow}
        >
          <Text style={webStyles.devCredit}>
            Developed with ❤ by{' '}
            <Text style={webStyles.devName}>Aatreya Infotech Systems LLP</Text>
          </Text>
        </TouchableOpacity>
        <Text style={webStyles.footer}>© 2026 Aatreya Infotech Systems LLP • All rights reserved</Text>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {inner}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0D0504',
    paddingTop: 14,
    paddingBottom: 8,
  } as any,

  gradBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    ...(Platform.OS === 'web' ? {
      background: [
        'radial-gradient(ellipse at 20% 0%, #5C1A00 0%, #2D0B00 30%, #0D0302 65%, #080101 100%)',
      ].join(', '),
    } as any : { backgroundColor: '#0D0504' }),
  },

  omWatermark: {
    position: 'absolute',
    top: '8%',
    right: '2%',
    color: 'rgba(212,175,55,0.035)',
    fontSize: 300,
    lineHeight: 300,
    ...(Platform.OS === 'web' ? {
      userSelect: 'none',
      pointerEvents: 'none',
    } as any : {}),
  } as any,

  lotusLeft: {
    position: 'absolute',
    top: '30%',
    left: '2%',
    color: 'rgba(212,175,55,0.06)',
    fontSize: 120,
    lineHeight: 120,
    ...(Platform.OS === 'web' ? { userSelect: 'none', pointerEvents: 'none' } as any : {}),
  } as any,
  lotusRight: {
    position: 'absolute',
    top: '55%',
    right: '2%',
    color: 'rgba(212,175,55,0.06)',
    fontSize: 120,
    lineHeight: 120,
    ...(Platform.OS === 'web' ? { userSelect: 'none', pointerEvents: 'none' } as any : {}),
  } as any,

  topBorder: {
    color: 'rgba(212,175,55,0.5)',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
    zIndex: 1,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  } as any,

  // ─── Brand header ──────────────────────────────
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
    zIndex: 1,
  },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 0 2px rgba(212,175,55,0.5), 0 6px 20px rgba(212,175,55,0.3)',
    } as any : {}),
  },
  brandText: {
    gap: 3,
  },
  brandTelugu: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  brandLatin: {
    color: 'rgba(212,175,55,0.7)',
    fontSize: 9,
    letterSpacing: 4,
    fontFamily: 'Cinzel-Bold',
    lineHeight: 14,
  },
  brandTagline: {
    color: 'rgba(212,175,55,0.45)',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'DMSans-Regular',
    marginBottom: 8,
    zIndex: 1,
  },

  // Gold divider
  goldDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    zIndex: 1,
    width: 320,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.25)',
  },
  dividerDot: {
    color: 'rgba(212,175,55,0.6)',
    fontSize: 14,
  },

  // ─── Phone device ──────────────────────────────
  deviceBezel: {
    zIndex: 1,
    width: 390,
    flex: 1,
    maxHeight: 820,
    minHeight: 580,
    borderRadius: 52,
    backgroundColor: '#1C1C1E',
    padding: 8,
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      boxShadow: [
        '0 60px 140px rgba(0,0,0,0.99)',
        '0 0 0 1.5px rgba(212,175,55,0.5)',
        '0 0 0 10px rgba(212,175,55,0.04)',
        'inset 0 0 0 1px rgba(255,255,255,0.06)',
        'inset 0 2px 4px rgba(255,255,255,0.03)',
      ].join(', '),
    } as any : {}),
  },

  // Side buttons
  volBtn1: {
    position: 'absolute',
    left: -3,
    top: 100,
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#2C2C2E',
    zIndex: 5,
  } as any,
  volBtn2: {
    position: 'absolute',
    left: -3,
    top: 148,
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#2C2C2E',
    zIndex: 5,
  } as any,
  powerBtn: {
    position: 'absolute',
    right: -3,
    top: 130,
    width: 3,
    height: 56,
    borderRadius: 2,
    backgroundColor: '#2C2C2E',
    zIndex: 5,
  } as any,

  deviceScreen: {
    flex: 1,
    borderRadius: 46,
    overflow: 'hidden',
    backgroundColor: '#FDFBF7',
  },

  // Status bar (fake notch area)
  statusBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#0D0504',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? { pointerEvents: 'none' } as any : {}),
  } as any,
  sbTime: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sbCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sbCamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2A2A2E',
    borderWidth: 1.5,
    borderColor: '#3D3D42',
  },
  sbRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },

  // App content area
  appArea: {
    flex: 1,
  },

  // Home indicator
  homeArea: {
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,2,1,0.88)',
  },
  homePill: {
    width: 120,
    height: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  // Store links row
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    zIndex: 1,
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    ...(Platform.OS === 'web' ? {
      border: '1px solid rgba(212,175,55,0.2)',
    } as any : { borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }),
  },
  storeBtnText: {
    color: 'rgba(212,175,55,0.55)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'DMSans-Regular',
  },
  storeDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(212,175,55,0.25)',
  },

  // Developer credit
  devRow: {
    marginTop: 6,
    zIndex: 1,
  },
  devCredit: {
    color: 'rgba(253,251,247,0.3)',
    fontSize: 11,
    letterSpacing: 0.5,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  } as any,
  devName: {
    color: 'rgba(212,175,55,0.5)',
    fontWeight: '700',
  },

  // Footer
  footer: {
    color: 'rgba(212,175,55,0.18)',
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 0.8,
    zIndex: 1,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  } as any,
});
