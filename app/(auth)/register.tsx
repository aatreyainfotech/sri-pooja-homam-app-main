import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import Surface from '../../src/components/ui/Surface';

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
    <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark, theme.colors.bgDark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity testID="register-back-btn" onPress={() => safeBack('/(auth)/login')} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#FDFBF7" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Sri Pooja Homam family</Text>

            <Surface elevation="lg" padding="lg" radius="xl" style={styles.card}>
              {fields.map((f) => (
                <Input
                  key={f.key}
                  testID={`register-${f.key}-input`}
                  icon={f.icon}
                  value={form[f.key]}
                  onChangeText={(v) => set(f.key, v)}
                  placeholder={f.label}
                  keyboardType={f.keyboardType ?? 'default'}
                  secureTextEntry={!!f.secure}
                  autoCapitalize={f.key === 'email' ? 'none' : 'sentences'}
                  maxLength={f.maxLen}
                />
              ))}

              <Button
                testID="register-submit-btn"
                title="Send WhatsApp OTP"
                icon="logo-whatsapp"
                iconPosition="right"
                variant="secondary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={onSubmit}
                style={{ marginTop: theme.spacing.xs }}
              />

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
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24, paddingBottom: 40,
    ...(Platform.OS === 'web' ? { maxWidth: 520, alignSelf: 'center', width: '100%' } as any : {}),
  },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 2 },
  backText: { color: '#FDFBF7', fontSize: 15 },
  title: { ...theme.typography.h1, color: theme.colors.secondary, marginTop: 8 },
  subtitle: { fontSize: 14, color: 'rgba(253,251,247,0.7)', marginBottom: 20 },
  card: {
    backgroundColor: theme.colors.bgPaper,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  info: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, marginTop: 14 },
  legalNote: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    marginTop: 16, paddingHorizontal: 4,
  },
  legalText: { fontSize: 12, color: theme.colors.textMuted },
  legalLink: { fontSize: 12, color: theme.colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
});
