/**
 * Agora Live Broadcasting service — Expo-safe loader.
 *
 * IMPORTANT: `react-native-agora` is a native module that WILL NOT work in:
 *   - Web preview (no WebRTC bindings here)
 *   - Expo Go (native module is not linked)
 *
 * It WILL work in:
 *   - A development build via `expo-dev-client` (`eas build --profile development`)
 *   - A production build (`eas build --profile production`)
 *
 * We therefore load the SDK with a guarded dynamic require so the rest of the
 * app (bundler, web build, Expo Go) keeps working even when the native module
 * is unavailable. Callers can probe `isAgoraAvailable()` before using it.
 */

import { Platform } from 'react-native';
import { api } from './api';
import agoraSdk from './agoraSdk';

let _attempted = false;
let _cached: any = null;

export function isAgoraAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (_attempted) return !!_cached;
  _attempted = true;
  _cached = agoraSdk && agoraSdk.createAgoraRtcEngine ? agoraSdk : null;
  return !!_cached;
}

export function getAgora(): any | null {
  if (!isAgoraAvailable()) return null;
  return _cached;
}

// ---------------------- Backend API wrappers ----------------------

export type AgoraConfig = {
  agora_configured: boolean;
  agora_app_id: string | null;
};

export async function fetchLiveConfig(): Promise<AgoraConfig> {
  try {
    const { data } = await api.get('/live-streams/config');
    return data;
  } catch {
    return { agora_configured: false, agora_app_id: null };
  }
}

export type AgoraToken = {
  token: string;
  app_id: string;
  channel_name: string;
  uid: number;
  role: 'publisher' | 'subscriber';
  expires_at: number;
};

export async function fetchStreamToken(
  streamId: string,
  role: 'publisher' | 'subscriber' = 'subscriber',
  uid = 0,
): Promise<AgoraToken> {
  const { data } = await api.post(`/live-streams/${streamId}/token`, { role, uid });
  return data;
}
