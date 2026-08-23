import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Mirrored, biometric-only credential cache. Deliberately separate from
// AuthContext's primary `auth_token` (AsyncStorage) so enabling/disabling
// biometrics can never affect the normal session mechanism.
const ENABLED_FLAG_KEY = 'biometric_enabled';
const TOKEN_KEY = 'biometric_token';
const USER_KEY = 'biometric_user';

export async function getBiometricEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ENABLED_FLAG_KEY);
  return v === 'true';
}

export async function setBiometricEnabledFlag(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_FLAG_KEY, enabled ? 'true' : 'false');
}

export async function saveCredentials(token: string, user: Record<string, unknown>): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getCredentials(): Promise<{ token: string; user: Record<string, unknown> } | null> {
  const [token, userJson] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);
  if (!token || !userJson) return null;
  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
