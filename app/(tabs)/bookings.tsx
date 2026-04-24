import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function Bookings() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings/mine');
      setItems(data);
    } catch {}
  }, []);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.sub}>Your sacred pooja & homam reservations</Text>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => (
          <View testID={`booking-card-${item.id}`} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={[styles.typeBadge, { backgroundColor: item.pooja_type === 'homam' ? '#FFF3E0' : '#FFEBEE' }]}>
                <Ionicons
                  name={item.pooja_type === 'homam' ? 'flame' : 'flower'}
                  size={12}
                  color={item.pooja_type === 'homam' ? '#E65100' : '#8B1515'}
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
                  onPress={() => Alert.alert('Booking confirmed', `Razorpay Payment ID: ${item.razorpay_payment_id || 'N/A'}`)}
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
          </View>
        )}
        ListEmptyComponent={
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
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#8B1515', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
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
    marginTop: 16, backgroundColor: theme.colors.primary,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
  },
  browseBtnText: { color: '#fff', fontWeight: '700' },
});
