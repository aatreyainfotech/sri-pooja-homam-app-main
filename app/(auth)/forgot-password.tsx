import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

const IS_WEB = Platform.OS === 'web';

export default function ForgotPassword() {
  const router = useRouter();
  const [mobile, setMobile]   = useState('');
  const [loading, setLoading] = useState(false);

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
      colors={theme.gradients.hero}
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
            <Ionicons name="lock-open-outline" size={32} color={theme.colors.secondary} />
          </View>

          <Text style={w.title}>Forgot Password?</Text>
          <Text style={w.sub}>
            Enter your registered mobile number.{'\n'}We'll send an OTP via WhatsApp.
          </Text>

          {/* Glass form card */}
          <GlassCard style={w.formCard}>
            <Input
              icon="call-outline"
              tone="onDark"
              value={mobile}
              onChangeText={setMobile}
              placeholder="Mobile number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Button
              title="Send WhatsApp OTP"
              icon="logo-whatsapp"
              variant="secondary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={send}
              style={{ marginBottom: theme.spacing.md }}
            />

            <TouchableOpacity onPress={() => router.back()} style={w.backLink}>
              <Ionicons name="arrow-back-outline" size={14} color={theme.colors.secondary} />
              <Text style={w.backLinkTxt}>Back to Sign In</Text>
            </TouchableOpacity>
          </GlassCard>

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
  },

  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backLinkTxt: { color: theme.colors.secondary, fontSize: 14, fontWeight: '600' },

  copy: {
    color: 'rgba(212,175,55,0.25)', fontSize: 11,
    marginTop: 28, textAlign: 'center',
  },
});
