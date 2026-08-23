import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../services/api';
import {
  registerForPushNotificationsAsync,
  savePushTokenOnBackend,
  removePushTokenFromBackend,
} from '../services/notifications';
import * as secureCredentials from '../services/secureCredentials';

export type User = {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  role: 'super_admin' | 'admin' | 'poojari' | 'devotee' | 'hotel_manager';
  is_active: boolean;
  verified: boolean;
  photo_url?: string | null;
  wallet_balance?: number;
  notify_pooja?: boolean;
  notify_video?: boolean;
  notify_live?: boolean;
  notify_booking?: boolean;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    secureCredentials.getBiometricEnabled().then(setBiometricEnabledState);
  }, []);

  const setBiometricEnabled = async (enabled: boolean) => {
    await secureCredentials.setBiometricEnabledFlag(enabled);
    setBiometricEnabledState(enabled);
    if (!enabled) {
      await secureCredentials.clearCredentials();
    }
  };

  const registerPushForUser = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        pushTokenRef.current = token;
        await savePushTokenOnBackend(token, Platform.OS);
      }
    } catch {}
  };

  const loadMe = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await api.get('/auth/me');
      setUser(data);
      // Register for push after restoring session
      registerPushForUser();
    } catch {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const setSession = async (token: string, u: User) => {
    await AsyncStorage.setItem('auth_token', token);
    setUser(u);
    // Register push token right after login
    registerPushForUser();
    // Re-mirror into the biometric credential cache so a normal password
    // login keeps Face ID/fingerprint login working without re-toggling it.
    if (Platform.OS !== 'web' && (await secureCredentials.getBiometricEnabled())) {
      secureCredentials.saveCredentials(token, u).catch(() => {});
    }
  };

  const logout = async () => {
    // Best effort: remove push token from backend
    if (pushTokenRef.current) {
      await removePushTokenFromBackend(pushTokenRef.current);
      pushTokenRef.current = null;
    }
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    // Clear the cached biometric credential (but keep the user's preference
    // flag, so biometric login re-arms automatically on their next sign-in).
    if (Platform.OS !== 'web') {
      secureCredentials.clearCredentials().catch(() => {});
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, setSession, logout, refresh: loadMe, setUser, biometricEnabled, setBiometricEnabled }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
