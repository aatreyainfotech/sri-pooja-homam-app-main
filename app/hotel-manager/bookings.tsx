import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Chip from '../../src/components/ui/Chip';
import Badge from '../../src/components/ui/Badge';

const BLUE = '#0288D1';
const HOTEL_GRADIENT: [string, string, string] = ['#4A2C2A', '#0277BD', BLUE];

const STATUS_MAP: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  confirmed: 'success',
  pending_payment: 'warning',
  cancelled: 'danger',
};

export default function HotelManagerBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (filter) params.status = filter;
      const res = await api.get('/accommodation-bookings', { params });
      const sorted = [...res.data].sort((a, b) =>
        new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
      );
      setBookings(sorted);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }: any) => {
    return (
      <ResponsiveContainer maxWidth={900}>
        <Surface elevation="sm" padding="md" radius="lg">
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.guestName}>{item.guest_name}</Text>
              <Text style={styles.guestPhone}>{item.guest_mobile}</Text>
            </View>
            <Badge label={(item.status || '').replace('_', ' ').toUpperCase()} status={STATUS_MAP[item.status] ?? 'neutral'} />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="people-outline" size={13} color={theme.colors.textMuted} />
                <Text style={styles.metaText}>{item.guests} guests</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="bed-outline" size={13} color={theme.colors.textMuted} />
                <Text style={styles.metaText}>{item.rooms} rooms</Text>
              </View>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>₹{parseFloat(item.amount || 0).toFixed(0)}</Text>
          </View>

          {item.special_requests ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={theme.colors.textMuted} style={{ marginTop: 1 }} />
              <Text style={[styles.requests, { flex: 1, marginBottom: 0 }]} numberOfLines={2}>{item.special_requests}</Text>
            </View>
          ) : null}

          <Text style={styles.bookedOn}>Booked: {String(item.created_at).slice(0, 10)}</Text>
        </Surface>
      </ResponsiveContainer>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Bookings" subtitle={`${bookings.length} total`} gradientColors={HOTEL_GRADIENT} onBack={() => router.back()} />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {[
          { label: 'All', value: '' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Pending', value: 'pending_payment' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} accentColor={BLUE} />
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="receipt-outline" size={40} color={BLUE + '40'} />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40, alignItems: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color={theme.colors.border} />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                {filter ? `No ${filter.replace('_', ' ')} bookings` : 'Bookings will appear here once guests make reservations'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, padding: theme.spacing.sm + 6, paddingBottom: 4 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  guestName: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  guestPhone: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm + 4 },

  datesRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 4, marginBottom: theme.spacing.sm + 2 },
  dateCol: { flex: 1 },
  dateLabel: { fontSize: 9, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 2 },
  dateValue: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  nightsChip: { backgroundColor: BLUE + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full },
  nightsText: { fontSize: 13, fontWeight: '800', color: BLUE },

  metaRow: { gap: 4, marginBottom: theme.spacing.sm + 4 },
  metaText: { fontSize: 12, color: theme.colors.textMuted },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FBFF', borderRadius: theme.radius.sm + 4, padding: theme.spacing.sm + 4, marginBottom: theme.spacing.sm },
  amountLabel: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '900', color: BLUE },

  requests: { fontSize: 12, color: theme.colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  bookedOn: { fontSize: 11, color: theme.colors.textMuted },

  loadingWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  loadingText: { color: theme.colors.textMuted, fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginTop: 16 },
});
