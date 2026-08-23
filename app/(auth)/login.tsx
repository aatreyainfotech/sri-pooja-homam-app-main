import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, useWindowDimensions,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import * as biometrics from '../../src/services/biometrics';
import * as secureCredentials from '../../src/services/secureCredentials';

const GOLD = '#C9922A';

export default function Login() {
  const router = useRouter();
  const { setSession, biometricEnabled } = useAuth();
  const { width: W } = useWindowDimensions();
  const isMobileLayout = W < 768;            // < 768px → show compact mobile card
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [retryIn, setRetryIn] = useState(0);
  const [showBiometricBtn, setShowBiometricBtn] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometric Login');
  const [bioLoading, setBioLoading] = useState(false);
  const retryTimer = useRef<any>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => () => { if (retryTimer.current) clearInterval(retryTimer.current); }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !biometricEnabled) { setShowBiometricBtn(false); return; }
    (async () => {
      const [{ available }, label, creds] = await Promise.all([
        biometrics.checkAvailability(),
        biometrics.getBiometricLabel(),
        secureCredentials.getCredentials(),
      ]);
      setBiometricLabel(label);
      setShowBiometricBtn(available && !!creds);
    })();
  }, [biometricEnabled]);

  const onBiometricLogin = async () => {
    setBioLoading(true);
    try {
      const ok = await biometrics.authenticate(`Sign in with ${biometricLabel}`);
      if (!ok) return;
      const creds = await secureCredentials.getCredentials();
      if (!creds) {
        setLoginError('Biometric session expired. Please sign in with your password.');
        return;
      }
      await setSession(creds.token, creds.user as any);
      router.replace('/(tabs)');
    } finally {
      setBioLoading(false);
    }
  };

  const startRetryCountdown = (cb: () => void) => {
    setRetryIn(30);
    retryTimer.current = setInterval(() => {
      setRetryIn((prev) => {
        if (prev <= 1) { clearInterval(retryTimer.current); cb(); return 0; }
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
      const isDbError = /database|unavailable|server|starting/i.test(msg);
      if (isDbError) {
        setLoginError('__waking__');
        startRetryCountdown(onLogin);
      } else {
        setLoginError(msg);
        setLoading(false);
      }
    }
  };

  // Shared form fields (used in both web layouts)
  const FormBody = (
    <>
      {loginError === '__waking__' ? (
        <View style={w.wakingBox}>
          <ActivityIndicator size="small" color={GOLD} />
          <View style={{ flex: 1 }}>
            <Text style={w.wakingText}>Server is starting up…</Text>
            <Text style={w.wakingRetry}>Auto-connecting in {retryIn}s</Text>
          </View>
          <TouchableOpacity onPress={onLogin}>
            <Text style={{ color: GOLD, fontWeight: '700', fontSize: 12 }}>Now</Text>
          </TouchableOpacity>
        </View>
      ) : !!loginError ? (
        <View style={w.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
          <Text style={[w.errorText, { flex: 1 }]}>{loginError}</Text>
          <TouchableOpacity onPress={() => setLoginError('')}>
            <Ionicons name="close" size={16} color="#E53935" />
          </TouchableOpacity>
        </View>
      ) : null}

      <Input
        testID="login-mobile-input"
        label="Mobile number"
        icon="call-outline"
        value={mobile}
        onChangeText={setMobile}
        placeholder="Enter your mobile number"
        keyboardType="phone-pad"
        maxLength={10}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        containerStyle={{ marginBottom: theme.spacing.sm }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={w.fieldLabel}>Password</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
          <Text style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
      <Input
        testID="login-password-input"
        ref={passwordRef}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        icon="lock-closed-outline"
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={onLogin}
      />

      <Button
        testID="login-submit-btn"
        title={loading ? (loginError === '__waking__' ? 'Connecting…' : 'Signing in…') : 'Sign In →'}
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onPress={onLogin}
        style={{ marginTop: theme.spacing.sm }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 4 }}>
        <Text style={{ color: '#6B7280', fontSize: 14 }}>New devotee?</Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity testID="login-register-link">
            <Text style={{ color: '#0D1220', fontSize: 14, fontWeight: '700' }}>Register your account</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <TouchableOpacity style={{ alignSelf: 'center', marginTop: 10 }} onPress={() => router.push('/' as any)}>
        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>← Back to homepage</Text>
      </TouchableOpacity>
      <View style={w.legalRow}>
        <TouchableOpacity onPress={() => router.push('/legal/privacy-policy' as any)}>
          <Text style={w.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={w.legalDot}> · </Text>
        <TouchableOpacity onPress={() => router.push('/legal/terms' as any)}>
          <Text style={w.legalLink}>Terms</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/legal/refund' as any)}>
          <Text style={w.legalLink}> · Refund</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ── WEB MOBILE (<768px): full-screen gradient + centered card ────────────
  if (Platform.OS === 'web' && isMobileLayout) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#C9922A', '#7A3020', '#3D1408', '#120805']}
          locations={[0, 0.35, 0.7, 1]}
          style={{ flex: 1, minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: 20 } as any}
        >
          {/* OM watermark */}
          <Text style={{ position: 'absolute', fontSize: 180, color: 'rgba(255,255,255,0.06)', top: -20, right: -20, fontWeight: '900' } as any}>ॐ</Text>

          {/* Logo + brand */}
          <Image source={require('../../assets/images/icon.png')} style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 10, borderWidth: 2, borderColor: 'rgba(201,146,42,0.5)' }} />
          <Text style={{ color: GOLD, fontSize: 18, fontWeight: '900', marginBottom: 2 }}>శ్రీ పూజా హోమం</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 3, marginBottom: 24 }}>SRI POOJA HOMAM</Text>

          {/* White card */}
          <View style={{
            width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF',
            borderRadius: 20, padding: 24,
            ...(Platform.OS === 'web' ? { boxShadow: '0 20px 60px rgba(0,0,0,0.4)' } : {}) as any,
          } as any}>
            <Text style={[w.formTitle, { marginBottom: 4 }]}>Welcome back</Text>
            <Text style={[w.formSub, { marginBottom: 20 }]}>Sign in to your account</Text>
            {FormBody}
          </View>
        </LinearGradient>
      </ScrollView>
    );
  }

  // ── WEB DESKTOP (≥768px): Two-column layout (aatreyanews.in model) ────────
  if (Platform.OS === 'web') {
    return (
      <View style={w.root}>

        {/* ── LEFT: Brand panel ────────────────────────────────────────── */}
        <View style={w.brand}>
          <LinearGradient
            colors={['#120805', '#3D1408', '#7A3020', '#C9922A']}
            locations={[0, 0.4, 0.75, 1]}
            start={[0, 0]} end={[1, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle grid dot pattern like aatreyanews.in */}
          <View style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          } as any} />
          <Text style={w.brandOm}>ॐ</Text>

          <View style={w.brandContent}>
            <Image source={require('../../assets/images/icon.png')} style={w.brandLogo} />
            <Text style={w.brandTelugu}>శ్రీ పూజా హోమం</Text>
            <Text style={w.brandLatin}>SRI POOJA HOMAM</Text>
            <Text style={w.brandHeading}>Begin Your{'\n'}Spiritual Journey</Text>
            <Text style={w.brandSub}>
              Connect with verified Vedic pujaris. Book sacred poojas, homams & live temple darshan.
            </Text>

            {/* 2×2 feature grid — aatreyanews.in style */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              {[
                { title: 'Book Poojas',   sub: 'Vedic rituals online' },
                { title: 'Live Darshan',  sub: 'Sacred streams 24/7' },
                { title: '500+ Temples',  sub: 'Across India' },
                { title: 'Vedic Pujaris', sub: 'Verified & certified' },
              ].map((f) => (
                <View key={f.title} style={w.featureCard}>
                  <Text style={w.featureTitle}>{f.title}</Text>
                  <Text style={w.featureSub}>{f.sub}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={w.brandCopy}>© 2026 Aatreya Infotech Systems LLP</Text>
        </View>

        {/* ── RIGHT: Form panel (white, clean) ────────────────────────── */}
        <View style={w.panel}>

          <View style={w.formInner}>
            <Text style={w.formTitle}>Welcome back</Text>
            <Text style={w.formSub}>Sign in to your account</Text>
            {FormBody}
          </View>
        </View>
      </View>
    );
  }

  // ── MOBILE layout ─────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#120805', '#3D1408', '#7A3020']} style={{ flex: 1 }}>
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

              {loginError === '__waking__' ? (
                <View style={m.wakingBox}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={m.wakingText}>Server is starting up…</Text>
                    <Text style={m.wakingRetry}>Auto-connecting in {retryIn}s</Text>
                  </View>
                </View>
              ) : !!loginError ? (
                <View style={m.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
                  <Text style={[m.errorText, { flex: 1 }]}>{loginError}</Text>
                </View>
              ) : null}

              <Input
                testID="login-mobile-input"
                icon="call-outline"
                value={mobile}
                onChangeText={setMobile}
                placeholder="Mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Input
                testID="login-password-input"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
              />

              <Button
                testID="login-submit-btn"
                title={loading ? (loginError === '__waking__' ? 'Connecting…' : 'Signing in…') : 'Sign In'}
                icon={loading ? undefined : 'arrow-forward'}
                iconPosition="right"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={onLogin}
                style={{ marginTop: theme.spacing.xs }}
              />

              {showBiometricBtn && (
                <Button
                  testID="login-biometric-btn"
                  title={`Sign in with ${biometricLabel}`}
                  icon="finger-print-outline"
                  variant="outline"
                  size="lg"
                  fullWidth
                  loading={bioLoading}
                  onPress={onBiometricLogin}
                  style={{ marginTop: theme.spacing.sm }}
                />
              )}

              <TouchableOpacity testID="login-forgot-link" style={m.forgotBtn} onPress={() => router.push('/(auth)/forgot-password' as any)}>
                <Text style={m.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={m.divider}>
                <View style={m.divLine} /><Text style={m.divText}>New Devotee?</Text><View style={m.divLine} />
              </View>

              <Link href="/(auth)/register" asChild>
                <Button testID="login-register-link" title="Create Account" variant="outline" size="lg" fullWidth />
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

// ── Web styles ────────────────────────────────────────────────────────────────
const w = StyleSheet.create({
  root: {
    position: 'absolute' as any, top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row' as any, backgroundColor: '#120805',
  } as any,

  // Left brand panel
  brand: {
    flex: 1, position: 'relative', overflow: 'hidden',
    flexDirection: 'column', justifyContent: 'space-between',
  },
  brandOm: {
    position: 'absolute', right: -60, bottom: -60,
    fontSize: 420, color: 'rgba(255,255,255,0.04)',
    fontWeight: '400', lineHeight: 460, zIndex: 0,
  } as any,
  brandContent: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 56, paddingTop: 48, paddingBottom: 24, zIndex: 1,
  },
  brandLogo: {
    width: 72, height: 72, borderRadius: 18, marginBottom: 20,
    borderWidth: 2, borderColor: 'rgba(201,146,42,0.5)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 20px rgba(201,146,42,0.15)' } as any : {}),
  } as any,
  brandTelugu: { color: GOLD, fontSize: 26, fontWeight: '900', letterSpacing: 0.4, marginBottom: 2 },
  brandLatin: { color: 'rgba(201,146,42,0.45)', fontSize: 10, letterSpacing: 5, marginBottom: 22 },
  brandHeading: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 40, marginBottom: 10, maxWidth: 300 },
  brandSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 24, maxWidth: 320, marginBottom: 20 },

  // 2×2 feature grid
  featureCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12, padding: 14,
  },
  featureTitle: { color: GOLD, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  featureSub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 16 },
  brandCopy: { color: 'rgba(255,255,255,0.18)', fontSize: 11, paddingHorizontal: 56, paddingBottom: 28, zIndex: 1 },

  // Right form panel — WHITE (aatreyanews.in style)
  panel: {
    width: 480,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1, borderLeftColor: '#E5E7EB',
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } as any : {}),
    justifyContent: 'center',
  } as any,
  formInner: {
    paddingHorizontal: 48, paddingVertical: 52,
  },
  formTitle: { color: '#0D1220', fontSize: 34, fontWeight: '900', marginBottom: 6 },
  formSub: { color: '#6B7280', fontSize: 15, marginBottom: 32 },

  fieldLabel: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 8 },

  wakingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 16,
  },
  wakingText: { color: '#92400E', fontSize: 13, fontWeight: '700' },
  wakingRetry: { color: '#B45309', fontSize: 11, marginTop: 2 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', lineHeight: 18 },

  legalRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 20, flexWrap: 'wrap', gap: 2,
  },
  legalLink: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  legalDot: { color: '#D1D5DB', fontSize: 12 },
});

// ── Mobile styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40, paddingTop: 24 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  logoWrap: { width: 96, height: 96, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: GOLD, marginBottom: 12 },
  logo: { width: '100%', height: '100%' } as any,
  brand: { fontSize: 26, fontWeight: '800', color: GOLD, letterSpacing: 0.6 },
  brandLatin: { fontSize: 12, color: GOLD, letterSpacing: 3, marginTop: 4, opacity: 0.85 },
  brandSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    borderWidth: 1.5, borderColor: 'rgba(201,146,42,0.35)',
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#0D1220' },
  cardSub: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  wakingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 12,
  },
  wakingText: { color: '#92400E', fontSize: 13, fontWeight: '700' },
  wakingRetry: { color: '#B45309', fontSize: 11, marginTop: 2 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: 12,
  },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 4, marginTop: 4 },
  forgotText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  divText: { color: '#9CA3AF', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, flexWrap: 'wrap' },
  legalLink: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  legalDot: { color: '#D1D5DB', fontSize: 12 },
});
