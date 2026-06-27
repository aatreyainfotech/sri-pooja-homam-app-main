import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function ManageUsers() {
  const router = useRouter();
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

  const roleColors: any = {
    super_admin: { bg: '#FFF3E0', fg: '#E65100' },
    admin: { bg: '#E3F2FD', fg: '#1565C0' },
    devotee: { bg: '#E8F5E9', fg: '#2E7D32' },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity testID="umg-back" onPress={() => safeBack('/admin')} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
        <View style={styles.back} />
      </LinearGradient>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={theme.colors.textMuted} />
          <TextInput
            testID="umg-search"
            value={q}
            onChangeText={setQ}
            placeholder="Search name or mobile..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.search}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {([
              { key: 'all', label: 'ALL' },
              { key: 'devotee', label: 'DEVOTEE' },
              { key: 'poojari', label: 'PUJARI' },
              { key: 'admin', label: 'ADMIN' },
              { key: 'super_admin', label: 'SUPER ADMIN' },
            ] as const).map(({ key, label }) => (
              <TouchableOpacity key={key} testID={`umg-filter-${key}`} onPress={() => setFilter(key)} style={[styles.chip, filter === key && styles.chipActive]}>
                <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>
                  {label} ({roleCounts[key]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View testID={`umg-item-${item.id}`} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.sub}>+91 {item.mobile}</Text>
              <Text style={styles.subE}>{item.email}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role]?.bg }]}>
                  <Text style={[styles.roleText, { color: roleColors[item.role]?.fg }]}>{item.role.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: item.is_active ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.roleText, { color: item.is_active ? '#2E7D32' : theme.colors.danger }]}>
                    {item.is_active ? '✓ ACTIVE' : '✗ INACTIVE'}
                  </Text>
                </View>
              </View>
            </View>
            {item.role !== 'super_admin' && (
              <View style={{ gap: 6 }}>
                <TouchableOpacity
                  testID={`umg-toggle-${item.id}`}
                  onPress={() => toggle(item)}
                  style={[styles.actBtn, { backgroundColor: item.is_active ? '#FFEBEE' : '#E8F5E9' }]}
                >
                  <Ionicons
                    name={item.is_active ? 'ban' : 'checkmark'}
                    size={14}
                    color={item.is_active ? theme.colors.danger : '#2E7D32'}
                  />
                </TouchableOpacity>
                <TouchableOpacity testID={`umg-role-${item.id}`} onPress={() => changeRole(item)} style={styles.actBtn}>
                  <Ionicons name="shield-half" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },

  toolbar: { padding: 16, gap: 10 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border },
  search: { flex: 1, paddingVertical: 10, fontSize: 14, color: theme.colors.text },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 11, fontWeight: '700', color: theme.colors.text, letterSpacing: 0.5 },
  chipTextActive: { color: '#fff' },

  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  name: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  subE: { fontSize: 11, color: theme.colors.textMuted },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  actBtn: { backgroundColor: '#FFEBEE', padding: 8, borderRadius: 8 },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40 },
});
