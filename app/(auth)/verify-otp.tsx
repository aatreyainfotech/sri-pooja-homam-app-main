import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

export default function VerifyOtp() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const { mobile, otp_mock } = useLocalSearchParams<{ mobile: string; otp_mock: string }>();
  const { setSession } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(TextInput | null)[]>([]);

  // Auto-fill mocked OTP after 500ms for UX convenience
  useEffect(() => {
    if (otp_mock && typeof otp_mock === 'string' && otp_mock.length === 6) {
      const t = setTimeout(() => setOtp(otp_mock.split('')), 400);
      return () => clearTimeout(t);
    }
  }, [otp_mock]);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-otp', { mobile });
      setCooldown(60);
      if (data.otp_mock) {
        setOtp(data.otp_mock.split(''));
        Alert.alert('Test Mode', `Your OTP: ${data.otp_mock}`);
      } else if (data.delivery_failed) {
        Alert.alert('Delivery Failed', 'WhatsApp not working. Contact support: +91 9999999999');
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

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { mobile, otp: code });
      await setSession(data.token, data.user);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Verification failed', apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#8B1515', '#630B0B', '#2D1B19']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, padding: 24 }}>
          <TouchableOpacity testID="otp-back-btn" onPress={() => safeBack('/(auth)/register')} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#FDFBF7" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Image source={require('../../assets/images/icon.png')} style={{ width: 72, height: 72, borderRadius: 16 }} />
          </View>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code via WhatsApp to{'\n'}<Text style={{ color: theme.colors.secondary, fontWeight: '700' }}>+91 {mobile}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                testID={`otp-input-${i}`}
                ref={(r) => { refs.current[i] = r; }}
                value={d}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
                }}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.otpBox}
              />
            ))}
          </View>

          <TouchableOpacity testID="otp-verify-btn" style={styles.btnPrimary} onPress={verify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.btnPrimaryText}>Verify & Continue</Text>
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
              <ActivityIndicator color={theme.colors.secondary} size="small" />
            ) : (
              <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </Text>
            )}
          </TouchableOpacity>

          {otp_mock ? (
            <View style={styles.mockBox}>
              <Text style={styles.mockLabel}>🧪 TEST MODE — WhatsApp not configured</Text>
              <Text style={styles.mockOtp}>{otp_mock}</Text>
              <Text style={styles.mockSub}>Configure META_WHATSAPP_TOKEN in backend .env to send real OTPs</Text>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backText: { color: '#FDFBF7', fontSize: 15 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 999, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 30, fontWeight: '700', color: theme.colors.secondary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(253,251,247,0.8)', textAlign: 'center', marginTop: 8, marginBottom: 30, lineHeight: 22 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
  otpBox: {
    flex: 1, height: 60, borderWidth: 2, borderColor: theme.colors.secondary,
    borderRadius: 12, backgroundColor: '#fff', textAlign: 'center',
    fontSize: 24, fontWeight: '700', color: theme.colors.primary,
  },
  btnPrimary: {
    backgroundColor: theme.colors.secondary, borderRadius: 999, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnPrimaryText: { color: '#2D1B19', fontSize: 16, fontWeight: '700' },
  resendBtn: { alignItems: 'center', paddingVertical: 14 },
  resendText: { color: theme.colors.secondary, fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: 'rgba(212,175,55,0.4)' },
  mockBox: {
    marginTop: 24, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
    alignItems: 'center',
  },
  mockLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.secondary, letterSpacing: 1.5 },
  mockOtp: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 8, marginVertical: 4 },
  mockSub: { fontSize: 11, color: 'rgba(253,251,247,0.6)', fontStyle: 'italic' },
});
