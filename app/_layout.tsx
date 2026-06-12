import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet, Image } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
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
      <GestureHandlerRootView style={webStyles.root}>
        {/* Rich gradient background */}
        <View style={webStyles.gradBg} />

        {/* Om watermark */}
        <Text style={webStyles.omWatermark} aria-hidden="true">ॐ</Text>

        {/* Desktop top branding */}
        <View style={webStyles.desktopTop}>
          <Image
            source={require('../assets/images/icon.png')}
            style={webStyles.desktopLogo}
          />
          <Text style={webStyles.desktopTelugu}>శ్రీ పూజా హోమం</Text>
          <Text style={webStyles.desktopLatin}>SRI POOJA HOMAM</Text>
          <Text style={webStyles.desktopTagline}>Divine devotion at your fingertips</Text>
        </View>

        {/* Phone frame */}
        <View style={webStyles.frameWrap}>
          <View style={webStyles.phoneFrame}>
            <SafeAreaProvider>
              {inner}
            </SafeAreaProvider>
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
    justifyContent: 'center',
    backgroundColor: '#0D0504',
  } as any,

  gradBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    ...(Platform.OS === 'web' ? {
      background: 'radial-gradient(ellipse at 30% 20%, #3D1010 0%, #1a0a09 40%, #0D0504 100%)',
    } as any : { backgroundColor: '#0D0504' }),
  },

  omWatermark: {
    position: 'absolute',
    color: 'rgba(212,175,55,0.05)',
    fontSize: 400,
    lineHeight: 400,
    userSelect: 'none',
    ...(Platform.OS === 'web' ? {
      pointerEvents: 'none',
      fontWeight: '400',
    } as any : {}),
  } as any,

  desktopTop: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },

  desktopLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 12,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
    } as any : {}),
  },

  desktopTelugu: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },

  desktopLatin: {
    color: 'rgba(212,175,55,0.75)',
    fontSize: 11,
    letterSpacing: 4,
    marginTop: 4,
    fontFamily: 'Cinzel-Bold',
  },

  desktopTagline: {
    color: 'rgba(253,251,247,0.35)',
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 1.5,
    fontFamily: 'DMSans-Regular',
  },

  frameWrap: {
    zIndex: 1,
    alignItems: 'center',
    width: '100%',
    ...(Platform.OS === 'web' ? {
      maxWidth: 430,
      flex: 1,
      maxHeight: 800,
    } as any : { flex: 1 }),
  },

  phoneFrame: {
    width: '100%',
    flex: 1,
    backgroundColor: '#FDFBF7',
    overflow: 'hidden',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? {
      borderRadius: 12,
      boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(212,175,55,0.18), 0 0 40px rgba(212,175,55,0.06)',
    } as any : {}),
  },

  footer: {
    color: 'rgba(212,175,55,0.25)',
    fontSize: 11,
    marginTop: 16,
    letterSpacing: 1,
    zIndex: 1,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  } as any,
});
