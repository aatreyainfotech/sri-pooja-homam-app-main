import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

interface Notif {
  id: string;
  type: 'live_stream' | 'video' | 'pooja' | 'booking' | 'system';
  title: string;
  body: string;
  created_at: string;
  data?: any;
  is_pro?: boolean;
}

const ICON_MAP: Record<string, { name: string; color: string; bg: string }> = {
  live_stream: { name: 'radio', color: '#E53935', bg: '#FFEBEE' },
  video:       { name: 'videocam', color: '#1565C0', bg: '#E3F2FD' },
  pooja:       { name: 'flame', color: '#8B1515', bg: '#FCE4EC' },
  booking:     { name: 'receipt', color: '#2E7D32', bg: '#E8F5E9' },
  system:      { name: 'notifications', color: '#6A1B9A', bg: '#F3E5F5' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProModal, setShowProModal] = useState(false);

  const isPro = user?.role !== 'devotee';

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch {
      // If endpoint doesn't exist yet, show sample data
      setNotifications([
        {
          id: '1', type: 'live_stream',
          title: '🔴 LIVE — Sudarshana Homam',
          body: 'A live stream has started. Tap to watch now.',
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: '2', type: 'pooja',
          title: 'New Pooja Available',
          body: 'Navagraha Pooja is now available for booking.',
          created_at: new Date(Date.now() - 60 * 60000).toISOString(),
        },
        {
          id: '3', type: 'video',
          title: 'New Video Added',
          body: 'Watch: "Sri Venkateswara Suprabhatam" from Tirumala Temple.',
          created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        },
        {
          id: '4', type: 'booking',
          title: '🙏 Booking Confirmed',
          body: 'Your Lakshmi Pooja booking is confirmed.',
          created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
        {
          id: '5', type: 'live_stream', is_pro: true,
          title: '⭐ PRO — Exclusive Live Darshan',
          body: 'PRO members get early access to this exclusive live session.',
          created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNotifPress = (notif: Notif) => {
    if (notif.is_pro && !isPro) {
      setShowProModal(true);
      return;
    }
    if (notif.type === 'live_stream' && notif.data?.streamId) {
      router.push(`/live-stream/${notif.data.streamId}` as any);
    } else if (notif.type === 'booking') {
      router.push('/(tabs)/bookings');
    } else if (notif.type === 'pooja') {
      router.push('/(tabs)/temples');
    } else if (notif.type === 'video') {
      router.push('/(tabs)/live');
    }
  };

  const renderItem = ({ item }: { item: Notif }) => {
    const ico = ICON_MAP[item.type] || ICON_MAP.system;
    return (
      <TouchableOpacity
        style={[styles.card, item.is_pro && styles.proCard]}
        activeOpacity={0.8}
        onPress={() => handleNotifPress(item)}
      >
        <View style={[styles.iconWrap, { backgroundColor: ico.bg }]}>
          <Ionicons name={ico.name as any} size={22} color={ico.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.is_pro && (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={10} color="#D4AF37" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardBody2} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {!isPro && (
          <TouchableOpacity style={styles.proChip} onPress={() => setShowProModal(true)}>
            <Ionicons name="star" size={12} color="#2D1B19" />
            <Text style={styles.proChipText}>Go PRO</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* PRO banner for free users */}
      {!isPro && (
        <TouchableOpacity style={styles.proBanner} activeOpacity={0.85} onPress={() => setShowProModal(true)}>
          <LinearGradient colors={['#D4AF37', '#AA8721']} style={styles.proBannerGrad}>
            <Ionicons name="star" size={20} color="#fff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.proBannerTitle}>Upgrade to PRO</Text>
              <Text style={styles.proBannerSub}>Get early access to live streams, exclusive poojas & priority booking</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={theme.colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}

      {/* PRO Upgrade Modal */}
      <Modal visible={showProModal} transparent animationType="slide" onRequestClose={() => setShowProModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowProModal(false)}>
          <Pressable style={styles.proSheet} onPress={() => {}}>
            <View style={styles.proSheetHandle} />

            <LinearGradient colors={['#D4AF37', '#8B6914']} style={styles.proSheetHeader}>
              <Ionicons name="star" size={40} color="#fff" />
              <Text style={styles.proSheetTitle}>Sri Pooja Homam PRO</Text>
              <Text style={styles.proSheetSub}>Elevate your spiritual experience</Text>
            </LinearGradient>

            <View style={styles.proFeatures}>
              {[
                { icon: 'radio', text: 'Early access to all live streams' },
                { icon: 'notifications', text: 'Priority push notifications' },
                { icon: 'star', text: 'Exclusive poojas & homams' },
                { icon: 'calendar', text: 'Panchang alerts & reminders' },
                { icon: 'gift', text: 'Special discounts on bookings' },
                { icon: 'shield-checkmark', text: 'Dedicated pujari support' },
              ].map(({ icon, text }) => (
                <View key={text} style={styles.proFeatureRow}>
                  <View style={styles.proFeatureIcon}>
                    <Ionicons name={icon as any} size={16} color="#D4AF37" />
                  </View>
                  <Text style={styles.proFeatureText}>{text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.proUpgradeBtn}
              onPress={() => {
                setShowProModal(false);
                // TODO: navigate to subscription/payment screen
                router.push('/(tabs)/bookings');
              }}
            >
              <LinearGradient colors={['#D4AF37', '#AA8721']} style={styles.proUpgradeBtnGrad}>
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={styles.proUpgradeBtnText}>Upgrade Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.proMaybeLater} onPress={() => setShowProModal(false)}>
              <Text style={styles.proMaybeLaterText}>Maybe Later</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  proChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  proChipText: { color: '#2D1B19', fontSize: 12, fontWeight: '800' },

  proBanner: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, overflow: 'hidden' },
  proBannerGrad: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 0 },
  proBannerTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  proBannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2, lineHeight: 16 },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  proCard: { borderColor: '#D4AF37', borderWidth: 1.5 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#FFF8E1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    borderWidth: 1, borderColor: '#D4AF37',
  },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: '#8B6914' },
  cardBody2: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },
  cardTime: { fontSize: 10, color: theme.colors.textMuted, marginTop: 4 },

  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: theme.colors.textMuted, fontSize: 15 },

  // PRO Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  proSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  proSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginTop: 10, marginBottom: 0 },
  proSheetHeader: { alignItems: 'center', padding: 24, gap: 6 },
  proSheetTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  proSheetSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  proFeatures: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
  proFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  proFeatureIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center',
  },
  proFeatureText: { fontSize: 14, color: theme.colors.text, fontWeight: '500', flex: 1 },
  proUpgradeBtn: { marginHorizontal: 24, marginBottom: 10, borderRadius: 999, overflow: 'hidden' },
  proUpgradeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  proUpgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  proMaybeLater: { alignItems: 'center', paddingBottom: 32, paddingTop: 6 },
  proMaybeLaterText: { color: theme.colors.textMuted, fontSize: 14 },
});
