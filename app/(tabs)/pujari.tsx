import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function PujariDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number; pending_payout: number; total_paid_out: number; transactions: any[] }>({ balance: 0, pending_payout: 0, total_paid_out: 0, transactions: [] });
  const [completing, setCompleting] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startingLive, setStartingLive] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, b, w] = await Promise.all([
        api.get('/pujari/stats'),
        api.get('/pujari/bookings'),
        api.get('/pujari/wallet'),
      ]);
      setStats(s.data);
      setBookings(b.data);
      setWallet(w.data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const startLive = async () => {
    if (!completing) return;
    setStartingLive(true);
    try {
      const { data: stream } = await api.post(`/pujari/start-live/${completing.id}`);
      setCompleting(null);
      router.push(`/live-broadcast/${stream.id}` as any);
    } catch (e) {
      Alert.alert('Cannot start live', apiError(e));
    } finally {
      setStartingLive(false);
    }
  };

  const submitComplete = async () => {
    if (!completing) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bookings/${completing.id}/complete`, { video_url: '' });
      Alert.alert('\ud83d\ude4f Pooja Completed!', `\u20b9${Number(data.credited || 0).toFixed(2)} has been credited to your wallet.`);
      setCompleting(null);
      load();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#2D1B19', '#630B0B', '#8B1515']} style={styles.header}>
        <Text style={styles.headerTitle}>My Poojas & Homams</Text>
        <Text style={styles.headerSub}>Welcome, {user?.full_name}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="calendar" color="#1976D2" label="Total Assigned" value={stats.total_assigned || 0} />
          <StatCard icon="checkmark-circle" color="#2E7D32" label="Completed" value={stats.total_paid || 0} />
          <StatCard icon="flower" color="#E65100" label="Poojas" value={stats.pooja_count || 0} />
          <StatCard icon="flame" color="#D32F2F" label="Homams" value={stats.homam_count || 0} />
        </View>

        {/* Wallet card */}
        <View style={styles.walletCard}>
          <LinearGradient colors={['#0D47A1', '#1565C0']} style={styles.earnGrad}>
            <Ionicons name="wallet" size={28} color="#90CAF9" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.earnLabel}>Wallet Balance</Text>
              <Text style={styles.earnValue}>₹{(wallet.balance || 0).toFixed(2)}</Text>
              <Text style={[styles.earnLabel, { marginTop: 2 }]}>Pending payout: ₹{(wallet.pending_payout || 0).toFixed(2)}</Text>
            </View>
            <Ionicons name="information-circle-outline" size={20} color="#90CAF9" />
          </LinearGradient>
        </View>

        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.earnGrad}>
            <Ionicons name="cash" size={28} color="#A5D6A7" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.earnLabel}>Total Paid Out (PhonePe/UPI)</Text>
              <Text style={styles.earnValue}>₹{(wallet.total_paid_out || 0).toFixed(2)}</Text>
              <Text style={[styles.earnLabel, { marginTop: 2 }]}>My share 70% of bookings</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Transaction history */}
        {wallet.transactions?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {wallet.transactions.map((t: any) => (
              <View key={t.id} style={styles.txnCard}>
                <View style={styles.txnRow}>
                  <Ionicons
                    name={t.status === 'paid' ? 'checkmark-circle' : 'time'}
                    size={18}
                    color={t.status === 'paid' ? '#2E7D32' : '#FF6F00'}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.txnDesc} numberOfLines={2}>{t.description || 'Pooja Earnings'}</Text>
                    <Text style={styles.txnDate}>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : ''}</Text>
                    {t.status === 'paid' && t.payment_ref ? (
                      <Text style={styles.txnRef}>Ref: {t.payment_ref}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txnAmt}>₹{Number(t.amount || 0).toFixed(2)}</Text>
                    <View style={[styles.txnBadge, { backgroundColor: t.status === 'paid' ? '#E8F5E9' : '#FFF3E0' }]}>
                      <Text style={[styles.txnBadgeText, { color: t.status === 'paid' ? '#2E7D32' : '#E65100' }]}>
                        {t.status === 'paid' ? 'PAID' : 'PENDING'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Assigned Bookings</Text>

        {bookings.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={40} color={theme.colors.textMuted} />
            <Text style={styles.empty}>No bookings assigned yet</Text>
            <Text style={styles.emptySub}>Admin will assign poojas/homams to you</Text>
          </View>
        )}

        {bookings.map((b) => (
          <View key={b.id} style={styles.bookingCard}>
            <View style={styles.bookingRow}>
              <Text style={styles.bookingName} numberOfLines={1}>{b.pooja_name}</Text>
              <Text style={[
                styles.badge,
                { backgroundColor: b.payment_status === 'paid' ? '#E8F5E9' : '#FFF8E1',
                  color: b.payment_status === 'paid' ? '#2E7D32' : '#F57F17' }
              ]}>
                {b.payment_status === 'paid' ? '✓ PAID' : '⏳ PENDING'}
              </Text>
            </View>
            <Text style={styles.bookingMeta}>Devotee: {b.devotee_name || b.user_name || '—'}</Text>
            <Text style={styles.bookingMeta}>
              Type: <Text style={{ fontWeight: '700', textTransform: 'uppercase' }}>{b.pooja_type}</Text>
            </Text>
            <View style={styles.amtRow}>
              <Text style={styles.amtTotal}>Total: ₹{Number(b.amount || 0).toFixed(2)}</Text>
              <Text style={styles.amtEarned}>My Share: ₹{Number(b.pujari_amount || 0).toFixed(2)}</Text>
            </View>
            {b.payment_status === 'paid' && !b.pujari_paid && !b.completed_at ? (
              <TouchableOpacity
                testID={`complete-booking-${b.id}`}
                style={styles.completeBtn}
                onPress={() => setCompleting(b)}
              >
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={styles.completeBtnText}>Mark Complete & Submit Video</Text>
              </TouchableOpacity>
            ) : null}
            {b.pujari_paid ? (
              <View style={styles.completedRow}>
                <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                <Text style={styles.completedText}>Completed · Paid to wallet</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!completing} transparent animationType="slide" onRequestClose={() => setCompleting(null)}>
        <View style={styles.mBackdrop}>
          <View style={styles.mCard}>
            <View style={styles.mIconRow}>
              <Ionicons name="flower" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.mTitle}>{completing?.pooja_name}</Text>
            <Text style={styles.mSub}>Devotee: {completing?.devotee_name || '—'}</Text>

            <View style={styles.mAmtBox}>
              <Text style={styles.mAmtLabel}>Your Earnings on Completion</Text>
              <Text style={styles.mAmtValue}>₹{Number(completing?.pujari_amount || 0).toFixed(2)}</Text>
              <Text style={[styles.mAmtLabel, { marginTop: 6, color: '#FF6F00', fontSize: 11 }]}>
                Payment via PhonePe/UPI will be released next business day
              </Text>
            </View>

            {/* Go Live button */}
            <TouchableOpacity
              testID="complete-go-live-btn"
              onPress={startLive}
              disabled={startingLive}
              style={[styles.mLiveBtn, startingLive && { opacity: 0.6 }]}
            >
              {startingLive ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="videocam" size={18} color="#fff" />
                  <Text style={styles.mLiveBtnText}>Start Mobile Live Pooja</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.mOrText}>— or —</Text>

            {/* Mark complete without video */}
            <TouchableOpacity
              testID="complete-submit-btn"
              onPress={submitComplete}
              disabled={submitting}
              style={[styles.mCompleteBtn, submitting && { opacity: 0.6 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                  <Text style={styles.mCompleteBtnText}>Pooja Completed — Submit</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCompleting(null)} style={styles.mCancelBtn}>
              <Text style={styles.mCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ icon, color, label, value }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 8, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: theme.colors.secondary, fontSize: 13, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', gap: 6,
  },
  statIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, textAlign: 'center', fontWeight: '600' },

  earningsCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  earnGrad: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  earnLabel: { color: '#A5D6A7', fontSize: 13, fontWeight: '600' },
  earnValue: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },

  emptyBox: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  empty: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptySub: { color: theme.colors.textMuted, fontSize: 12 },

  bookingCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingName: { fontSize: 14, fontWeight: '700', color: theme.colors.text, flex: 1, marginRight: 8 },
  badge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bookingMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  amtRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  amtTotal: { fontSize: 12, color: theme.colors.textMuted },
  amtEarned: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  walletCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: theme.colors.primary, paddingVertical: 11, borderRadius: 999, marginTop: 10,
  },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  completedText: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },

  txnCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  txnRow: { flexDirection: 'row', alignItems: 'flex-start' },
  txnDesc: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  txnDate: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  txnRef: { fontSize: 11, color: '#1565C0', marginTop: 2 },
  txnAmt: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  txnBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  txnBadgeText: { fontSize: 10, fontWeight: '800' },

  mBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  mCard: { backgroundColor: '#fff', borderRadius: 24, padding: 22, gap: 12 },
  mIconRow: { alignItems: 'center', marginBottom: 2 },
  mTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  mSub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },
  mAmtBox: {
    backgroundColor: '#F3F0E8', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  mAmtLabel: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  mAmtValue: { fontSize: 26, fontWeight: '800', color: '#2E7D32', marginTop: 2 },
  mLiveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#C62828', borderRadius: 14, paddingVertical: 14,
  },
  mLiveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  mOrText: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  mCompleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 14,
  },
  mCompleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  mCancelBtn: { alignItems: 'center', paddingVertical: 6 },
  mCancelText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
});
