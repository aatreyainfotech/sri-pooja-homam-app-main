import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  }

  const secureToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (secureToken) return secureToken;

  // One-time migration path from old AsyncStorage storage.
  const legacyToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!legacyToken) return null;

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  return legacyToken;
}

export async function setAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
  ]);
}
