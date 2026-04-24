import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function AllBookings() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings');
      setItems(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = items.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return b.payment_status === 'paid';
    return b.payment_status === 'pending';
  });

  const totalRevenue = items.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + (b.amount || 0), 0);

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
          <Text style={styles.sumLabel}>TOTAL BOOKINGS</Text>
          <Text style={styles.sumValue}>{items.length}</Text>
        </View>
        <View style={styles.sumCard}>
          <Text style={styles.sumLabel}>REVENUE</Text>
          <Text style={[styles.sumValue, { color: theme.colors.secondary }]}>₹{totalRevenue.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {(['all', 'paid', 'pending'] as const).map((f) => (
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
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amt}>₹{item.amount?.toFixed(0)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.payment_status === 'paid' ? '#E8F5E9' : '#FFF8E1' }]}>
                <Text style={[styles.statusText, { color: item.payment_status === 'paid' ? '#2E7D32' : '#E65100' }]}>
                  {item.payment_status === 'paid' ? '✓ PAID' : 'PENDING'}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
      />
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
});
