import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function Register() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const [form, setForm] = useState({
    full_name: '', mobile: '', email: '', address: '', city: '', pincode: '', password: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    for (const [k, v] of Object.entries(form)) {
      if (!v.trim()) {
        Alert.alert('Required', `Please fill ${k.replace('_', ' ')}`);
        return;
      }
    }
    if (form.mobile.length !== 10) {
      Alert.alert('Invalid', 'Mobile must be 10 digits');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      const params: any = { mobile: form.mobile };
      if (data.otp_mock) params.otp_mock = data.otp_mock;
      if (data.delivery_failed) params.delivery_failed = '1';
      if (data.delivery_failed) {
        Alert.alert(
          'WhatsApp Delivery Failed',
          'Registration saved, but OTP could not be sent via WhatsApp.\n\nPlease tap "Resend OTP" on the next screen to try again.',
          [{ text: 'OK', onPress: () => router.push({ pathname: '/(auth)/verify-otp', params }) }]
        );
      } else {
        router.push({ pathname: '/(auth)/verify-otp', params });
      }
    } catch (e) {
      Alert.alert('Registration failed', apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; icon: any; keyboardType?: any; secure?: boolean; maxLen?: number }[] = [
    { key: 'full_name', label: 'Full Name', icon: 'person-outline' },
    { key: 'mobile', label: 'Mobile Number', icon: 'call-outline', keyboardType: 'phone-pad', maxLen: 10 },
    { key: 'email', label: 'Email', icon: 'mail-outline', keyboardType: 'email-address' },
    { key: 'address', label: 'Full Address', icon: 'home-outline' },
    { key: 'city', label: 'City', icon: 'location-outline' },
    { key: 'pincode', label: 'Pincode', icon: 'keypad-outline', keyboardType: 'number-pad', maxLen: 6 },
    { key: 'password', label: 'Password', icon: 'lock-closed-outline', secure: true },
  ];

  return (
    <LinearGradient colors={['#8B1515', '#630B0B', '#2D1B19']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity testID="register-back-btn" onPress={() => safeBack('/(auth)/login')} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#FDFBF7" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Sri Pooja Homam family</Text>

            <View style={styles.card}>
              {fields.map((f) => (
                <View key={f.key} style={styles.inputWrap}>
                  <Ionicons name={f.icon} size={20} color={theme.colors.primary} />
                  <TextInput
                    testID={`register-${f.key}-input`}
                    value={form[f.key]}
                    onChangeText={(v) => set(f.key, v)}
                    placeholder={f.label}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType={f.keyboardType ?? 'default'}
                    secureTextEntry={!!f.secure}
                    autoCapitalize={f.key === 'email' ? 'none' : 'sentences'}
                    maxLength={f.maxLen}
                    style={styles.input}
                  />
                </View>
              ))}

              <TouchableOpacity testID="register-submit-btn" style={styles.btnPrimary} onPress={onSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.btnPrimaryText}>Send WhatsApp OTP</Text>
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.info}>📱 We'll send a 6-digit OTP to verify your mobile</Text>

              <View style={styles.legalNote}>
                <Text style={styles.legalText}>By registering you agree to our </Text>
                <Link href="/legal/terms" asChild>
                  <TouchableOpacity><Text style={styles.legalLink}>Terms of Service</Text></TouchableOpacity>
                </Link>
                <Text style={styles.legalText}>, </Text>
                <Link href="/legal/privacy-policy" asChild>
                  <TouchableOpacity><Text style={styles.legalLink}>Privacy Policy</Text></TouchableOpacity>
                </Link>
                <Text style={styles.legalText}> and </Text>
                <Link href="/legal/refund" asChild>
                  <TouchableOpacity><Text style={styles.legalLink}>Refund Policy</Text></TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 2 },
  backText: { color: '#FDFBF7', fontSize: 15 },
  title: { fontSize: 30, fontWeight: '700', color: theme.colors.secondary, marginTop: 8 },
  subtitle: { fontSize: 14, color: 'rgba(253,251,247,0.7)', marginBottom: 20 },
  card: {
    backgroundColor: theme.colors.bgPaper, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 14, paddingHorizontal: 14,
    marginBottom: 12, backgroundColor: '#fff',
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.colors.text },
  btnPrimary: {
    backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  info: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, marginTop: 14 },
  legalNote: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    marginTop: 16, paddingHorizontal: 4,
  },
  legalText: { fontSize: 12, color: theme.colors.textMuted },
  legalLink: { fontSize: 12, color: theme.colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
});
