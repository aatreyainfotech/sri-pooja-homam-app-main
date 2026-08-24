import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';
import Chip from '../../src/components/ui/Chip';
import Badge from '../../src/components/ui/Badge';

const ROLE_STATUS: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
  super_admin: 'warning',
  admin: 'info',
  devotee: 'success',
  poojari: 'neutral',
};

export default function ManageUsers() {
  const safeBack = useSafeBack();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'devotee' | 'admin' | 'super_admin' | 'poojari'>('all');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      setItems(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = (u: any) => {
    Alert.alert(
      u.is_active ? 'Deactivate User?' : 'Activate User?',
      `${u.full_name} (${u.mobile})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: u.is_active ? 'Deactivate' : 'Activate',
          style: u.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.put(`/users/${u.id}/status`, { is_active: !u.is_active });
              load();
            } catch (e) { Alert.alert('Failed', apiError(e)); }
          },
        },
      ],
    );
  };

  const changeRole = (u: any) => {
    const next = u.role === 'devotee' ? 'admin' : 'devotee';
    Alert.alert('Change Role?', `Change ${u.full_name} to ${next}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.put(`/users/${u.id}/role`, null, { params: { role: next } });
            load();
          } catch (e) { Alert.alert('Failed', apiError(e)); }
        },
      },
    ]);
  };

  const filtered = items.filter((u) => {
    const matchQ = !q || u.full_name.toLowerCase().includes(q.toLowerCase()) || u.mobile.includes(q);
    const matchR = filter === 'all' || u.role === filter;
    return matchQ && matchR;
  });

  const roleCounts = {
    all: items.length,
    devotee: items.filter((u) => u.role === 'devotee').length,
    admin: items.filter((u) => u.role === 'admin').length,
    super_admin: items.filter((u) => u.role === 'super_admin').length,
    poojari: items.filter((u) => u.role === 'poojari').length,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader title="Manage Users" onBack={() => safeBack('/admin')} />

      <ResponsiveContainer maxWidth={900} style={{ flex: 1, alignSelf: 'center' }}>
        <View style={styles.toolbar}>
          <Input testID="umg-search" icon="search-outline" value={q} onChangeText={setQ} placeholder="Search name or mobile..." containerStyle={{ marginBottom: 0 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {([
                { key: 'all', label: 'ALL' },
                { key: 'devotee', label: 'DEVOTEE' },
                { key: 'poojari', label: 'PUJARI' },
                { key: 'admin', label: 'ADMIN' },
                { key: 'super_admin', label: 'SUPER ADMIN' },
              ] as const).map(({ key, label }) => (
                <Chip
                  key={key}
                  testID={`umg-filter-${key}`}
                  label={`${label} (${roleCounts[key]})`}
                  selected={filter === key}
                  onPress={() => setFilter(key)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm + 2 }}
          renderItem={({ item }) => (
            <Surface testID={`umg-item-${item.id}`} elevation="sm" padding="sm" radius="lg" style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: theme.spacing.sm + 4 }}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.sub}>+91 {item.mobile}</Text>
                <Text style={styles.subE}>{item.email}</Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.xs + 2, marginTop: theme.spacing.xs + 2 }}>
                  <Badge label={item.role.replace('_', ' ').toUpperCase()} status={ROLE_STATUS[item.role] ?? 'neutral'} size="sm" />
                  <Badge label={item.is_active ? '✓ ACTIVE' : '✗ INACTIVE'} status={item.is_active ? 'success' : 'danger'} size="sm" />
                </View>
              </View>
              {item.role !== 'super_admin' && (
                <View style={{ gap: theme.spacing.xs + 2 }}>
                  <TouchableOpacity
                    testID={`umg-toggle-${item.id}`}
                    onPress={() => toggle(item)}
                    style={[styles.actBtn, { backgroundColor: item.is_active ? theme.statusColors.danger.bg : theme.statusColors.success.bg }]}
                  >
                    <Ionicons
                      name={item.is_active ? 'ban' : 'checkmark'}
                      size={14}
                      color={item.is_active ? theme.colors.danger : theme.statusColors.success.text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity testID={`umg-role-${item.id}`} onPress={() => changeRole(item)} style={styles.actBtn}>
                    <Ionicons name="shield-half" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </Surface>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: theme.spacing.md, gap: theme.spacing.sm + 2 },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm },

  card: { flexDirection: 'row' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  name: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  subE: { fontSize: 11, color: theme.colors.textMuted },
  actBtn: { backgroundColor: theme.statusColors.neutral.bg, padding: 8, borderRadius: theme.radius.sm + 2 },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40 },
});
