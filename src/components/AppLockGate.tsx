import { ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as ScreenCapture from 'expo-screen-capture';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';
import * as biometrics from '../services/biometrics';
import * as secureCredentials from '../services/secureCredentials';
import Button from './ui/Button';

const ROOTED_WARNING_SHOWN_KEY = 'rooted_warning_shown';

export default function AppLockGate({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') return <>{children}</>;
  return <NativeAppLockGate>{children}</NativeAppLockGate>;
}

function NativeAppLockGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { biometricEnabled, logout, user } = useAuth();
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const appState = useRef(AppState.currentState);
  const biometricEnabledRef = useRef(biometricEnabled);

  useEffect(() => { biometricEnabledRef.current = biometricEnabled; }, [biometricEnabled]);

  // Cold-start check, read directly (not via context) so this can't race
  // AuthContext's own async restore — the app must never flash unlocked
  // content for a user who has biometric lock enabled.
  useEffect(() => {
    secureCredentials.getBiometricEnabled().then((enabled) => {
      setLocked(enabled);
      setReady(true);
    });
  }, []);

  // One-shot native security setup: iOS app-switcher blur + rooted-device warning.
  // Android app-switcher protection comes from usePreventScreenCapture() on the
  // sensitive screens themselves (FLAG_SECURE also blanks the recents preview).
  useEffect(() => {
    if (Platform.OS === 'ios') {
      ScreenCapture.enableAppSwitcherProtectionAsync().catch(() => {});
    }
    (async () => {
      try {
        const alreadyShown = await AsyncStorage.getItem(ROOTED_WARNING_SHOWN_KEY);
        if (alreadyShown) return;
        const rooted = await Device.isRootedExperimentalAsync();
        if (rooted) {
          await AsyncStorage.setItem(ROOTED_WARNING_SHOWN_KEY, 'true');
          Alert.alert(
            'Security Notice',
            'This device appears to be rooted or jailbroken, which can weaken the security of any app installed on it. You can continue using the app, but please be extra cautious with payments.'
          );
        }
      } catch {}
    })();
  }, []);

  // Re-lock the instant the app leaves the foreground, if biometric lock is on.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;
      if (prev === 'active' && next !== 'active' && biometricEnabledRef.current) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const attemptUnlock = async () => {
    setAuthenticating(true);
    try {
      const ok = await biometrics.authenticate('Unlock Sri Pooja Homam');
      if (ok) setLocked(false);
    } finally {
      setAuthenticating(false);
    }
  };

  // Auto-fire one challenge whenever we enter the locked state.
  useEffect(() => {
    if (ready && locked && biometricEnabled) attemptUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, locked]);

  const signOutInstead = async () => {
    setLocked(false);
    await logout();
    router.replace('/(auth)/login');
  };

  if (!ready) return null;
  if (!biometricEnabled || !locked) return <>{children}</>;

  return (
    <View style={{ flex: 1 }}>
      {children}
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject}>
        <SafeAreaView style={styles.overlay}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={30} color={theme.colors.secondary} />
          </View>
          <Text style={styles.title}>App Locked</Text>
          <Text style={styles.sub}>
            Unlock with biometrics to continue{user?.full_name ? `, ${user.full_name}` : ''}.
          </Text>
          <Button
            testID="applock-unlock-btn"
            title="Unlock"
            icon="finger-print-outline"
            variant="primary"
            size="lg"
            loading={authenticating}
            onPress={attemptUnlock}
            style={{ marginTop: theme.spacing.xl, minWidth: 220 }}
          />
          <TouchableOpacity testID="applock-signout-btn" onPress={signOutInstead} style={{ marginTop: theme.spacing.lg }}>
            <Text style={styles.signOutText}>Sign out instead</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: { ...theme.typography.h2, color: '#fff' },
  sub: {
    ...theme.typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  signOutText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
});
