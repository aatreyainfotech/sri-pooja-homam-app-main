import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function PujariDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number; transactions: any[] }>({ balance: 0, transactions: [] });
  const [completing, setCompleting] = useState<any | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const submitComplete = async () => {
    if (!completing) return;
    if (!videoUrl.trim()) { Alert.alert('Video URL required', 'Please paste the completion video URL'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bookings/${completing.id}/complete`, { video_url: videoUrl.trim() });
      Alert.alert('Pooja completed', `\u20b9${Number(data.credited || 0).toFixed(2)} credited to your wallet.`);
      setCompleting(null); setVideoUrl('');
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
              <Text style={[styles.earnLabel, { marginTop: 2 }]}>{wallet.transactions?.length || 0} payouts</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.earnGrad}>
            <Ionicons name="cash" size={28} color="#A5D6A7" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.earnLabel}>My Earnings (70% of total)</Text>
              <Text style={styles.earnValue}>₹{(stats.total_earned || 0).toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </View>

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
                onPress={() => { setCompleting(b); setVideoUrl(''); }}
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
            <Text style={styles.mTitle}>Complete Pooja</Text>
            <Text style={styles.mSub}>{completing?.pooja_name}</Text>
            <Text style={styles.mLabel}>Completion Video URL</Text>
            <TextInput
              testID="complete-video-url-input"
              placeholder="https://..."
              placeholderTextColor={theme.colors.textMuted}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              keyboardType="url"
              style={styles.mInput}
            />
            <Text style={styles.mHint}>
              Submitting will mark this booking complete and credit ₹{Number(completing?.pujari_amount || 0).toFixed(2)} to your wallet.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setCompleting(null)} style={[styles.mBtn, styles.mBtnGhost]}>
                <Text style={styles.mBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="complete-submit-btn"
                onPress={submitComplete}
                disabled={submitting}
                style={[styles.mBtn, styles.mBtnPrimary, submitting && { opacity: 0.6 }]}
              >
                <Text style={styles.mBtnPrimaryText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
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

  mBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  mCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  mTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  mSub: { fontSize: 13, color: theme.colors.primary, marginTop: 2, fontWeight: '600' },
  mLabel: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  mInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: theme.colors.text },
  mHint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 8, lineHeight: 16 },
  mBtn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  mBtnGhost: { backgroundColor: '#F5F5F5' },
  mBtnGhostText: { color: theme.colors.text, fontWeight: '700' },
  mBtnPrimary: { backgroundColor: theme.colors.primary },
  mBtnPrimaryText: { color: '#fff', fontWeight: '700' },
});
