import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function CreatePujari() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const [form, setForm] = useState({ full_name: '', mobile: '', email: '', password: '', city: '' });
  const [showPw, setShowPw] = useState(false);
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
    { key: 'full_name', label: 'FULL NAME', placeholder: 'e.g. Pandit Ramachandra Sharma', icon: 'person' },
    { key: 'mobile', label: 'MOBILE NUMBER', placeholder: '10-digit mobile', icon: 'call', keyboard: 'numeric' as any },
    { key: 'email', label: 'EMAIL (optional)', placeholder: 'pujari@example.com', icon: 'mail' },
    { key: 'city', label: 'CITY (optional)', placeholder: 'e.g. Hyderabad', icon: 'location' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/admin/users')} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Pujari Account</Text>
        <View style={styles.back} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#1565C0" />
            <Text style={styles.infoText}>
              Pujari accounts are created by Super Admin only. Pujaris cannot self-register.
            </Text>
          </View>

          {fields.map(({ key, label, placeholder, icon, keyboard }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputRow}>
                <Ionicons name={icon as any} size={18} color={theme.colors.textMuted} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.input}
                  value={(form as any)[key]}
                  onChangeText={f(key)}
                  placeholder={placeholder}
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType={keyboard || 'default'}
                  autoCapitalize="none"
                />
              </View>
            </View>
          ))}

          <View>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed" size={18} color={theme.colors.textMuted} style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.input}
                value={form.password}
                onChangeText={f('password')}
                placeholder="Min. 6 characters"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ paddingHorizontal: 12 }}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={save} style={styles.saveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Create Pujari Account</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#E3F2FD',
    borderRadius: 12, padding: 14, alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: '#1565C0', fontSize: 13 },
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: theme.colors.border, borderRadius: 12, backgroundColor: '#fff',
  },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 13, fontSize: 15, color: theme.colors.text },
  saveBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
