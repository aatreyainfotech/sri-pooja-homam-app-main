import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { palette, theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

const IS_WEB = Platform.OS === 'web';
const GOLD = theme.colors.secondary;
const MAROON = theme.colors.primary;

export default function HotelManagerQuota() {
  const router = useRouter();
  const [prop, setProp] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [form, setForm] = useState({ from_date: '', to_date: '', quota: '10' });
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/hotel-manager/dashboard');
      const p = res.data.property;
      setProp(p);
      if (p) {
        const cats = await api.get(`/properties/${p.id}/categories`);
        const active = (cats.data || []).filter((c: any) => c.is_active);
        setCategories(active);
        setSelectedCat((prev: any) => prev || active[0] || null);
      }
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSetQuota = async () => {
    setMsg(null);
    if (!selectedCat) { setMsg({ type: 'error', text: 'Select a room type first.' }); return; }
    if (!form.from_date || !form.to_date) { setMsg({ type: 'error', text: 'Select a date range.' }); return; }
    const dates: string[] = [];
    const cur = new Date(form.from_date);
    const end = new Date(form.to_date);
    if (isNaN(cur.getTime()) || isNaN(end.getTime())) { setMsg({ type: 'error', text: 'Enter valid dates (YYYY-MM-DD).' }); return; }
    if (end < cur) { setMsg({ type: 'error', text: 'To Date must be after From Date.' }); return; }
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    if (dates.length > 90) { setMsg({ type: 'error', text: 'Max 90 days at once.' }); return; }
    setLoading(true);
    try {
      await api.post('/quotas/set', {
        room_category_id: selectedCat.id,
        dates,
        quota: parseInt(form.quota) || 0,
      });
      setMsg({ type: 'success', text: `Quota set for ${dates.length} day(s) — ${parseInt(form.quota) || 0} rooms/night` });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.detail || 'Failed to set quota' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Set Room Quota"
        subtitle={prop ? prop.name : 'Loading…'}
        gradientColors={[palette.maroonDeep, palette.maroon, palette.maroonLight]}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40, alignItems: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} />}
      >
        <ResponsiveContainer maxWidth={640}>
          {!prop ? (
            <View style={styles.noProp}>
              <Ionicons name="bed-outline" size={60} color={theme.colors.border} />
              <Text style={styles.noPropTitle}>No Property Assigned</Text>
              <Text style={styles.noPropSub}>Contact your super admin to assign a property to your account.</Text>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.noProp}>
              <Ionicons name="albums-outline" size={60} color={theme.colors.border} />
              <Text style={styles.noPropTitle}>No Room Types Yet</Text>
              <Text style={styles.noPropSub}>Ask your super admin to add room categories before you can set quotas.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Room Type</Text>
              <View style={styles.catList}>
                {categories.map((cat) => {
                  const active = selectedCat?.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, active && styles.catChipActive]}
                      onPress={() => setSelectedCat(cat)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="bed-outline" size={16} color={active ? '#fff' : MAROON} />
                      <Text style={[styles.catChipText, active && { color: '#fff' }]}>{cat.name}</Text>
                      <Text style={[styles.catChipPrice, active && { color: 'rgba(255,255,255,0.85)' }]}>₹{parseFloat(cat.price_per_night).toFixed(0)}/night</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Surface elevation="sm" padding="md" radius="lg">
                {!!msg && (
                  <View style={[styles.msgBox, { backgroundColor: msg.type === 'success' ? theme.statusColors.success.bg : theme.statusColors.danger.bg }]}>
                    <Ionicons
                      name={msg.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                      size={18}
                      color={msg.type === 'success' ? theme.statusColors.success.text : theme.statusColors.danger.text}
                    />
                    <Text style={{ color: msg.type === 'success' ? theme.statusColors.success.text : theme.statusColors.danger.text, fontSize: 13, flex: 1 }}>{msg.text}</Text>
                  </View>
                )}

                <View style={{ marginBottom: theme.spacing.sm + 4 }}>
                  <Text style={styles.label}>From Date</Text>
                  {IS_WEB ? (
                    <input
                      type="date"
                      value={form.from_date}
                      onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                      style={{ border: '1.5px solid #E0D5C5', borderRadius: 12, padding: '11px 14px', fontSize: 15, color: '#3D1C02', backgroundColor: '#FAFAFA', width: '100%', boxSizing: 'border-box' } as any}
                    />
                  ) : (
                    <TextInput style={styles.input} value={form.from_date} onChangeText={(v) => setForm({ ...form, from_date: v })} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
                  )}
                </View>

                <View style={{ marginBottom: theme.spacing.sm + 4 }}>
                  <Text style={styles.label}>To Date</Text>
                  {IS_WEB ? (
                    <input
                      type="date"
                      value={form.to_date}
                      onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                      style={{ border: '1.5px solid #E0D5C5', borderRadius: 12, padding: '11px 14px', fontSize: 15, color: '#3D1C02', backgroundColor: '#FAFAFA', width: '100%', boxSizing: 'border-box' } as any}
                    />
                  ) : (
                    <TextInput style={styles.input} value={form.to_date} onChangeText={(v) => setForm({ ...form, to_date: v })} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
                  )}
                </View>

                <Input
                  label="Rooms Available per Night"
                  value={form.quota}
                  onChangeText={(v) => setForm({ ...form, quota: v.replace(/\D/g, '') })}
                  placeholder="10"
                  keyboardType="numeric"
                />

                <Button
                  title={loading ? 'Saving…' : 'Apply Quota'}
                  icon="calendar-outline"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleSetQuota}
                  style={{ backgroundColor: MAROON, marginTop: theme.spacing.xs }}
                />
              </Surface>
            </>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  noProp: { alignItems: 'center', marginTop: 80, padding: 24 },
  noPropTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginTop: 20 },
  noPropSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },

  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  catList: { gap: theme.spacing.sm + 2, marginBottom: theme.spacing.lg - 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 2, backgroundColor: theme.colors.white, borderRadius: theme.radius.sm + 6, paddingHorizontal: theme.spacing.sm + 6, paddingVertical: theme.spacing.sm + 6, borderWidth: 1.5, borderColor: theme.colors.border },
  catChipActive: { backgroundColor: MAROON, borderColor: MAROON },
  catChipText: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },
  catChipPrice: { fontSize: 13, fontWeight: '600', color: GOLD },

  msgBox: { borderRadius: theme.radius.sm + 4, padding: theme.spacing.sm + 4, marginBottom: theme.spacing.sm + 6, flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.sm + 6, paddingVertical: theme.spacing.sm + 3, fontSize: 15, color: theme.colors.text, backgroundColor: '#FAFAFA' },
});
