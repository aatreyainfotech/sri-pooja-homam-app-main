import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const GOLD = '#D4AF37';

export default function Login() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const [loginError, setLoginError] = useState('');
  const [retryIn, setRetryIn] = useState(0);
  const retryTimer = useRef<any>(null);

  useEffect(() => () => { if (retryTimer.current) clearInterval(retryTimer.current); }, []);

  const startRetryCountdown = (cb: () => void) => {
    setRetryIn(30);
    retryTimer.current = setInterval(() => {
      setRetryIn((prev) => {
        if (prev <= 1) {
          clearInterval(retryTimer.current);
          cb();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onLogin = async () => {
    if (!mobile.trim() || !password) {
      setLoginError('Please enter your mobile number and password.');
      return;
    }
    setLoginError('');
    setRetryIn(0);
    if (retryTimer.current) clearInterval(retryTimer.current);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { mobile: mobile.trim(), password });
      await setSession(data.token, data.user);
      router.replace('/(tabs)');
    } catch (e) {
      const msg = apiError(e);
      setLoginError(msg);
      const isDbError = /database|unavailable|server|starting/i.test(msg);
      if (isDbError) {
        startRetryCountdown(onLogin);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── WEB: Two-column professional layout ──────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={w.root}>

        {/* ── LEFT: Brand panel ── */}
        <View style={w.brand}>
          <LinearGradient
            colors={['#4A2C2A', '#B22222', '#D35400', '#E67E22']}
            locations={[0, 0.3, 0.6, 1]}
            start={[0.1, 0]}
            end={[0.9, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Warm radial glow */}
          {Platform.OS === 'web' && (
            <View style={{
              position: 'absolute', top: '5%', left: '0%',
              width: '100%', height: '55%', zIndex: 0,
              background: 'radial-gradient(ellipse at 40% 40%, rgba(220,80,15,0.28) 0%, rgba(160,35,10,0.12) 45%, transparent 70%)',
            } as any} />
          )}
          {/* Decorative OM */}
          <Text style={w.brandOm}>ॐ</Text>

          <View style={w.brandContent}>
            <Image source={require('../../assets/images/icon.png')} style={w.brandLogo} />
            <Text style={w.brandTelugu}>శ్రీ పూజా హోమం</Text>
            <Text style={w.brandLatin}>SRI POOJA HOMAM</Text>
            <Text style={w.brandHeading}>Begin Your{'\n'}Spiritual Journey</Text>
            <Text style={w.brandSub}>
              Connect with verified Vedic pujaris. Book sacred poojas, homams & live temple darshan.
            </Text>
            {[
              '500+ Sacred Temples across India',
              'Verified Vedic Pujaris',
              'Live Temple Darshan 24/7',
              '10,000+ Devotees Served',
            ].map((pt) => (
              <View key={pt} style={w.trustRow}>
                <View style={w.trustDot}>
                  <Ionicons name="checkmark" size={12} color={GOLD} />
                </View>
                <Text style={w.trustText}>{pt}</Text>
              </View>
            ))}
          </View>

          <Text style={w.brandCopy}>© 2026 Aatreya Infotech Systems LLP</Text>
        </View>

        {/* ── RIGHT: Form panel ── */}
        <View style={w.panel}>
          <Text style={w.label}>WELCOME BACK, DEVOTEE</Text>
          <Text style={w.title}>Sign In</Text>
          <Text style={w.sub}>Enter your mobile number and password</Text>

          {!!loginError && (
            <View style={w.errorBox}>
              <Ionicons name={retryIn > 0 ? 'time-outline' : 'alert-circle-outline'} size={18} color={retryIn > 0 ? '#E67E22' : '#E53935'} />
              <View style={{ flex: 1 }}>
                <Text style={[w.errorText, retryIn > 0 && { color: '#E67E22' }]}>{loginError}</Text>
                {retryIn > 0 && (
                  <Text style={w.retryText}>Server is starting up — retrying in {retryIn}s…</Text>
                )}
              </View>
              {retryIn > 0 ? (
                <TouchableOpacity onPress={onLogin}>
                  <Text style={{ color: '#E67E22', fontWeight: '700', fontSize: 12 }}>Retry Now</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setLoginError('')}>
                  <Ionicons name="close" size={16} color="#E53935" />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={[w.inputWrap, focused === 'mobile' && w.inputWrapFocused]}>
            <Ionicons name="call-outline" size={19} color={focused === 'mobile' ? GOLD : 'rgba(212,175,55,0.5)'} />
            <TextInput
              testID="login-mobile-input"
              value={mobile}
              onChangeText={setMobile}
              placeholder="Mobile number"
              placeholderTextColor="rgba(255,248,240,0.25)"
              keyboardType="phone-pad"
              style={w.input}
              maxLength={10}
              onFocus={() => setFocused('mobile')}
              onBlur={() => setFocused('')}
            />
          </View>

          <View style={[w.inputWrap, focused === 'password' && w.inputWrapFocused]}>
            <Ionicons name="lock-closed-outline" size={19} color={focused === 'password' ? GOLD : 'rgba(212,175,55,0.5)'} />
            <TextInput
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="rgba(255,248,240,0.25)"
              secureTextEntry={!showPw}
              style={w.input}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color="rgba(255,248,240,0.35)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="login-submit-btn" style={w.btnPrimary} onPress={onLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={w.btnPrimaryText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="login-forgot-link"
            style={w.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password' as any)}
          >
            <Text style={w.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={w.divider}>
            <View style={w.divLine} />
            <Text style={w.divText}>NEW DEVOTEE?</Text>
            <View style={w.divLine} />
          </View>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity testID="login-register-link" style={w.btnSecondary}>
              <Text style={w.btnSecondaryText}>Create Free Account</Text>
            </TouchableOpacity>
          </Link>

          <View style={w.legalRow}>
            <TouchableOpacity onPress={() => router.push('/legal/privacy-policy' as any)}>
              <Text style={w.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={w.legalDot}> · </Text>
            <TouchableOpacity onPress={() => router.push('/legal/terms' as any)}>
              <Text style={w.legalLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={w.legalDot}> · </Text>
            <TouchableOpacity onPress={() => router.push('/legal/refund' as any)}>
              <Text style={w.legalLink}>Refund Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── MOBILE layout ─────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#4A2C2A', '#B22222', '#E67E22']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={m.scroll} keyboardShouldPersistTaps="handled">
            <View style={m.header}>
              <View style={m.logoWrap}>
                <Image source={require('../../assets/images/icon.png')} style={m.logo} />
              </View>
              <Text style={m.brand}>శ్రీ పూజా హోమం</Text>
              <Text style={m.brandLatin}>SRI POOJA HOMAM</Text>
              <Text style={m.brandSub}>Welcome back, devotee</Text>
            </View>

            <View style={m.card}>
              <Text style={m.cardTitle}>Sign In</Text>
              <Text style={m.cardSub}>Enter your mobile number and password</Text>

              {!!loginError && (
                <View style={m.errorBox}>
                  <Ionicons name={retryIn > 0 ? 'time-outline' : 'alert-circle-outline'} size={16} color={retryIn > 0 ? '#E65100' : '#C62828'} />
                  <View style={{ flex: 1 }}>
                    <Text style={m.errorText}>{loginError}</Text>
                    {retryIn > 0 && <Text style={m.retryText}>Retrying in {retryIn}s…</Text>}
                  </View>
                </View>
              )}

              <View style={m.inputWrap}>
                <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  testID="login-mobile-input"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Mobile number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  style={m.input}
                  maxLength={10}
                />
              </View>

              <View style={m.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  testID="login-password-input"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPw}
                  style={m.input}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity testID="login-submit-btn" style={m.btnPrimary} onPress={onLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={m.btnPrimaryText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity testID="login-forgot-link" style={m.forgotBtn} onPress={() => router.push('/(auth)/forgot-password' as any)}>
                <Text style={m.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={m.divider}>
                <View style={m.divLine} /><Text style={m.divText}>New Devotee?</Text><View style={m.divLine} />
              </View>

              <Link href="/(auth)/register" asChild>
                <TouchableOpacity testID="login-register-link" style={m.btnSecondary}>
                  <Text style={m.btnSecondaryText}>Create Account</Text>
                </TouchableOpacity>
              </Link>

              <View style={m.legalRow}>
                <TouchableOpacity onPress={() => router.push('/legal/privacy-policy' as any)}>
                  <Text style={m.legalLink}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={m.legalDot}> · </Text>
                <TouchableOpacity onPress={() => router.push('/legal/terms' as any)}>
                  <Text style={m.legalLink}>Terms</Text>
                </TouchableOpacity>
                <Text style={m.legalDot}> · </Text>
                <TouchableOpacity onPress={() => router.push('/legal/refund' as any)}>
                  <Text style={m.legalLink}>Refund</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Web styles ───────────────────────────────────────────────────────────────
const w = StyleSheet.create({
  root: {
    position: 'absolute' as any, top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row' as any, backgroundColor: '#4A2C2A',
  } as any,

  // Left brand panel
  brand: {
    flex: 1, position: 'relative', overflow: 'hidden',
    flexDirection: 'column', justifyContent: 'space-between',
  },
  brandOm: {
    position: 'absolute', right: -60, bottom: -60,
    fontSize: 420, color: 'rgba(255,150,30,0.07)',
    fontWeight: '400', lineHeight: 460, zIndex: 0,
  } as any,
  brandContent: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 56, paddingTop: 48, paddingBottom: 24, zIndex: 1,
  },
  brandLogo: {
    width: 84, height: 84, borderRadius: 22, marginBottom: 22,
    borderWidth: 2.5, borderColor: 'rgba(212,175,55,0.55)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 24px rgba(212,175,55,0.2)' } as any : {}),
  } as any,
  brandTelugu: { color: GOLD, fontSize: 30, fontWeight: '900', letterSpacing: 0.4, marginBottom: 4 },
  brandLatin: { color: 'rgba(212,175,55,0.5)', fontSize: 10, letterSpacing: 5, marginBottom: 26 },
  brandHeading: { color: '#fff', fontSize: 34, fontWeight: '900', lineHeight: 44, marginBottom: 12, maxWidth: 340 },
  brandSub: { color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 26, maxWidth: 340, marginBottom: 30 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  trustDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  trustText: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  brandCopy: { color: 'rgba(255,255,255,0.2)', fontSize: 11, paddingHorizontal: 56, paddingBottom: 28, zIndex: 1 },

  // Right form panel
  panel: {
    width: 460,
    backgroundColor: '#2D1410',
    borderLeftWidth: 1, borderLeftColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 44, paddingVertical: 52,
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' } as any : {}),
  } as any,
  label: { color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 3.5, marginBottom: 12 },
  title: { color: '#FFF8F0', fontSize: 34, fontWeight: '900', marginBottom: 6 },
  sub: { color: 'rgba(255,248,240,0.38)', fontSize: 14, marginBottom: 30 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.18)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 2,
    marginBottom: 14,
    ...(Platform.OS === 'web' ? { transition: 'border-color 0.2s, background 0.2s' } as any : {}),
  },
  inputWrapFocused: {
    borderColor: 'rgba(212,175,55,0.7)',
    backgroundColor: 'rgba(212,175,55,0.06)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 3px rgba(212,175,55,0.08)' } as any : {}),
  },
  input: {
    flex: 1, paddingVertical: 14, fontSize: 15, color: '#FFF8F0',
    ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
  } as any,

  btnPrimary: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 6,
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(135deg, #D35400 0%, #B22222 100%)',
      boxShadow: '0 6px 28px rgba(211,84,0,0.55)',
    } as any : { backgroundColor: '#D35400' }),
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(229,57,53,0.08)', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(229,57,53,0.25)', marginBottom: 14,
  },
  errorText: { color: '#E53935', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  retryText: { color: '#E67E22', fontSize: 11, marginTop: 3 },

  forgotBtn: { alignSelf: 'center', paddingVertical: 14, marginTop: 4 },
  forgotText: { color: GOLD, fontSize: 13, fontWeight: '600' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(212,175,55,0.1)' },
  divText: { color: 'rgba(255,248,240,0.25)', fontSize: 10, letterSpacing: 2.5 },

  btnSecondary: {
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.55)', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s' } as any : {}),
  },
  btnSecondaryText: { color: GOLD, fontSize: 15, fontWeight: '700' },

  legalRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 22, flexWrap: 'wrap', gap: 2,
  },
  legalLink: { color: 'rgba(212,175,55,0.5)', fontSize: 12, fontWeight: '600' },
  legalDot: { color: 'rgba(255,248,240,0.15)', fontSize: 12 },
});

// ── Mobile styles ────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40, paddingTop: 24 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  logoWrap: { width: 96, height: 96, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: theme.colors.secondary, marginBottom: 12 },
  logo: { width: '100%', height: '100%' } as any,
  brand: { fontSize: 26, fontWeight: '800', color: theme.colors.secondary, letterSpacing: 0.6 },
  brandLatin: { fontSize: 12, color: theme.colors.secondary, letterSpacing: 3, marginTop: 4, opacity: 0.85 },
  brandSub: { fontSize: 13, color: 'rgba(253,251,247,0.7)', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' },
  card: {
    backgroundColor: theme.colors.bgPaper, borderRadius: 24, padding: 24,
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
    shadowColor: theme.colors.secondary, shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  cardSub: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4, marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4,
    marginBottom: 14, backgroundColor: '#fff',
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.colors.text },
  btnPrimary: {
    backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FFCDD2', marginBottom: 12,
  },
  errorText: { color: '#C62828', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  retryText: { color: '#E65100', fontSize: 11, marginTop: 3 },

  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 4, marginTop: 4 },
  forgotText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  divText: { color: theme.colors.textMuted, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  btnSecondary: {
    borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center',
  },
  btnSecondaryText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, flexWrap: 'wrap' },
  legalLink: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
  legalDot: { color: theme.colors.textMuted, fontSize: 12 },
});
