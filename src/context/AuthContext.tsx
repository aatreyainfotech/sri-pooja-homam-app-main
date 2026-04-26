import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../services/api';
import {
  registerForPushNotificationsAsync,
  savePushTokenOnBackend,
  removePushTokenFromBackend,
} from '../services/notifications';

export type User = {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  role: 'super_admin' | 'admin' | 'poojari' | 'devotee';
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
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);

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
  };

  const logout = async () => {
    // Best effort: remove push token from backend
    if (pushTokenRef.current) {
      await removePushTokenFromBackend(pushTokenRef.current);
      pushTokenRef.current = null;
    }
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, setSession, logout, refresh: loadMe, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
