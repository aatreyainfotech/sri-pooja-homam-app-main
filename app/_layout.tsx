import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet, Image } from 'react-native';
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
        {/* Gradient background */}
        <View style={webStyles.gradBg} />
        {/* Om watermark */}
        <Text style={webStyles.omWatermark} aria-hidden="true">ॐ</Text>

        {/* Desktop brand header */}
        <View style={webStyles.brandRow}>
          <Image source={require('../assets/images/icon.png')} style={webStyles.brandIcon} />
          <View style={webStyles.brandText}>
            <Text style={webStyles.brandTelugu}>శ్రీ పూజా హోమం</Text>
            <Text style={webStyles.brandLatin}>SRI POOJA HOMAM</Text>
          </View>
        </View>
        <Text style={webStyles.brandTagline}>Divine devotion at your fingertips</Text>

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

        {/* Footer */}
        <Text style={webStyles.footer}>
          © 2026 Aatreya Infotech Systems LLP • All rights reserved
        </Text>
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
    paddingTop: 18,
    paddingBottom: 10,
  } as any,

  gradBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    ...(Platform.OS === 'web' ? {
      background: 'radial-gradient(ellipse at 25% 15%, #4A1010 0%, #1a0a09 45%, #0A0302 100%)',
    } as any : { backgroundColor: '#0D0504' }),
  },

  omWatermark: {
    position: 'absolute',
    top: '5%',
    right: '3%',
    color: 'rgba(212,175,55,0.04)',
    fontSize: 340,
    lineHeight: 340,
    ...(Platform.OS === 'web' ? {
      userSelect: 'none',
      pointerEvents: 'none',
    } as any : {}),
  } as any,

  // ─── Brand header ──────────────────────────────
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    zIndex: 1,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
    } as any : {}),
  },
  brandText: {
    gap: 2,
  },
  brandTelugu: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  brandLatin: {
    color: 'rgba(212,175,55,0.65)',
    fontSize: 9,
    letterSpacing: 3.5,
    fontFamily: 'Cinzel-Bold',
    lineHeight: 14,
  },
  brandTagline: {
    color: 'rgba(253,251,247,0.28)',
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: 'DMSans-Regular',
    marginBottom: 14,
    zIndex: 1,
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
        '0 50px 130px rgba(0,0,0,0.98)',
        '0 0 0 1.5px rgba(212,175,55,0.45)',
        '0 0 0 10px rgba(212,175,55,0.03)',
        'inset 0 0 0 1px rgba(255,255,255,0.07)',
        'inset 0 2px 4px rgba(255,255,255,0.04)',
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

  // Footer
  footer: {
    color: 'rgba(212,175,55,0.2)',
    fontSize: 10,
    marginTop: 12,
    letterSpacing: 0.8,
    zIndex: 1,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  } as any,
});
