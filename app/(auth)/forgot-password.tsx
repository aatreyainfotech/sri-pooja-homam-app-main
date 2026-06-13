import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!mobile.trim() || mobile.trim().length !== 10) {
      Alert.alert('Required', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { mobile: mobile.trim() });
      router.push({
        pathname: '/(auth)/reset-password-otp',
        params: { mobile: mobile.trim(), otp_mock: data.otp_debug || '' },
      } as any);
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
            <Ionicons name="lock-open-outline" size={56} color={theme.colors.secondary} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.sub}>
              Enter your registered mobile number. We'll send an OTP to reset your password.
            </Text>
            <View style={styles.card}>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Mobile number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  style={styles.input}
                  maxLength={10}
                />
              </View>
              <TouchableOpacity style={styles.btn} onPress={send} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={styles.btnText}>Send WhatsApp OTP</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                <Text style={styles.backLinkText}>Back to Sign In</Text>
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
  backLink: { alignItems: 'center', paddingVertical: 4 },
  backLinkText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
});
