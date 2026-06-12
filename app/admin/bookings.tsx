import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function AllBookings() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'unassigned'>('all');
  const [assignFor, setAssignFor] = useState<any | null>(null);
  const [pujaris, setPujaris] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings');
      setItems(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAssign = async (b: any) => {
    setAssignFor(b);
    try {
      const { data } = await api.get('/users', { params: { role: 'poojari' } });
      setPujaris(data);
    } catch (e) {
      Alert.alert('Failed to load pujaris', apiError(e));
      setPujaris([]);
    }
  };

  const doAssign = async (pujariId: string) => {
    if (!assignFor) return;
    setAssigning(true);
    try {
      await api.put(`/bookings/${assignFor.id}/assign-pujari`, null, { params: { pujari_id: pujariId } });
      setAssignFor(null);
      load();
      Alert.alert('Assigned', 'Pujari has been assigned to this booking.');
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally { setAssigning(false); }
  };

  const filtered = items.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return b.payment_status === 'paid';
    if (filter === 'unassigned') return !b.pujari_id;
    return b.payment_status === 'pending';
  });

  const totalRevenue = items.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + (b.amount || 0), 0);
  const unassignedCount = items.filter((b) => !b.pujari_id).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity testID="bmg-back" onPress={() => safeBack('/admin')} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>All Bookings</Text>
        <View style={styles.back} />
      </LinearGradient>

      <View style={styles.summary}>
        <View style={styles.sumCard}>
          <Text style={styles.sumLabel}>TOTAL</Text>
          <Text style={styles.sumValue}>{items.length}</Text>
        </View>
        <View style={styles.sumCard}>
          <Text style={styles.sumLabel}>REVENUE</Text>
          <Text style={[styles.sumValue, { color: theme.colors.secondary }]}>₹{totalRevenue.toFixed(0)}</Text>
        </View>
        <View style={[styles.sumCard, unassignedCount > 0 && { borderColor: '#E65100' }]}>
          <Text style={styles.sumLabel}>UNASSIGNED</Text>
          <Text style={[styles.sumValue, { color: unassignedCount > 0 ? '#E65100' : '#2E7D32', fontSize: 18 }]}>
            {unassignedCount}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {(['all', 'paid', 'pending', 'unassigned'] as const).map((f) => (
          <TouchableOpacity key={f} testID={`bmg-filter-${f}`} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View testID={`bmg-item-${item.id}`} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.pooja_name}</Text>
              <Text style={styles.meta}>{item.devotee_name} • {item.user_mobile}</Text>
              {item.gotra ? <Text style={styles.sub}>Gotra: {item.gotra}</Text> : null}
              <Text style={styles.sub}>
                {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </Text>
              {item.pujari_name ? (
                <View style={styles.pujariTag}>
                  <Ionicons name="person-circle" size={13} color={theme.colors.primary} />
                  <Text style={styles.pujariTagText}>{item.pujari_name}</Text>
                </View>
              ) : (
                <View style={styles.unassignedTag}>
                  <Ionicons name="alert-circle-outline" size={12} color="#E65100" />
                  <Text style={styles.unassignedText}>Unassigned</Text>
                </View>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amt}>₹{item.amount?.toFixed(0)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.payment_status === 'paid' ? '#E8F5E9' : '#FFF8E1' }]}>
                <Text style={[styles.statusText, { color: item.payment_status === 'paid' ? '#2E7D32' : '#E65100' }]}>
                  {item.payment_status === 'paid' ? '✓ PAID' : 'PENDING'}
                </Text>
              </View>
              <TouchableOpacity
                testID={`assign-pujari-${item.id}`}
                onPress={() => openAssign(item)}
                style={styles.assignBtn}
              >
                <Ionicons name="person-add" size={12} color="#fff" />
                <Text style={styles.assignBtnText}>{item.pujari_id ? 'Reassign' : 'Assign Pujari'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
      />

      <Modal visible={!!assignFor} transparent animationType="slide" onRequestClose={() => setAssignFor(null)}>
        <View style={styles.mBackdrop}>
          <View style={styles.mCard}>
            <Text style={styles.mTitle}>Assign Pujari</Text>
            <Text style={styles.mSub}>{assignFor?.pooja_name} • {assignFor?.devotee_name}</Text>
            {assignFor?.pujari_name && (
              <View style={styles.currentPujari}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={styles.currentPujariText}>Currently: {assignFor.pujari_name}</Text>
              </View>
            )}
            <ScrollView style={{ maxHeight: 360, marginTop: 14 }}>
              {pujaris.length === 0 ? (
                <Text style={styles.mEmpty}>No pujaris registered yet. Super-admin can add them.</Text>
              ) : null}
              {pujaris.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  testID={`assign-pujari-pick-${p.id}`}
                  disabled={assigning}
                  onPress={() => doAssign(p.id)}
                  style={[styles.pujariRow, assignFor?.pujari_id === p.id && { borderColor: theme.colors.primary, borderWidth: 2 }]}
                >
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pujariName}>{p.full_name}</Text>
                    <Text style={styles.pujariMobile}>{p.mobile}</Text>
                  </View>
                  {assignFor?.pujari_id === p.id ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setAssignFor(null)} style={styles.mClose}>
              <Text style={styles.mCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },

  summary: { flexDirection: 'row', padding: 16, gap: 12 },
  sumCard: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border },
  sumLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1 },
  sumValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 4 },

  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 11, fontWeight: '700', color: theme.colors.text },
  chipTextActive: { color: '#fff' },

  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  sub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  amt: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40 },

  assignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 6,
  },
  assignBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  mBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  mCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '85%' },
  mTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  mSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  currentPujari: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#E8F5E9', padding: 8, borderRadius: 8 },
  currentPujariText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  mEmpty: { textAlign: 'center', color: theme.colors.textMuted, padding: 24, fontSize: 13 },
  pujariRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pujariName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  pujariMobile: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  mClose: { marginTop: 14, backgroundColor: '#F5F5F5', paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  mCloseText: { color: theme.colors.text, fontWeight: '700' },

  pujariTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5,
    backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  pujariTagText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  unassignedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5,
    backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  unassignedText: { fontSize: 11, fontWeight: '700', color: '#E65100' },
});
