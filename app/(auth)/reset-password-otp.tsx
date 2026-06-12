import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function ResetPasswordOtp() {
  const router = useRouter();
  const { mobile, otp_mock } = useLocalSearchParams<{ mobile: string; otp_mock: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(TextInput | null)[]>([]);

  // Auto-fill mocked OTP in dev/staging (WhatsApp not configured)
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
    if (code.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter all 6 digits');
      return;
    }
    if (!newPw || newPw.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters');
      return;
    }
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
    <LinearGradient colors={['#8B1515', '#630B0B', '#2D1B19']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.container}>
            <Ionicons name="shield-checkmark-outline" size={56} color={theme.colors.secondary} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Verify & Reset</Text>
            <Text style={styles.sub}>Enter the 6-digit OTP sent to +91 {mobile} and your new password.</Text>

            <View style={styles.card}>
              {/* OTP boxes */}
              <View style={styles.otpRow}>
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { refs.current[i] = r; }}
                    value={d}
                    onChangeText={(v) => setDigit(i, v)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                  />
                ))}
              </View>

              {/* New password */}
              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  value={newPw}
                  onChangeText={setNewPw}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPw}
                  style={styles.input}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.btn} onPress={reset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.btnText}>Reset Password</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={resend}
                disabled={cooldown > 0 || resending}
                style={styles.resendBtn}
              >
                {resending ? (
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : (
                  <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP via WhatsApp'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  back: { padding: 16 },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', marginTop: -60 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  card: { width: '100%', backgroundColor: theme.colors.bgPaper, borderRadius: 20, padding: 20, gap: 14 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  otpBox: {
    width: 44, height: 52, borderRadius: 10, borderWidth: 1.5,
    borderColor: theme.colors.border, textAlign: 'center',
    fontSize: 22, fontWeight: '700', color: theme.colors.text, backgroundColor: '#fff',
  },
  otpBoxFilled: { borderColor: theme.colors.primary, backgroundColor: '#FFF8F0' },
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#fff',
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.colors.text },
  btn: {
    backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  resendDisabled: { color: 'rgba(139,21,21,0.35)' },
  backLink: { alignItems: 'center', paddingVertical: 4 },
  backLinkText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
});
