import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import { useResponsive } from '../../src/hooks/useResponsive';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import { useScreenCaptureProtection, useScreenshotWarning } from '../../src/hooks/useScreenCaptureProtection';

export default function Bookings() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDesktop } = useResponsive();
  const numColumns = isDesktop ? 2 : 1;

  useScreenCaptureProtection();
  useScreenshotWarning("Screenshots of payment receipts aren't recommended.");
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/mine');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const payNow = async (b: any) => {
    try {
      // MOCKED razorpay flow: we just confirm payment
      await api.post('/bookings/confirm-payment', { booking_id: b.id });
      Alert.alert('Payment successful! 🙏', `Your ${b.pooja_name} is confirmed.`);
      load();
    } catch (e) {
      Alert.alert('Payment failed', apiError(e));
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="My Bookings" subtitle="Your sacred pooja & homam reservations" />
        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <Ionicons name="receipt-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Sign in to view your bookings</Text>
          <Text style={styles.guestSub}>Log in to see your pooja & homam reservations and receipts.</Text>
          <TouchableOpacity style={styles.guestBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.9}>
            <Text style={styles.guestBtnText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="My Bookings" subtitle="Your sacred pooja & homam reservations" />

      <ResponsiveContainer maxWidth={900} style={{ flex: 1 }}>
        <FlatList
          key={numColumns}
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { gap: 14 } : undefined}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <Surface testID={`booking-card-${item.id}`} elevation="sm" padding="md" radius="lg" style={numColumns > 1 ? { flex: 1 } : undefined}>
              <View style={styles.cardHead}>
                <View style={[styles.typeBadge, { backgroundColor: item.pooja_type === 'homam' ? '#FFF3E0' : 'rgba(122,48,32,0.08)' }]}>
                  <Ionicons
                    name={item.pooja_type === 'homam' ? 'flame' : 'flower'}
                    size={12}
                    color={item.pooja_type === 'homam' ? '#E65100' : theme.colors.primary}
                  />
                  <Text style={styles.typeText}>{item.pooja_type.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.payment_status === 'paid' ? '#E8F5E9' : '#FFF8E1' }]}>
                  <Text style={[styles.statusText, { color: item.payment_status === 'paid' ? '#2E7D32' : '#E65100' }]}>
                    {item.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                  </Text>
                </View>
              </View>

              <Text style={styles.name}>{item.pooja_name}</Text>
              {item.temple_name ? <Text style={styles.devotee}>🛕 {item.temple_name}</Text> : null}
              <Text style={styles.devotee}>For: {item.devotee_name}</Text>
              {item.gotra ? <Text style={styles.meta}>Gotra: {item.gotra}</Text> : null}
              {item.scheduled_at ? (
                <Text style={styles.meta}>
                  📅 {new Date(item.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              ) : null}

              <View style={styles.foot}>
                <Text style={styles.price}>₹{item.amount?.toFixed(0)}</Text>
                {item.payment_status === 'paid' ? (
                  <TouchableOpacity
                    testID={`booking-receipt-${item.id}`}
                    onPress={() => setReceipt(item)}
                    style={styles.btnReceipt}
                  >
                    <Ionicons name="receipt-outline" size={14} color="#fff" />
                    <Text style={styles.btnReceiptText}>Receipt</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    testID={`booking-pay-${item.id}`}
                    onPress={() => payNow(item)}
                    style={styles.btnPay}
                  >
                    <Text style={styles.btnPayText}>Pay Now</Text>
                    <Ionicons name="arrow-forward" size={14} color="#2D1B19" />
                  </TouchableOpacity>
                )}
              </View>
            </Surface>
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.emptySub}>Loading your bookings…</Text>
              </View>
            ) : error ? (
              <View style={styles.empty}>
                <Ionicons name="cloud-offline-outline" size={48} color="#E53935" />
                <Text style={[styles.emptyTitle, { color: '#C62828' }]}>Could Not Load</Text>
                <Text style={styles.emptySub}>{error}</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={load}>
                  <Ionicons name="refresh" size={15} color="#fff" />
                  <Text style={styles.browseBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptySub}>Browse temples to book your first pooja</Text>
                <TouchableOpacity
                  testID="bookings-browse-btn"
                  style={styles.browseBtn}
                  onPress={() => router.push('/(tabs)/temples')}
                >
                  <Text style={styles.browseBtnText}>Browse Temples</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      </ResponsiveContainer>

      <Modal visible={!!receipt} transparent animationType="fade" onRequestClose={() => setReceipt(null)}>
        <View style={styles.mBackdrop}>
          <View style={styles.mCard}>
            <ScrollView contentContainerStyle={{ padding: 22 }} showsVerticalScrollIndicator={false}>
              <View style={styles.mIconWrap}>
                <Ionicons name="checkmark-circle" size={56} color="#2E7D32" />
              </View>
              <Text style={styles.mTitle}>Booking Confirmed</Text>
              <Text style={styles.mSub}>Om Namah Shivaya — your pooja is reserved</Text>

              <View style={styles.mDivider} />

              <Text style={styles.mPooja}>{receipt?.pooja_name}</Text>
              {receipt?.temple_name ? (
                <View style={styles.mTempleRow}>
                  <Ionicons name="business" size={13} color={theme.colors.primary} />
                  <Text style={styles.mTempleText} numberOfLines={2}>{receipt.temple_name}</Text>
                </View>
              ) : null}
              {receipt?.pooja_type ? (
                <View style={[styles.typeBadge, { alignSelf: 'flex-start', marginTop: 4, backgroundColor: receipt?.pooja_type === 'homam' ? '#FFF3E0' : 'rgba(122,48,32,0.08)' }]}>
                  <Ionicons name={receipt?.pooja_type === 'homam' ? 'flame' : 'flower'} size={12} color={receipt?.pooja_type === 'homam' ? '#E65100' : theme.colors.primary} />
                  <Text style={styles.typeText}>{String(receipt?.pooja_type || '').toUpperCase()}</Text>
                </View>
              ) : null}

              <View style={styles.mDivider} />

              <Row k="Booking ID" v={receipt?.id} mono />
              <Row k="Payment ID" v={receipt?.razorpay_payment_id || 'N/A'} mono />
              <Row k="Devotee" v={receipt?.devotee_name} />
              {receipt?.gotra ? <Row k="Gotra" v={receipt.gotra} /> : null}
              {receipt?.nakshatra ? <Row k="Nakshatra" v={receipt.nakshatra} /> : null}
              {receipt?.scheduled_at ? (
                <Row k="Scheduled" v={new Date(receipt.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
              ) : null}
              <Row k="Amount Paid" v={`₹${Number(receipt?.amount || 0).toFixed(2)}`} highlight />
              <Row k="Status" v={(receipt?.status || receipt?.payment_status || '').toUpperCase()} />

              <TouchableOpacity onPress={() => setReceipt(null)} style={styles.mClose} testID="receipt-close-btn">
                <Text style={styles.mCloseText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(122,48,32,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  guestTitle: { fontSize: 19, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  guestSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  guestBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 999, marginTop: 24 },
  guestBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '800', color: theme.colors.primary, letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },

  name: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  devotee: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },

  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  price: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  btnPay: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.secondary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
  },
  btnPayText: { color: '#2D1B19', fontWeight: '700', fontSize: 13 },
  btnReceipt: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
  },
  btnReceiptText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  empty: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginTop: 10 },
  emptySub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, backgroundColor: theme.colors.primary,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
  },
  browseBtnText: { color: '#fff', fontWeight: '700' },

  mBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  mCard: { backgroundColor: '#fff', borderRadius: 24, maxHeight: '90%', borderWidth: 1, borderColor: theme.colors.border },
  mIconWrap: { alignItems: 'center', marginBottom: 4 },
  mTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text, textAlign: 'center', marginTop: 6 },
  mSub: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', marginTop: 4 },
  mDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 14 },
  mPooja: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  mTempleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  mTempleText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600', flex: 1 },
  mRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 },
  mRowK: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
  mRowV: { fontSize: 13, color: theme.colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  mRowVHi: { fontSize: 16, color: theme.colors.primary, fontWeight: '800', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  mRowVMono: { fontFamily: 'monospace' as any, fontSize: 11 },
  mClose: { marginTop: 18, backgroundColor: theme.colors.primary, paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  mCloseText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

function Row({ k, v, mono, highlight }: { k: string; v: any; mono?: boolean; highlight?: boolean }) {
  return (
    <View style={styles.mRow}>
      <Text style={styles.mRowK}>{k}</Text>
      <Text style={[highlight ? styles.mRowVHi : styles.mRowV, mono ? styles.mRowVMono : null]}>{String(v ?? '-')}</Text>
    </View>
  );
}
