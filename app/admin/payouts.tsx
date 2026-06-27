import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function AdminPayouts() {
  const router = useRouter();
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
      <LinearGradient colors={['#2D1B19', '#630B0B', '#8B1515']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pujari Payouts</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Send PhonePe/UPI to pujaris</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {pujaris.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No pujari payout data yet</Text>
          </View>
        )}

        {pujaris.map((p) => (
          <TouchableOpacity key={p.pujari_id} style={styles.card} onPress={() => openHistory(p)} activeOpacity={0.85}>
            <View style={styles.cardRow}>
              <View style={[styles.avatarBadge, { backgroundColor: hasPending(p) ? '#FF6F0020' : '#E8F5E9' }]}>
                <Ionicons name="person" size={22} color={hasPending(p) ? '#FF6F00' : '#2E7D32'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pName}>{p.full_name}</Text>
                <Text style={styles.pMobile}>{p.mobile}</Text>
                {p.upi_id ? (
                  <Text style={styles.pUpi}>UPI: {p.upi_id}</Text>
                ) : (
                  <Text style={[styles.pUpi, { color: '#B71C1C' }]}>No UPI ID set</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.pendingAmt, { color: hasPending(p) ? '#E65100' : '#2E7D32' }]}>
                  ₹{Number(p.pending_amount || 0).toFixed(2)}
                </Text>
                <Text style={styles.pendingLabel}>{hasPending(p) ? 'PENDING' : 'UP TO DATE'}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>Wallet balance: ₹{Number(p.wallet_balance || 0).toFixed(2)}</Text>
              <Text style={styles.footerText}>{p.pending_count || 0} pending item(s)</Text>
            </View>
          </TouchableOpacity>
        ))}
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
                <Ionicons name="phone-portrait" size={18} color="#1565C0" />
                <Text style={styles.upiText}>PhonePe/UPI: <Text style={{ fontWeight: '800' }}>{selected.upi_id}</Text></Text>
              </View>
            ) : (
              <View style={[styles.upiBox, { backgroundColor: '#FFF3E0', borderColor: '#FF6F00' }]}>
                <Ionicons name="warning" size={18} color="#FF6F00" />
                <Text style={[styles.upiText, { color: '#E65100' }]}>No UPI ID — ask pujari to add it in their profile</Text>
              </View>
            )}

            <View style={styles.amtSummary}>
              <Text style={styles.amtLabel}>Pending to Pay</Text>
              <Text style={styles.amtValue}>₹{Number(selected?.pending_amount || 0).toFixed(2)}</Text>
            </View>

            {!showPay ? (
              Number(selected?.pending_amount || 0) > 0 ? (
                <TouchableOpacity style={styles.payBtn} onPress={() => setShowPay(true)}>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.payBtnText}>Mark as Paid via PhonePe</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.upToDate}>
                  <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                  <Text style={{ color: '#2E7D32', fontWeight: '600', marginLeft: 8 }}>All payments up to date</Text>
                </View>
              )
            ) : (
              <View style={styles.payForm}>
                <Text style={styles.payFormLabel}>Enter PhonePe / UPI Transaction ID</Text>
                <TextInput
                  value={payRef}
                  onChangeText={setPayRef}
                  placeholder="e.g. TXN123456789"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.payFormInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.payBtn} onPress={markPaid} disabled={paying}>
                  {paying ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.payBtnText}>Confirm — ₹{Number(selected?.pending_amount || 0).toFixed(2)} Paid</Text>
                    </>
                  )}
                </TouchableOpacity>
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
                        color={h.status === 'paid' ? '#2E7D32' : '#FF6F00'}
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.histDesc} numberOfLines={1}>{h.description}</Text>
                        {h.payment_ref ? <Text style={styles.histRef}>Ref: {h.payment_ref}</Text> : null}
                        <Text style={styles.histDate}>{h.created_at ? new Date(h.created_at).toLocaleDateString('en-IN') : ''}</Text>
                      </View>
                      <Text style={[styles.histAmt, { color: h.status === 'paid' ? '#2E7D32' : '#E65100' }]}>
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
  header: { paddingTop: 8, paddingBottom: 22, paddingHorizontal: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: theme.colors.secondary, fontSize: 13, textAlign: 'center', marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: theme.colors.textMuted, fontSize: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  pName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  pMobile: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  pUpi: { fontSize: 11, color: '#1565C0', marginTop: 2 },
  pendingAmt: { fontSize: 18, fontWeight: '800' },
  pendingLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 12,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  footerText: { fontSize: 11, color: theme.colors.textMuted },

  mBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  mCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 22, maxHeight: '90%',
  },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },

  upiBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: '#E3F2FD', borderRadius: 12, borderWidth: 1, borderColor: '#1565C0', marginBottom: 16,
  },
  upiText: { fontSize: 13, color: '#1565C0', flex: 1 },

  amtSummary: { alignItems: 'center', marginBottom: 16 },
  amtLabel: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600', letterSpacing: 1 },
  amtValue: { fontSize: 36, fontWeight: '800', color: '#E65100', marginTop: 4 },

  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 14, marginBottom: 8,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  upToDate: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14,
    backgroundColor: '#E8F5E9', borderRadius: 12, marginBottom: 8,
  },

  payForm: { marginBottom: 8 },
  payFormLabel: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600', marginBottom: 8 },
  payFormInput: {
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.text,
    backgroundColor: '#fff', marginBottom: 12,
  },

  historyTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  histRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  histDesc: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
  histRef: { fontSize: 11, color: '#1565C0', marginTop: 2 },
  histDate: { fontSize: 10, color: theme.colors.textMuted, marginTop: 1 },
  histAmt: { fontSize: 14, fontWeight: '700' },
});
