import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, apiError } from '../../src/services/api';

const GOLD   = '#C9922A';
const IS_WEB = Platform.OS === 'web';

export default function ForgotPassword() {
  const router = useRouter();
  const [mobile, setMobile]   = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const send = async () => {
    if (!mobile.trim() || mobile.trim().length !== 10) {
      Alert.alert('Required', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { mobile: mobile.trim() });
      const params: any = { mobile: mobile.trim() };
      if (data.otp_debug) params.otp_mock = data.otp_debug;
      if (data.delivery_failed) params.delivery_failed = '1';
      if (data.delivery_failed) {
        Alert.alert(
          'WhatsApp Delivery Failed',
          'OTP could not be sent via WhatsApp.\n\nTap "Resend OTP via WhatsApp" on the next screen to try again.',
          [{ text: 'OK', onPress: () => router.push({ pathname: '/(auth)/reset-password-otp', params } as any) }]
        );
      } else {
        router.push({ pathname: '/(auth)/reset-password-otp', params } as any);
      }
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
            <Ionicons name="lock-open-outline" size={32} color={GOLD} />
          </View>

          <Text style={w.title}>Forgot Password?</Text>
          <Text style={w.sub}>
            Enter your registered mobile number.{'\n'}We'll send an OTP via WhatsApp.
          </Text>

          {/* Dark form card */}
          <View style={w.formCard}>
            <View style={[w.inputWrap, focused && w.inputWrapFocused]}>
              <Ionicons name="call-outline" size={19} color={focused ? GOLD : 'rgba(212,175,55,0.5)'} />
              <TextInput
                value={mobile}
                onChangeText={setMobile}
                placeholder="Mobile number"
                placeholderTextColor="rgba(255,248,240,0.3)"
                keyboardType="phone-pad"
                style={w.input}
                maxLength={10}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[w.btn, loading && { opacity: 0.7 }]}
              onPress={send}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  <Text style={w.btnTxt}>Send WhatsApp OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={w.backLink}>
              <Ionicons name="arrow-back-outline" size={14} color={GOLD} />
              <Text style={w.backLinkTxt}>Back to Sign In</Text>
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
    width: '100%', maxWidth: IS_WEB ? 420 : undefined,
    backgroundColor: 'rgba(20,3,3,0.7)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.14)',
    borderRadius: 20, padding: 28,
    ...(IS_WEB ? { backdropFilter: 'blur(10px)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' } as any : {}),
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
  } as any : { borderColor: GOLD },
  input: {
    flex: 1, paddingVertical: 14, fontSize: 15, color: '#FFF8F0',
    ...(IS_WEB ? { outline: 'none' } as any : {}),
  } as any,

  btn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18,
    ...(IS_WEB ? {
      background: 'linear-gradient(135deg, #A01818 0%, #7B1010 100%)',
      boxShadow: '0 6px 28px rgba(139,21,21,0.55)',
    } as any : { backgroundColor: '#A01818' }),
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backLinkTxt: { color: GOLD, fontSize: 14, fontWeight: '600' },

  copy: {
    color: 'rgba(212,175,55,0.25)', fontSize: 11,
    marginTop: 28, textAlign: 'center',
  },
});
