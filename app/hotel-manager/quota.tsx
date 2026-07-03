import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

const IS_WEB = Platform.OS === 'web';
const GOLD = '#C9922A';
const MAROON = '#7A3020';

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
      <LinearGradient colors={['#3D1408', MAROON, '#9A4130']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Room Quota</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>{prop ? prop.name : 'Loading…'}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} />}
      >
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

            <View style={styles.card}>
              {!!msg && (
                <View style={[styles.msgBox, { backgroundColor: msg.type === 'success' ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Ionicons
                    name={msg.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    size={18}
                    color={msg.type === 'success' ? '#2E7D32' : '#C62828'}
                  />
                  <Text style={{ color: msg.type === 'success' ? '#2E7D32' : '#C62828', fontSize: 13, flex: 1 }}>{msg.text}</Text>
                </View>
              )}

              <View style={{ marginBottom: 14 }}>
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

              <View style={{ marginBottom: 14 }}>
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

              <View style={{ marginBottom: 14 }}>
                <Text style={styles.label}>Rooms Available per Night</Text>
                <TextInput style={styles.input} value={form.quota} onChangeText={(v) => setForm({ ...form, quota: v.replace(/\D/g, '') })} placeholder="10" placeholderTextColor={theme.colors.textMuted} keyboardType="numeric" />
              </View>

              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSetQuota} disabled={loading}>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>{loading ? 'Saving…' : 'Apply Quota'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 8, paddingBottom: 22, paddingHorizontal: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 4 },

  noProp: { alignItems: 'center', marginTop: 80, padding: 24 },
  noPropTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginTop: 20 },
  noPropSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },

  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  catList: { gap: 10, marginBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: theme.colors.border },
  catChipActive: { backgroundColor: MAROON, borderColor: MAROON },
  catChipText: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },
  catChipPrice: { fontSize: 13, fontWeight: '600', color: GOLD },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  msgBox: { borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.text, backgroundColor: '#FAFAFA' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: MAROON, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
