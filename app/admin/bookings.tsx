import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import StatTile from '../../src/components/ui/StatTile';
import Chip from '../../src/components/ui/Chip';
import Badge from '../../src/components/ui/Badge';

export default function AllBookings() {
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
      <ScreenHeader title="All Bookings" onBack={() => safeBack('/admin')} />

      <ResponsiveContainer maxWidth={900} style={{ flex: 1, alignSelf: 'center' }}>
        <View style={styles.summary}>
          <StatTile label="Total" value={items.length} variant="mini" color={theme.colors.text} />
          <StatTile label="Revenue" value={`₹${totalRevenue.toFixed(0)}`} variant="mini" color={theme.colors.secondaryDark} />
          <StatTile
            label="Unassigned"
            value={unassignedCount}
            variant="mini"
            color={unassignedCount > 0 ? theme.statusColors.warning.text : theme.statusColors.success.text}
          />
        </View>

        <View style={styles.chipRow}>
          {(['all', 'paid', 'pending', 'unassigned'] as const).map((f) => (
            <Chip key={f} label={f.toUpperCase()} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm + 2 }}
          renderItem={({ item }) => {
            const slot = item.scheduled_at || item.created_at;
            const slotDate = slot
              ? new Date(slot).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '-';
            const slotTime = slot
              ? new Date(slot).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
              : '-';

            return (
              <Surface testID={`bmg-item-${item.id}`} elevation="sm" padding="sm" radius="lg" style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.pooja_name}</Text>
                  <Text style={styles.meta}>{item.devotee_name} • {item.user_mobile}</Text>
                  {item.gotra ? <Text style={styles.sub}>Gotra: {item.gotra}</Text> : null}
                  <Text style={styles.sub}>Pooja Date: {slotDate}</Text>
                  <Text style={styles.sub}>Pooja Time: {slotTime}</Text>
                  {item.pujari_name ? (
                    <Badge label={item.pujari_name} status="warning" size="sm" style={{ marginTop: 5 }} />
                  ) : (
                    <Badge label="Unassigned" status="warning" size="sm" style={{ marginTop: 5 }} />
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amt}>₹{item.amount?.toFixed(0)}</Text>
                  <Badge
                    label={item.payment_status === 'paid' ? '✓ PAID' : 'PENDING'}
                    status={item.payment_status === 'paid' ? 'success' : 'warning'}
                    style={{ marginTop: 4 }}
                  />
                  <TouchableOpacity
                    testID={`assign-pujari-${item.id}`}
                    onPress={() => openAssign(item)}
                    style={styles.assignBtn}
                  >
                    <Ionicons name="person-add" size={12} color="#fff" />
                    <Text style={styles.assignBtnText}>{item.pujari_name ? 'Reassign' : 'Assign Pujari'}</Text>
                  </TouchableOpacity>
                </View>
              </Surface>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
        />
      </ResponsiveContainer>

      <Modal visible={!!assignFor} transparent animationType="slide" onRequestClose={() => setAssignFor(null)}>
        <View style={styles.mBackdrop}>
          <View style={styles.mCard}>
            <Text style={styles.mTitle}>Assign Pujari</Text>
            <Text style={styles.mSub}>{assignFor?.pooja_name} • {assignFor?.devotee_name}</Text>
            {assignFor?.pujari_name && (
              <View style={styles.currentPujari}>
                <Ionicons name="checkmark-circle" size={14} color={theme.statusColors.success.text} />
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
  summary: { flexDirection: 'row', padding: theme.spacing.md, gap: theme.spacing.sm + 2 },

  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md },

  card: { flexDirection: 'row' },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  sub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  amt: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40 },

  assignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.full, marginTop: 6,
  },
  assignBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  mBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  mCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, padding: theme.spacing.lg, maxHeight: '85%' },
  mTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  mSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  currentPujari: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: theme.statusColors.success.bg, padding: 8, borderRadius: theme.radius.sm + 2 },
  currentPujariText: { fontSize: 12, color: theme.statusColors.success.text, fontWeight: '600' },
  mEmpty: { textAlign: 'center', color: theme.colors.textMuted, padding: 24, fontSize: 13 },
  pujariRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 4, padding: theme.spacing.sm + 4,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pujariName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  pujariMobile: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  mClose: { marginTop: 14, backgroundColor: '#F5F5F5', paddingVertical: 12, borderRadius: theme.radius.full, alignItems: 'center' },
  mCloseText: { color: theme.colors.text, fontWeight: '700' },
});
