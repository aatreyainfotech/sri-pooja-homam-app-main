import axios from 'axios';
import { getAuthToken } from './sessionStore';

const PROD_BACKEND = 'https://sripoojahomam-f7bvaqfxgreghkeu.centralindia-01.azurewebsites.net';
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || PROD_BACKEND;

export const api = axios.create({
  baseURL: `${BASE}/api`,
  // Azure App Service can cold-start (30-60s). Allow plenty of time so login
  // and other first calls don't fail with a 20s timeout.
  timeout: 90000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-retry once on connection timeout / network abort (cold start case)
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg: any = error?.config;
    const code = error?.code;
    const isTimeout = code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
    const isNetwork = error?.message === 'Network Error';
    if (cfg && !cfg.__retried && (isTimeout || isNetwork)) {
      cfg.__retried = true;
      cfg.timeout = 120000;
      return api.request(cfg);
    }
    return Promise.reject(error);
  }
);

// Fire-and-forget warm-up ping so the Azure App Service dyno is hot by the
// time the user actually submits a login.
try {
  fetch(`${BASE}/api/`).catch(() => {});
} catch {}

export function apiError(e: any): string {
  const detail = e?.response?.data?.detail;
  if (!detail) return e?.message || 'Something went wrong';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d: any) => d?.msg || JSON.stringify(d)).join(' ');
  return String(detail);
}
