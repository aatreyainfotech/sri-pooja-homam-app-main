import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function PujariStats() {
  const safeBack = useSafeBack();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/pujari-summary');
      setItems(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/admin')} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Pujari Summary</Text>
        <View style={styles.back} />
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="person-outline" size={44} color={theme.colors.textMuted} />
            <Text style={styles.empty}>No pujaris found</Text>
            <Text style={styles.emptySub}>Create pujari accounts from Manage Users</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.mobile}>+91 {item.mobile}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <MiniStat label="Assigned" value={item.total_assigned || 0} color="#1976D2" />
              <MiniStat label="Completed" value={item.total_paid || 0} color="#2E7D32" />
              <MiniStat label="Poojas" value={item.pooja_count || 0} color="#E65100" />
              <MiniStat label="Homams" value={item.homam_count || 0} color="#D32F2F" />
            </View>

            <View style={styles.earningsRow}>
              <View>
                <Text style={styles.earningLabel}>Pujari Earnings (70%)</Text>
                <Text style={styles.earningValue}>₹{Number(item.total_earned || 0).toFixed(2)}</Text>
              </View>
              <Ionicons name="cash" size={22} color="#2E7D32" />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniVal, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  empty: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptySub: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#5E35B1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  mobile: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FAFAFA',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  miniStat: { alignItems: 'center', gap: 2 },
  miniVal: { fontSize: 18, fontWeight: '800' },
  miniLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '600' },
  earningsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12,
  },
  earningLabel: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  earningValue: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginTop: 2 },
});
