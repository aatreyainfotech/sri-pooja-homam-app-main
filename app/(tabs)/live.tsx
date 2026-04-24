import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function Live() {
  const router = useRouter();
  const [live, setLive] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [tab, setTab] = useState<'live' | 'reels'>('live');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, v] = await Promise.all([api.get('/live-streams'), api.get('/videos')]);
      setLive(l.data);
      setVideos(v.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#2D1B19', '#8B1515']} style={styles.header}>
        <Text style={styles.title}>Sacred Moments</Text>
        <Text style={styles.sub}>Live streams & devotional reels</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            testID="live-tab-live"
            style={[styles.tab, tab === 'live' && styles.tabActive]}
            onPress={() => setTab('live')}
          >
            <View style={styles.redDot} />
            <Text style={[styles.tabText, tab === 'live' && styles.tabTextActive]}>Live Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="live-tab-reels"
            style={[styles.tab, tab === 'reels' && styles.tabActive]}
            onPress={() => setTab('reels')}
          >
            <Ionicons name="play-circle" size={16} color={tab === 'reels' ? theme.colors.primary : '#fff'} />
            <Text style={[styles.tabText, tab === 'reels' && styles.tabTextActive]}>Reels</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {tab === 'live' ? (
        <FlatList
          data={live}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`live-card-${item.id}`}
              activeOpacity={0.9}
              onPress={() => router.push(`/live-stream/${item.id}`)}
              style={styles.liveCard}
            >
              <Image
                source={{ uri: 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
                style={styles.liveImg}
              />
              <LinearGradient colors={['transparent', 'rgba(45,27,25,0.95)']} style={styles.liveOverlay}>
                <View style={styles.liveBadge}>
                  <View style={styles.ld} />
                  <Text style={styles.lbText}>LIVE</Text>
                </View>
                <Text style={styles.liveTitle}>{item.title}</Text>
                {item.is_paid_only && (
                  <View style={styles.paidRow}>
                    <Ionicons name="lock-closed" size={12} color={theme.colors.secondary} />
                    <Text style={styles.paidText}>Paid Devotees Only</Text>
                  </View>
                )}
                <View style={styles.watchBtn}>
                  <Ionicons name="play" size={14} color="#fff" />
                  <Text style={styles.watchText}>Watch Live</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="radio-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No live streams right now</Text>
              <Text style={styles.emptySub}>Check back soon for live pooja & homam</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={{ padding: 14, gap: 14 }}
          columnWrapperStyle={{ gap: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`reel-card-${item.id}`}
              activeOpacity={0.9}
              style={styles.reelCard}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.reelImg} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.reelOverlay}>
                <Text style={styles.reelTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.reelCaption} numberOfLines={2}>{item.caption}</Text>
              </LinearGradient>
              <View style={styles.playBadge}>
                <Ionicons name="play" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No videos yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: theme.colors.primary },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },

  liveCard: { height: 220, borderRadius: 22, overflow: 'hidden', backgroundColor: '#000' },
  liveImg: { width: '100%', height: '100%' },
  liveOverlay: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: 'flex-end' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 10,
  },
  ld: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  lbText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  liveTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  paidText: { color: theme.colors.secondary, fontSize: 12, fontWeight: '600' },
  watchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, marginTop: 10,
  },
  watchText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  reelCard: { flex: 1, aspectRatio: 9 / 14, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  reelImg: { width: '100%', height: '100%' },
  reelOverlay: { ...StyleSheet.absoluteFillObject, padding: 10, justifyContent: 'flex-end' },
  reelTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reelCaption: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  playBadge: {
    position: 'absolute', top: '45%', left: '45%',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,21,21,0.85)', alignItems: 'center', justifyContent: 'center',
  },

  empty: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyText: { color: theme.colors.text, fontWeight: '600', fontSize: 15, marginTop: 10 },
  emptySub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
});
