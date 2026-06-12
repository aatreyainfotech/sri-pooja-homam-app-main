import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

export default function Login() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!mobile.trim() || !password) {
      Alert.alert('Required', 'Enter mobile and password');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { mobile: mobile.trim(), password });
      await setSession(data.token, data.user);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Login failed', apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#8B1515', '#630B0B', '#2D1B19']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.brand}>శ్రీ పూజా హోమం</Text>
              <Text style={styles.brandLatin}>SRI POOJA HOMAM</Text>
              <Text style={styles.sub}>Welcome back, devotee</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSub}>Enter your mobile number and password</Text>

              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  testID="login-mobile-input"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Mobile number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  style={styles.input}
                  maxLength={10}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  testID="login-password-input"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPw}
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity testID="login-submit-btn" style={styles.btnPrimary} onPress={onLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.btnPrimaryText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                testID="login-forgot-link"
                style={styles.forgotBtn}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} /><Text style={styles.dividerText}>New Devotee?</Text><View style={styles.dividerLine} />
              </View>

              <Link href="/(auth)/register" asChild>
                <TouchableOpacity testID="login-register-link" style={styles.btnSecondary}>
                  <Text style={styles.btnSecondaryText}>Create Account</Text>
                </TouchableOpacity>
              </Link>

              <View style={styles.legalRow}>
                <TouchableOpacity onPress={() => router.push('/legal/privacy-policy')}>
                  <Text style={styles.legalLink}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={styles.legalDot}> · </Text>
                <TouchableOpacity onPress={() => router.push('/legal/terms')}>
                  <Text style={styles.legalLink}>Terms</Text>
                </TouchableOpacity>
                <Text style={styles.legalDot}> · </Text>
                <TouchableOpacity onPress={() => router.push('/legal/refund')}>
                  <Text style={styles.legalLink}>Refund</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  logoWrap: {
    width: 96, height: 96, borderRadius: 20, overflow: 'hidden',
    borderWidth: 2, borderColor: theme.colors.secondary, marginBottom: 12,
  },
  logo: { width: '100%', height: '100%' },
  brand: { fontSize: 26, fontWeight: '800', color: theme.colors.secondary, letterSpacing: 0.6 },
  brandLatin: { fontFamily: 'Cinzel-Bold', fontSize: 12, color: theme.colors.secondary, letterSpacing: 3, marginTop: 4, opacity: 0.85 },
  sub: { fontFamily: 'DMSans-Regular', fontSize: 13, color: 'rgba(253,251,247,0.7)', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' },
  card: {
    backgroundColor: theme.colors.bgPaper, borderRadius: 24, padding: 24,
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
    shadowColor: theme.colors.secondary, shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: { fontFamily: 'Cinzel-Bold', fontSize: 24, color: theme.colors.text },
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
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 4, marginTop: 4 },
  forgotText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, flexWrap: 'wrap' },
  legalLink: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
  legalDot: { color: theme.colors.textMuted, fontSize: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  btnSecondary: {
    borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 999, paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
});
