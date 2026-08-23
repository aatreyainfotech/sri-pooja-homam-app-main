import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import StatTile from '../../src/components/ui/StatTile';

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
    { title: 'Send Notification', icon: 'megaphone', color: '#AD1457', route: '/admin/notifications', testID: 'admin-notifications-tile' },
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
      <ScreenHeader
        title="Admin Panel"
        subtitle="Manage your devotional platform"
        onBack={() => safeBack('/(tabs)/profile')}
      />

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40, alignItems: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <ResponsiveContainer maxWidth={900}>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatTile label="Revenue" value={`₹${(stats.revenue || 0).toFixed(0)}`} icon="cash" color={theme.colors.secondary} />
            <StatTile label="Bookings" value={stats.paid_bookings || 0} icon="checkmark-circle" color={theme.statusColors.success.text} />
          </View>
          <View style={styles.statsRow}>
            <StatTile label="Devotees" value={stats.total_devotees || 0} icon="people" color={theme.statusColors.info.text} />
            <StatTile label="Temples" value={stats.total_temples || 0} icon="business" color={theme.colors.primary} />
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            {tiles.map((t) => (
              <TouchableOpacity
                key={t.title}
                testID={t.testID}
                activeOpacity={0.85}
                onPress={() => router.push(t.route as any)}
                style={styles.tileWrap}
              >
                <Surface elevation="sm" padding="md" radius="lg" style={styles.tile}>
                  <View style={[styles.tileIcon, { backgroundColor: t.color + '20' }]}>
                    {(t as any).iconLib === 'mci' ? (
                      <MaterialCommunityIcons name={t.icon as any} size={30} color={t.color} />
                    ) : (
                      <Ionicons name={t.icon as any} size={28} color={t.color} />
                    )}
                  </View>
                  <Text style={styles.tileTitle}>{t.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={{ position: 'absolute', top: 16, right: 14 }} />
                </Surface>
              </TouchableOpacity>
            ))}
          </View>

          {/* Live indicator */}
          <View style={styles.liveInfo}>
            <View style={styles.liveDot} />
            <Text style={styles.liveInfoText}>{stats.live_count || 0} stream(s) currently live</Text>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  statsRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm + 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  tileWrap: { width: '48%' },
  tile: { minHeight: 130, justifyContent: 'space-between' },
  tileIcon: { width: 52, height: 52, borderRadius: theme.radius.md + 2, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.sm + 2 },

  liveInfo: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(229,57,53,0.1)', padding: theme.spacing.sm + 4, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)',
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53935' },
  liveInfoText: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
});
