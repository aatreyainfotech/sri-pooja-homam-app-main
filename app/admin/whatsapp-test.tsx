import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function WhatsAppTest() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    if (!mobile.trim() || mobile.trim().length < 10) {
      Alert.alert('Required', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/admin/whatsapp-test', {
        mobile: mobile.trim(),
        otp: '123456',
      });
      setResult(data);
    } catch (e) {
      setResult({ error: apiError(e) });
    } finally {
      setLoading(false);
    }
  };

  const isOk = result?.ok === true;
  const hasError = result && !isOk;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        <Text style={s.title}>WhatsApp Diagnostics</Text>
      </View>

      <ScrollView contentContainerStyle={s.body}>

        {/* Status card */}
        <View style={[s.statusCard, isOk ? s.cardOk : hasError ? s.cardErr : s.cardNeutral]}>
          <Ionicons
            name={isOk ? 'checkmark-circle' : hasError ? 'close-circle' : 'information-circle-outline'}
            size={32}
            color={isOk ? '#2E7D32' : hasError ? '#C62828' : '#555'}
          />
          <Text style={[s.statusText, isOk ? s.txtOk : hasError ? s.txtErr : s.txtNeutral]}>
            {result === null
              ? 'Enter a mobile number and tap Send Test to check WhatsApp connectivity'
              : isOk
              ? `✅ WhatsApp is working! OTP sent to +91 ${mobile}`
              : `❌ WhatsApp delivery failed — see error below`}
          </Text>
        </View>

        {/* Mobile input */}
        <View style={s.section}>
          <Text style={s.label}>TEST MOBILE NUMBER</Text>
          <View style={s.inputRow}>
            <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
            <TextInput
              value={mobile}
              onChangeText={setMobile}
              placeholder="10-digit mobile number"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              style={s.input}
            />
          </View>
          <Text style={s.hint}>This will send OTP "123456" via WhatsApp to verify the connection.</Text>
        </View>

        <TouchableOpacity style={s.btn} onPress={runTest} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={s.btnText}>Send Test OTP</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Raw API response */}
        {result !== null && (
          <View style={s.section}>
            <Text style={s.label}>META API RESPONSE</Text>
            <View style={s.codeBox}>
              <Text style={s.code}>{JSON.stringify(result, null, 2)}</Text>
            </View>
          </View>
        )}

        {/* Checklist */}
        <View style={s.section}>
          <Text style={s.label}>AZURE APP SETTINGS REQUIRED</Text>
          {[
            { name: 'META_WHATSAPP_TOKEN', note: 'Must be a permanent System User token (not temp)' },
            { name: 'META_PHONE_NUMBER_ID', note: 'Your WhatsApp Business phone number ID' },
            { name: 'META_OTP_TEMPLATE_NAME', note: 'e.g. sri_otp' },
            { name: 'META_OTP_TEMPLATE_LANG', note: 'e.g. en_US' },
            { name: 'META_OTP_TEMPLATE_HAS_BUTTON', note: 'true if Authentication template has Copy Code button' },
            { name: 'META_WELCOME_TEMPLATE_NAME', note: 'e.g. sri_welcome' },
            { name: 'META_WELCOME_TEMPLATE_LANG', note: 'e.g. en_US' },
            { name: 'META_BOOKING_TEMPLATE_NAME', note: 'e.g. sri_bc (for payment confirmation)' },
            { name: 'META_BOOKING_TEMPLATE_LANG', note: 'e.g. en_US' },
          ].map((v) => (
            <View key={v.name} style={s.varRow}>
              <Ionicons name="key-outline" size={14} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.varName}>{v.name}</Text>
                <Text style={s.varNote}>{v.note}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Token refresh instructions */}
        <View style={s.section}>
          <Text style={s.label}>IF TOKEN EXPIRED</Text>
          <Text style={s.step}>1. Go to developers.facebook.com → Tools → Graph API Explorer</Text>
          <Text style={s.step}>2. Select your WhatsApp app → Generate token</Text>
          <Text style={s.step}>3. OR: Meta Business Manager → System Users → Generate New Token</Text>
          <Text style={s.step}>4. Copy the new token → Azure Portal → sripoojahomam → Configuration → META_WHATSAPP_TOKEN → Update</Text>
          <Text style={s.step}>5. Click Save → your backend restarts in ~30 seconds</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#8B1515', paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { marginRight: 4 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1 },

  body: { padding: 16, paddingBottom: 40, gap: 16 },

  statusCard: {
    borderRadius: 16, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, borderWidth: 1,
  },
  cardNeutral: { backgroundColor: '#F5F5F5', borderColor: '#ddd' },
  cardOk: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  cardErr: { backgroundColor: '#FFEBEE', borderColor: '#EF9A9A' },
  statusText: { flex: 1, fontSize: 13, lineHeight: 19 },
  txtNeutral: { color: '#555' },
  txtOk: { color: '#1B5E20', fontWeight: '600' },
  txtErr: { color: '#B71C1C', fontWeight: '600' },

  section: { gap: 10 },
  label: {
    fontSize: 11, fontWeight: '800', color: theme.colors.textMuted,
    letterSpacing: 1.2, marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.colors.text },
  hint: { fontSize: 12, color: theme.colors.textMuted, fontStyle: 'italic' },

  btn: {
    backgroundColor: '#25D366', borderRadius: 999, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  codeBox: {
    backgroundColor: '#1C1C1C', borderRadius: 12, padding: 14,
    maxHeight: 300,
  },
  code: { color: '#A5D6A7', fontSize: 11, fontFamily: 'monospace', lineHeight: 17 },

  varRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  varName: { fontSize: 12, fontWeight: '800', color: theme.colors.text, fontFamily: 'monospace' },
  varNote: { fontSize: 11, color: theme.colors.textMuted, marginTop: 1 },

  step: {
    fontSize: 13, color: theme.colors.text, lineHeight: 20,
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    borderWidth: 1, borderColor: theme.colors.border,
  },
});
