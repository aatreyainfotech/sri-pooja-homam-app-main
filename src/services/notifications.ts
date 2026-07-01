import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Configure how foreground notifications are displayed (native only)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {}
}

/**
 * Register device for push notifications and return the Expo push token.
 * Returns undefined on web/simulator or when permissions are denied.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Push notifications are not supported on the web in this app
  if (Platform.OS === 'web') return undefined;

  try {
    // Android requires a notification channel before prompting for permissions on 13+
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C9922A',
        sound: 'default',
      });
    }

    if (!Device.isDevice) {
      // Simulators/emulators cannot receive push
      return undefined;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return undefined;

    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId ||
      undefined;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenResponse.data;
  } catch (e) {
    console.warn('[push] registration failed', e);
    return undefined;
  }
}

export async function savePushTokenOnBackend(token: string, platform: string) {
  try {
    await api.post('/users/push-token', { token, platform });
  } catch (e) {
    console.warn('[push] failed to save token on backend', e);
  }
}

export async function removePushTokenFromBackend(token: string) {
  try {
    await api.delete(`/users/push-token`, { data: { token } });
  } catch (e) {
    // best-effort
  }
}
