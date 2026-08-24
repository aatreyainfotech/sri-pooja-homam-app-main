import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Alert, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
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

export default function AdminPayouts() {
  const safeBack = useSafeBack();
  const [pujaris, setPujaris] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [payRef, setPayRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [showPay, setShowPay] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/pujari-payouts');
      setPujaris(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openHistory = async (p: any) => {
    setSelected(p);
    setPayRef('');
    setShowPay(false);
    try {
      const { data } = await api.get(`/admin/pujari-payouts/${p.pujari_id}/history`);
      setHistory(data);
    } catch {
      setHistory([]);
    }
  };

  const markPaid = async () => {
    if (!payRef.trim()) {
      Alert.alert('Required', 'Enter PhonePe/UPI transaction ID');
      return;
    }
    if (!selected) return;
    setPaying(true);
    try {
      const { data } = await api.post(`/admin/pujari-payouts/${selected.pujari_id}/pay`, { payment_ref: payRef.trim() });
      Alert.alert('Payment Marked', `₹${Number(data.paid_amount || 0).toFixed(2)} marked as paid to ${data.pujari_name}`);
      setSelected(null);
      load();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setPaying(false);
    }
  };

  const hasPending = (p: any) => Number(p.pending_amount || 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Pujari Payouts" subtitle="Send PhonePe/UPI to pujaris" onBack={() => safeBack('/admin')} />

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40, alignItems: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <ResponsiveContainer maxWidth={900}>
          {pujaris.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No pujari payout data yet</Text>
            </View>
          )}

          {pujaris.map((p) => (
            <TouchableOpacity key={p.pujari_id} onPress={() => openHistory(p)} activeOpacity={0.85}>
              <Surface elevation="sm" padding="md" radius="lg" style={{ marginBottom: theme.spacing.sm + 4 }}>
                <View style={styles.cardRow}>
                  <View style={[styles.avatarBadge, { backgroundColor: hasPending(p) ? '#FF6F0020' : theme.statusColors.success.bg }]}>
                    <Ionicons name="person" size={22} color={hasPending(p) ? theme.statusColors.warning.text : theme.statusColors.success.text} />
                  </View>
                  <View style={{ flex: 1, marginLeft: theme.spacing.sm + 4 }}>
                    <Text style={styles.pName}>{p.full_name}</Text>
                    <Text style={styles.pMobile}>{p.mobile}</Text>
                    {p.upi_id ? (
                      <Text style={styles.pUpi}>UPI: {p.upi_id}</Text>
                    ) : (
                      <Text style={[styles.pUpi, { color: theme.colors.danger }]}>No UPI ID set</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.pendingAmt, { color: hasPending(p) ? theme.statusColors.warning.text : theme.statusColors.success.text }]}>
                      ₹{Number(p.pending_amount || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.pendingLabel}>{hasPending(p) ? 'PENDING' : 'UP TO DATE'}</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>Wallet balance: ₹{Number(p.wallet_balance || 0).toFixed(2)}</Text>
                  <Text style={styles.footerText}>{p.pending_count || 0} pending item(s)</Text>
                </View>
              </Surface>
            </TouchableOpacity>
          ))}
        </ResponsiveContainer>
      </ScrollView>

      {/* Pujari detail / pay modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.mBackdrop}>
          <View style={styles.mCard}>
            <View style={styles.mHeader}>
              <Text style={styles.mTitle}>{selected?.full_name}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selected?.upi_id ? (
              <View style={styles.upiBox}>
                <Ionicons name="phone-portrait" size={18} color={theme.statusColors.info.text} />
                <Text style={styles.upiText}>PhonePe/UPI: <Text style={{ fontWeight: '800' }}>{selected.upi_id}</Text></Text>
              </View>
            ) : (
              <View style={[styles.upiBox, { backgroundColor: theme.statusColors.warning.bg, borderColor: theme.statusColors.warning.text }]}>
                <Ionicons name="warning" size={18} color={theme.statusColors.warning.text} />
                <Text style={[styles.upiText, { color: theme.statusColors.warning.text }]}>No UPI ID — ask pujari to add it in their profile</Text>
              </View>
            )}

            <View style={styles.amtSummary}>
              <Text style={styles.amtLabel}>Pending to Pay</Text>
              <Text style={styles.amtValue}>₹{Number(selected?.pending_amount || 0).toFixed(2)}</Text>
            </View>

            {!showPay ? (
              Number(selected?.pending_amount || 0) > 0 ? (
                <Button title="Mark as Paid via PhonePe" icon="send" variant="primary" size="lg" fullWidth onPress={() => setShowPay(true)} style={{ marginBottom: theme.spacing.sm }} />
              ) : (
                <View style={styles.upToDate}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.statusColors.success.text} />
                  <Text style={{ color: theme.statusColors.success.text, fontWeight: '600', marginLeft: 8 }}>All payments up to date</Text>
                </View>
              )
            ) : (
              <View style={styles.payForm}>
                <Input
                  label="Enter PhonePe / UPI Transaction ID"
                  value={payRef}
                  onChangeText={setPayRef}
                  placeholder="e.g. TXN123456789"
                  autoCapitalize="characters"
                />
                <Button
                  title={`Confirm — ₹${Number(selected?.pending_amount || 0).toFixed(2)} Paid`}
                  icon="checkmark-circle"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={paying}
                  onPress={markPaid}
                  style={{ marginBottom: theme.spacing.sm }}
                />
                <TouchableOpacity onPress={() => setShowPay(false)} style={{ alignItems: 'center', paddingTop: 8 }}>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {history.length > 0 && (
              <>
                <Text style={styles.historyTitle}>Transaction History</Text>
                <ScrollView style={{ maxHeight: 250 }}>
                  {history.map((h: any) => (
                    <View key={h.id} style={styles.histRow}>
                      <Ionicons
                        name={h.status === 'paid' ? 'checkmark-circle' : 'time'}
                        size={16}
                        color={h.status === 'paid' ? theme.statusColors.success.text : theme.statusColors.warning.text}
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.histDesc} numberOfLines={1}>{h.description}</Text>
                        {h.payment_ref ? <Text style={styles.histRef}>Ref: {h.payment_ref}</Text> : null}
                        <Text style={styles.histDate}>{h.created_at ? new Date(h.created_at).toLocaleDateString('en-IN') : ''}</Text>
                      </View>
                      <Text style={[styles.histAmt, { color: h.status === 'paid' ? theme.statusColors.success.text : theme.statusColors.warning.text }]}>
                        ₹{Number(h.amount || 0).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: theme.colors.textMuted, fontSize: 14 },

  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  pName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  pMobile: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  pUpi: { fontSize: 11, color: theme.statusColors.info.text, marginTop: 2 },
  pendingAmt: { fontSize: 18, fontWeight: '800' },
  pendingLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm + 4,
    paddingTop: theme.spacing.sm + 2, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  footerText: { fontSize: 11, color: theme.colors.textMuted },

  mBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  mCard: {
    backgroundColor: theme.colors.white, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg + 2, maxHeight: '90%',
  },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  mTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },

  upiBox: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.sm + 4,
    backgroundColor: theme.statusColors.info.bg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.statusColors.info.text, marginBottom: theme.spacing.md,
  },
  upiText: { fontSize: 13, color: theme.statusColors.info.text, flex: 1 },

  amtSummary: { alignItems: 'center', marginBottom: theme.spacing.md },
  amtLabel: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600', letterSpacing: 1 },
  amtValue: { fontSize: 36, fontWeight: '800', color: theme.statusColors.warning.text, marginTop: 4 },

  upToDate: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.sm + 6,
    backgroundColor: theme.statusColors.success.bg, borderRadius: theme.radius.md, marginBottom: theme.spacing.sm,
  },

  payForm: { marginBottom: theme.spacing.sm },

  historyTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm + 2 },
  histRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  histDesc: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
  histRef: { fontSize: 11, color: theme.statusColors.info.text, marginTop: 2 },
  histDate: { fontSize: 10, color: theme.colors.textMuted, marginTop: 1 },
  histAmt: { fontSize: 14, fontWeight: '700' },
});
