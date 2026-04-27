import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../src/context/AuthContext';
import { AppAlertHost } from '../src/components/AppAlert';

export default function RootLayout() {
  const router = useRouter();
  const respRef = useRef<any>(null);

  useEffect(() => {
    // Handle notification tap — deep link to the URL inside notification data
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
          </Stack>
          <AppAlertHost />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
