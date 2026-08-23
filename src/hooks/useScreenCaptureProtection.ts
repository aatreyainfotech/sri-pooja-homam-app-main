import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { appToast } from '../components/AppAlert';

// Blocks screenshots/recording (Android also blanks the app-switcher preview
// for as long as this is active) on native only — expo-screen-capture has no
// native implementation on web and throws if called there. `active` lets a
// screen enable this only for part of its lifecycle (e.g. a payment step).
export function useScreenCaptureProtection(active = true, key = 'default') {
  useEffect(() => {
    if (Platform.OS === 'web' || !active) return;
    ScreenCapture.preventScreenCaptureAsync(key).catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync(key).catch(() => {});
    };
  }, [active, key]);
}

// iOS can't block screenshots outright, only detect them after the fact —
// show a one-line toast so users know payment/receipt screenshots aren't advised.
export function useScreenshotWarning(message: string) {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let subscription: { remove(): void } | undefined;
    try {
      subscription = ScreenCapture.addScreenshotListener(() => {
        appToast('Screenshot Detected', message, 'warning');
      });
    } catch {}
    return () => subscription?.remove();
  }, [message]);
}
