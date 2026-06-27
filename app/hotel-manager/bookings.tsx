import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

const BLUE = '#0288D1';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#E8F5E9', text: '#2E7D32' },
  pending_payment: { bg: '#FFF3E0', text: '#E65100' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
};

export default function HotelManagerBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (filter) params.status = filter;
      const res = await api.get('/accommodation-bookings', { params });
      setBookings(res.data);
    } catch {}
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }: any) => {
    const sc = STATUS_COLORS[item.status] || { bg: '#F5F5F5', text: '#5A5A5A' };
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.guestName}>{item.guest_name}</Text>
            <Text style={styles.guestPhone}>{item.guest_mobile}</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {(item.status || '').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>CHECK-IN</Text>
            <Text style={styles.dateValue}>{String(item.check_in).slice(0, 10)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.textMuted} />
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>CHECK-OUT</Text>
            <Text style={styles.dateValue}>{String(item.check_out).slice(0, 10)}</Text>
          </View>
          <View style={styles.nightsChip}>
            <Text style={styles.nightsText}>{item.total_nights}N</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.room_category_name || 'Room'}</Text>
          <Text style={styles.metaText}>👥 {item.guests} guests · 🛏 {item.rooms} rooms</Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>₹{parseFloat(item.amount || 0).toFixed(0)}</Text>
        </View>

        {item.special_requests ? (
          <Text style={styles.requests} numberOfLines={2}>📝 {item.special_requests}</Text>
        ) : null}

        <Text style={styles.bookedOn}>Booked: {String(item.created_at).slice(0, 10)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookings</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>{bookings.length} total</Text>
      </LinearGradient>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {[
          { label: 'All', value: '' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Pending', value: 'pending_payment' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={theme.colors.border} />
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 8, paddingBottom: 22, paddingHorizontal: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 4 },

  filterRow: { flexDirection: 'row', gap: 8, padding: 14, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1.5, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  filterTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  guestName: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  guestPhone: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },

  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  dateCol: { flex: 1 },
  dateLabel: { fontSize: 9, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 2 },
  dateValue: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  nightsChip: { backgroundColor: BLUE + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  nightsText: { fontSize: 13, fontWeight: '800', color: BLUE },

  metaRow: { gap: 4, marginBottom: 12 },
  metaText: { fontSize: 12, color: theme.colors.textMuted },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FBFF', borderRadius: 10, padding: 12, marginBottom: 8 },
  amountLabel: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '900', color: BLUE },

  requests: { fontSize: 12, color: theme.colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  bookedOn: { fontSize: 11, color: theme.colors.textMuted },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: theme.colors.textMuted, fontSize: 16, marginTop: 16 },
});
