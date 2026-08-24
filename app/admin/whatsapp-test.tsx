import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

const WHATSAPP_GREEN = '#25D366';

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
      <ScreenHeader title="WhatsApp Diagnostics" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, alignItems: 'center' }}>
        <ResponsiveContainer maxWidth={640} style={{ gap: theme.spacing.md }}>

          {/* Status card */}
          <Surface
            elevation="sm" padding="md" radius="lg"
            style={[s.statusCard, isOk ? s.cardOk : hasError ? s.cardErr : s.cardNeutral]}
          >
            <Ionicons
              name={isOk ? 'checkmark-circle' : hasError ? 'close-circle' : 'information-circle-outline'}
              size={32}
              color={isOk ? theme.statusColors.success.text : hasError ? theme.statusColors.danger.text : theme.colors.textMuted}
            />
            <Text style={[s.statusText, isOk ? s.txtOk : hasError ? s.txtErr : s.txtNeutral]}>
              {result === null
                ? 'Enter a mobile number and tap Send Test to check WhatsApp connectivity'
                : isOk
                ? `✅ WhatsApp is working! OTP sent to +91 ${mobile}`
                : `❌ WhatsApp delivery failed — see error below`}
            </Text>
          </Surface>

          {/* Mobile input */}
          <View style={s.section}>
            <Input
              label="Test Mobile Number"
              icon="call-outline"
              value={mobile}
              onChangeText={setMobile}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              containerStyle={{ marginBottom: theme.spacing.xs }}
            />
            <Text style={s.hint}>This will send OTP "123456" via WhatsApp to verify the connection.</Text>
          </View>

          <Button
            title="Send Test OTP"
            icon="logo-whatsapp"
            variant="secondary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={runTest}
            style={{ backgroundColor: WHATSAPP_GREEN }}
          />

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

        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center', gap: theme.spacing.sm + 4, borderWidth: 1,
  },
  cardNeutral: { backgroundColor: '#F5F5F5', borderColor: '#ddd' },
  cardOk: { backgroundColor: theme.statusColors.success.bg, borderColor: '#A5D6A7' },
  cardErr: { backgroundColor: theme.statusColors.danger.bg, borderColor: '#EF9A9A' },
  statusText: { flex: 1, fontSize: 13, lineHeight: 19 },
  txtNeutral: { color: '#555' },
  txtOk: { color: '#1B5E20', fontWeight: '600' },
  txtErr: { color: '#B71C1C', fontWeight: '600' },

  section: { gap: theme.spacing.sm + 2 },
  label: {
    fontSize: 11, fontWeight: '800', color: theme.colors.textMuted,
    letterSpacing: 1.2, marginBottom: 2,
  },
  hint: { fontSize: 12, color: theme.colors.textMuted, fontStyle: 'italic' },

  codeBox: {
    backgroundColor: '#1C1C1C', borderRadius: theme.radius.md, padding: theme.spacing.sm + 6,
    maxHeight: 300,
  },
  code: { color: '#A5D6A7', fontSize: 11, fontFamily: 'monospace', lineHeight: 17 },

  varRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm,
    backgroundColor: theme.colors.white, borderRadius: theme.radius.sm + 4, padding: theme.spacing.sm + 2,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  varName: { fontSize: 12, fontWeight: '800', color: theme.colors.text, fontFamily: 'monospace' },
  varNote: { fontSize: 11, color: theme.colors.textMuted, marginTop: 1 },

  step: {
    fontSize: 13, color: theme.colors.text, lineHeight: 20,
    backgroundColor: theme.colors.white, borderRadius: theme.radius.sm + 4, padding: theme.spacing.sm + 2,
    borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    borderWidth: 1, borderColor: theme.colors.border,
  },
});
