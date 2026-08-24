import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import StatTile from '../../src/components/ui/StatTile';

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
      <ScreenHeader title="Pujari Summary" onBack={() => safeBack('/admin')} />

      <ResponsiveContainer maxWidth={900} style={{ flex: 1, alignSelf: 'center' }}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="person-outline" size={44} color={theme.colors.textMuted} />
              <Text style={styles.empty}>No pujaris found</Text>
              <Text style={styles.emptySub}>Create pujari accounts from Manage Users</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Surface elevation="sm" padding="md" radius="lg">
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: theme.spacing.sm + 4 }}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  <Text style={styles.mobile}>+91 {item.mobile}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <StatTile variant="mini" label="Assigned" value={item.total_assigned || 0} color={theme.statusColors.info.text} />
                <StatTile variant="mini" label="Completed" value={item.total_paid || 0} color={theme.statusColors.success.text} />
                <StatTile variant="mini" label="Poojas" value={item.pooja_count || 0} color={theme.statusColors.warning.text} />
                <StatTile variant="mini" label="Homams" value={item.homam_count || 0} color={theme.colors.danger} />
              </View>

              <View style={styles.earningsRow}>
                <View>
                  <Text style={styles.earningLabel}>Pujari Earnings (70%)</Text>
                  <Text style={styles.earningValue}>₹{Number(item.total_earned || 0).toFixed(2)}</Text>
                </View>
                <Ionicons name="cash" size={22} color={theme.statusColors.success.text} />
              </View>
            </Surface>
          )}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyBox: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  empty: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptySub: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm + 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#5E35B1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  mobile: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', gap: theme.spacing.sm, backgroundColor: theme.colors.bgPaper,
    borderRadius: theme.radius.md, padding: theme.spacing.sm + 4, marginBottom: theme.spacing.sm + 4,
  },
  earningsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.statusColors.success.bg, borderRadius: theme.radius.sm + 4, padding: theme.spacing.sm + 4,
  },
  earningLabel: { fontSize: 12, color: theme.statusColors.success.text, fontWeight: '600' },
  earningValue: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginTop: 2 },
});
