import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, apiError } from '../../src/services/api';

const GOLD   = '#C9922A';
const IS_WEB = Platform.OS === 'web';

export default function ResetPasswordOtp() {
  const router = useRouter();
  const { mobile, otp_mock } = useLocalSearchParams<{ mobile: string; otp_mock: string }>();
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [newPw, setNewPw]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const [pwFocused, setPwFocused] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (otp_mock && typeof otp_mock === 'string' && otp_mock.length === 6) {
      const t = setTimeout(() => setOtp(otp_mock.split('')), 400);
      return () => clearTimeout(t);
    }
  }, [otp_mock]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-reset-otp', { mobile });
      setCooldown(60);
      if (data.otp_mock) {
        setOtp(data.otp_mock.split(''));
        Alert.alert('Test Mode', `Your OTP: ${data.otp_mock}`);
      } else if (data.delivery_failed) {
        Alert.alert('Delivery Failed', 'WhatsApp not working. Contact support.');
      } else {
        Alert.alert('OTP Resent', 'Check your WhatsApp messages.');
      }
    } catch (e) {
      Alert.alert('Error', apiError(e));
    } finally {
      setResending(false);
    }
  };

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const reset = async () => {
    const code = otp.join('');
    if (code.length !== 6) { Alert.alert('Invalid OTP', 'Enter all 6 digits'); return; }
    if (!newPw || newPw.length < 6) { Alert.alert('Required', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password-otp', { mobile, otp: code, new_password: newPw });
      Alert.alert('Password Reset!', 'Please sign in with your new password.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Alert.alert('Error', apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#C9922A', '#7A3020', '#3D1408', '#120805']}
      locations={[0, 0.3, 0.6, 1]}
      start={[0, 0]} end={[1, 1]}
      style={IS_WEB ? w.rootWeb : w.rootMobile}
    >
      {IS_WEB && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(220,80,15,0.2) 0%, transparent 60%)',
        } as any} />
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={w.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
          <Text style={w.backTxt}>Back</Text>
        </TouchableOpacity>

        <View style={w.center}>
          {/* Icon ring */}
          <View style={w.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={32} color={GOLD} />
          </View>

          <Text style={w.title}>Verify & Reset</Text>
          <Text style={w.sub}>
            Enter the 6-digit OTP sent to +91 {mobile}{'\n'}and set your new password.
          </Text>

          {/* Dark form card */}
          <View style={w.formCard}>
            {/* OTP boxes */}
            <Text style={w.label}>ENTER OTP</Text>
            <View style={w.otpRow}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { refs.current[i] = r; }}
                  value={d}
                  onChangeText={(v) => setDigit(i, v)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[w.otpBox, d ? w.otpBoxFilled : null]}
                />
              ))}
            </View>

            {/* New password */}
            <Text style={[w.label, { marginTop: 20 }]}>NEW PASSWORD</Text>
            <View style={[w.inputWrap, pwFocused && w.inputWrapFocused]}>
              <Ionicons name="lock-closed-outline" size={19} color={pwFocused ? GOLD : 'rgba(212,175,55,0.5)'} />
              <TextInput
                value={newPw}
                onChangeText={setNewPw}
                placeholder="Min. 6 characters"
                placeholderTextColor="rgba(255,248,240,0.3)"
                secureTextEntry={!showPw}
                style={w.input}
                autoCapitalize="none"
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color="rgba(255,248,240,0.35)" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[w.btn, loading && { opacity: 0.7 }]}
              onPress={reset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={w.btnTxt}>Reset Password</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resend}
              disabled={cooldown > 0 || resending}
              style={w.resendBtn}
            >
              {resending ? (
                <ActivityIndicator color={GOLD} size="small" />
              ) : (
                <Text style={[w.resendTxt, cooldown > 0 && w.resendDisabled]}>
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP via WhatsApp'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={w.copy}>© 2026 Aatreya Infotech Systems LLP</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const w = StyleSheet.create({
  rootWeb:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any,
  rootMobile: { flex: 1 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    padding: 20, paddingTop: IS_WEB ? 28 : 16,
  },
  backTxt: { color: 'rgba(255,255,255,0.65)', fontSize: 15 },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, marginTop: -60,
  },

  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },

  title: {
    fontSize: IS_WEB ? 32 : 26, fontWeight: '900', color: '#FFF8F0',
    textAlign: 'center', marginBottom: 10,
    ...(IS_WEB ? { textShadow: '0 2px 16px rgba(0,0,0,0.5)' } as any : {}),
  },
  sub: {
    fontSize: IS_WEB ? 15 : 13, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },

  formCard: {
    width: '100%', maxWidth: IS_WEB ? 440 : undefined,
    backgroundColor: 'rgba(20,3,3,0.7)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.14)',
    borderRadius: 20, padding: 28,
    ...(IS_WEB ? { backdropFilter: 'blur(10px)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' } as any : {}),
  },

  label: { fontSize: 10, fontWeight: '800', color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5, marginBottom: 10 },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: IS_WEB ? 10 : 8 },
  otpBox: {
    width: IS_WEB ? 48 : 44, height: IS_WEB ? 56 : 52,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.2)',
    textAlign: 'center', fontSize: 22, fontWeight: '800',
    color: '#FFF8F0', backgroundColor: 'rgba(255,255,255,0.04)',
    ...(IS_WEB ? { outlineStyle: 'none', outlineWidth: 0 } as any : {}),
  } as any,
  otpBoxFilled: {
    borderColor: 'rgba(212,175,55,0.65)',
    backgroundColor: 'rgba(212,175,55,0.07)',
    ...(IS_WEB ? { boxShadow: '0 0 0 3px rgba(212,175,55,0.08)' } as any : {}),
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.18)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 2, marginBottom: 16,
    ...(IS_WEB ? { transition: 'border-color 0.2s, background 0.2s' } as any : {}),
  },
  inputWrapFocused: IS_WEB ? {
    borderColor: 'rgba(212,175,55,0.7)',
    backgroundColor: 'rgba(212,175,55,0.06)',
    boxShadow: '0 0 0 3px rgba(212,175,55,0.08)',
  } as any : { borderColor: '#C9922A' },
  input: {
    flex: 1, paddingVertical: 14, fontSize: 15, color: '#FFF8F0',
    ...(IS_WEB ? { outlineStyle: 'none', outlineWidth: 0 } as any : {}),
  } as any,

  btn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14,
    ...(IS_WEB ? {
      backgroundImage: 'linear-gradient(135deg, #A01818 0%, #7B1010 100%)',
      boxShadow: '0 6px 28px rgba(139,21,21,0.55)',
    } as any : { backgroundColor: '#A01818' }),
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resendBtn: { alignItems: 'center', paddingVertical: 6 },
  resendTxt: { color: GOLD, fontSize: 13, fontWeight: '600' },
  resendDisabled: { color: 'rgba(212,175,55,0.3)' },

  copy: {
    color: 'rgba(212,175,55,0.25)', fontSize: 11,
    marginTop: 28, textAlign: 'center',
  },
});
