import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const tiles = [
    { title: 'Temples', icon: 'business', color: '#8B1515', route: '/admin/temples', testID: 'admin-temples-tile' },
    { title: 'Poojas', icon: 'flower', color: '#E65100', route: '/admin/poojas', testID: 'admin-poojas-tile' },
    { title: 'Live Streams', icon: 'radio', color: '#E53935', route: '/admin/live-streams', testID: 'admin-streams-tile' },
    { title: 'Videos', icon: 'videocam', color: '#D4AF37', route: '/admin/videos', testID: 'admin-videos-tile' },
    { title: 'Bookings', icon: 'receipt', color: '#2E7D32', route: '/admin/bookings', testID: 'admin-bookings-tile' },
    { title: 'Add Pujari', icon: 'account-tie-hat', iconLib: 'mci', color: '#FF6F00', route: '/admin/create-pujari', testID: 'admin-create-pujari-tile' },
    { title: 'Pujari Stats', icon: 'chart-donut', iconLib: 'mci', color: '#1565C0', route: '/admin/pujari-stats', testID: 'admin-pujari-stats-tile' },
    { title: 'Pujari Payouts', icon: 'send', color: '#00897B', route: '/admin/payouts', testID: 'admin-payouts-tile' },
    { title: 'Accommodation', icon: 'bed', color: '#0288D1', route: '/admin/properties', testID: 'admin-properties-tile' },
    ...(user?.role === 'super_admin' ? [
      { title: 'Manage Users',       icon: 'people',         color: '#5E35B1', route: '/admin/users',            testID: 'admin-users-tile' },
      { title: 'Create Admin',       icon: 'person-add',     color: '#7B1FA2', route: '/admin/create-admin',     testID: 'admin-create-admin-tile' },
      { title: 'WhatsApp Test',      icon: 'logo-whatsapp',  color: '#25D366', route: '/admin/whatsapp-test',    testID: 'admin-whatsapp-tile' },
      { title: 'Platform Settings',  icon: 'settings',       color: '#D4AF37', route: '/admin/settings',         testID: 'admin-settings-tile' },
    ] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#4A2C2A', '#B22222', '#D35400']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity testID="admin-back-btn" onPress={() => safeBack('/(tabs)/profile')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Manage your devotional platform</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Revenue" value={`₹${(stats.revenue || 0).toFixed(0)}`} icon="cash" color={theme.colors.secondary} />
          <StatCard label="Bookings" value={stats.paid_bookings || 0} icon="checkmark-circle" color="#2E7D32" />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Devotees" value={stats.total_devotees || 0} icon="people" color="#1976D2" />
          <StatCard label="Temples" value={stats.total_temples || 0} icon="business" color={theme.colors.primary} />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {tiles.map((t) => (
            <TouchableOpacity
              key={t.title}
              testID={t.testID}
              activeOpacity={0.85}
              onPress={() => router.push(t.route as any)}
              style={styles.tile}
            >
              <View style={[styles.tileIcon, { backgroundColor: t.color + '20' }]}>
                {(t as any).iconLib === 'mci' ? (
                  <MaterialCommunityIcons name={t.icon as any} size={30} color={t.color} />
                ) : (
                  <Ionicons name={t.icon as any} size={28} color={t.color} />
                )}
              </View>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={{ position: 'absolute', top: 16, right: 14 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Live indicator */}
        <View style={styles.liveInfo}>
          <View style={styles.liveDot} />
          <Text style={styles.liveInfoText}>{stats.live_count || 0} stream(s) currently live</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 8, paddingBottom: 22, paddingHorizontal: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: theme.colors.secondary, fontSize: 13, textAlign: 'center', marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '48%', minHeight: 130, backgroundColor: '#fff', padding: 16, borderRadius: 18,
    borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'space-between',
  },
  tileIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginTop: 10 },

  liveInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20,
    backgroundColor: 'rgba(229,57,53,0.1)', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)',
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53935' },
  liveInfoText: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
});
