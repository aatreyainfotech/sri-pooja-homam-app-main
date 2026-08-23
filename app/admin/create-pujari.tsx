import { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

export default function CreatePujari() {
  const safeBack = useSafeBack();
  const [form, setForm] = useState({ full_name: '', mobile: '', email: '', password: '', city: '' });
  const [saving, setSaving] = useState(false);

  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.full_name || !form.mobile || !form.password) {
      Alert.alert('Required', 'Full name, mobile and password are required');
      return;
    }
    if (form.mobile.length !== 10) {
      Alert.alert('Invalid', 'Mobile must be 10 digits');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Invalid', 'Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/create-pujari', form);
      Alert.alert('✅ Done', `Pujari account created for ${form.full_name}`, [
        { text: 'OK', onPress: () => safeBack('/admin/users') },
      ]);
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'full_name', label: 'Full Name', placeholder: 'e.g. Pandit Ramachandra Sharma', icon: 'person-outline' as const },
    { key: 'mobile', label: 'Mobile Number', placeholder: '10-digit mobile', icon: 'call-outline' as const, keyboard: 'numeric' as const },
    { key: 'email', label: 'Email (optional)', placeholder: 'pujari@example.com', icon: 'mail-outline' as const },
    { key: 'city', label: 'City (optional)', placeholder: 'e.g. Hyderabad', icon: 'location-outline' as const },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader title="Create Pujari Account" onBack={() => safeBack('/admin/users')} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, alignItems: 'center' }}>
          <ResponsiveContainer maxWidth={520}>
            <Surface elevation="sm" padding="md" radius="lg" style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={theme.statusColors.info.text} />
              <Text style={styles.infoText}>
                Pujari accounts are created by Super Admin only. Pujaris cannot self-register.
              </Text>
            </Surface>

            {fields.map(({ key, label, placeholder, icon, keyboard }) => (
              <Input
                key={key}
                label={label}
                icon={icon}
                value={(form as any)[key]}
                onChangeText={f(key)}
                placeholder={placeholder}
                keyboardType={keyboard || 'default'}
                autoCapitalize="none"
              />
            ))}

            <Input
              label="Password"
              icon="lock-closed-outline"
              value={form.password}
              onChangeText={f('password')}
              placeholder="Min. 6 characters"
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title="Create Pujari Account"
              icon="person-add"
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              onPress={save}
              style={{ marginTop: theme.spacing.xs }}
            />
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row', gap: theme.spacing.sm,
    backgroundColor: theme.statusColors.info.bg,
    alignItems: 'flex-start', marginBottom: theme.spacing.md,
  },
  infoText: { flex: 1, color: theme.statusColors.info.text, fontSize: 13 },
});
