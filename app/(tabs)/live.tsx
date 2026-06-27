import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  RefreshControl, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import WebFooter from '../../src/components/WebFooter';

const IS_WEB = Platform.OS === 'web';

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
      {/* Header */}
      <LinearGradient
        colors={['#B22222', '#D35400', '#E67E22', '#F39C12']}
        locations={[0, 0.35, 0.7, 1]}
        start={[0, 0]} end={[1, 1]}
        style={styles.header}
      >
        {IS_WEB && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)',
          } as any} />
        )}
        <View style={styles.headerInner}>
          <View style={styles.headerBadge}>
            <View style={styles.redDot} />
            <Text style={styles.headerBadgeText}>LIVE DARSHAN</Text>
          </View>
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
              <Ionicons name="play-circle" size={16} color={tab === 'reels' ? '#FFF8F0' : 'rgba(255,255,255,0.65)'} />
              <Text style={[styles.tabText, tab === 'reels' && styles.tabTextActive]}>Reels</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {tab === 'live' ? (
        <View style={IS_WEB ? styles.listWrapWeb : styles.listWrapMobile}>
          <FlatList
            data={live}
            keyExtractor={(i) => i.id}
            numColumns={IS_WEB ? 3 : 1}
            key={IS_WEB ? 'web-3' : 'mob-1'}
            columnWrapperStyle={IS_WEB ? { gap: 24 } as any : undefined}
            contentContainerStyle={IS_WEB ? styles.contentLiveWeb : styles.contentLiveMobile}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`live-card-${item.id}`}
                activeOpacity={0.88}
                onPress={() => router.push(`/live-stream/${item.id}`)}
                style={IS_WEB ? styles.liveItemWeb : {}}
              >
                {/* Image card */}
                <View style={styles.liveCard}>
                  <Image
                    source={{ uri: item.thumbnail || 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
                    style={styles.liveImg}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.liveOverlay} />
                  {/* LIVE NOW badge bottom-left */}
                  <View style={styles.liveBadge}>
                    <View style={styles.ld} />
                    <Text style={styles.lbText}>LIVE NOW</Text>
                  </View>
                  {/* Mobile: title overlaid on image */}
                  {!IS_WEB && (
                    <Text style={styles.liveTitleMob} numberOfLines={2}>{item.title}</Text>
                  )}
                </View>
                {/* Web: title + tap below card */}
                {IS_WEB && (
                  <>
                    <Text style={styles.liveTitleWeb} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.liveSubRow}>
                      <Ionicons name="play-circle" size={14} color="#D4AF37" />
                      <Text style={styles.liveSubWeb}>Tap to watch</Text>
                      {item.is_paid_only && (
                        <View style={styles.paidBadge}>
                          <Ionicons name="lock-closed" size={10} color="#D4AF37" />
                          <Text style={styles.paidText}>Members only</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="radio-outline" size={52} color={IS_WEB ? 'rgba(212,175,55,0.3)' : theme.colors.border} />
                <Text style={styles.emptyText}>No live streams right now</Text>
                <Text style={styles.emptySub}>Check back soon for live pooja & homam</Text>
              </View>
            }
            ListFooterComponent={IS_WEB ? <WebFooter /> : null}
          />
        </View>
      ) : (
        <View style={IS_WEB ? styles.listWrapWeb : styles.listWrapMobile}>
          <FlatList
            data={videos}
            keyExtractor={(i) => i.id}
            numColumns={IS_WEB ? 3 : 2}
            contentContainerStyle={IS_WEB ? styles.contentReelsWeb : styles.contentReelsMobile}
            columnWrapperStyle={{ gap: IS_WEB ? 24 : 14 }}
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
                <Ionicons name="videocam-outline" size={52} color={IS_WEB ? 'rgba(212,175,55,0.3)' : theme.colors.border} />
                <Text style={styles.emptyText}>No videos yet</Text>
                <Text style={styles.emptySub}>Devotional reels coming soon</Text>
              </View>
            }
            ListFooterComponent={IS_WEB ? <WebFooter /> : null}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  // Header
  header: {
    paddingBottom: IS_WEB ? 36 : 18,
    paddingTop: 0,
    borderBottomLeftRadius: IS_WEB ? 0 : 24,
    borderBottomRightRadius: IS_WEB ? 0 : 24,
    position: 'relative', overflow: 'hidden',
  },
  headerInner: {
    paddingHorizontal: IS_WEB ? 48 : 20,
    paddingTop: IS_WEB ? 40 : 8,
    ...(IS_WEB ? { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any : {}),
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5,
    marginBottom: IS_WEB ? 16 : 10,
  },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: {
    color: '#fff', fontWeight: '900',
    fontSize: IS_WEB ? 44 : 26,
    ...(IS_WEB ? { textShadow: '0 2px 20px rgba(0,0,0,0.5)' } as any : {}),
  },
  sub: { color: 'rgba(255,255,255,0.65)', fontSize: IS_WEB ? 16 : 13, marginTop: IS_WEB ? 6 : 2 },
  tabs: { flexDirection: 'row', gap: 10, marginTop: IS_WEB ? 22 : 16 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: IS_WEB ? 11 : 10, paddingHorizontal: IS_WEB ? 20 : 16, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  tabActive: IS_WEB
    ? { backgroundColor: 'rgba(211,84,0,0.9)', borderColor: 'rgba(255,255,255,0.35)' }
    : { backgroundColor: '#fff' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: IS_WEB ? 14 : 13 },
  tabTextActive: { color: '#FFF8F0', fontWeight: '800' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },

  // List wrappers — constrain to 1280px on web
  listWrapWeb: { flex: 1, maxWidth: 1280, alignSelf: 'center', width: '100%' } as any,
  listWrapMobile: { flex: 1 },
  contentLiveWeb: { padding: 48, gap: 28, paddingBottom: 0 } as any,
  contentLiveMobile: { padding: 20, gap: 20, paddingBottom: 20 },
  contentReelsWeb: { padding: 48, gap: 24, paddingBottom: 60 } as any,
  contentReelsMobile: { padding: 14, gap: 14, paddingBottom: 20 },

  // Live — web item wrapper (flex:1 for 3-col)
  liveItemWeb: { flex: 1 },

  // Live card (image container)
  liveCard: {
    height: IS_WEB ? 290 : 220,
    borderRadius: IS_WEB ? 18 : 22,
    overflow: 'hidden', backgroundColor: '#0D0202', position: 'relative',
    ...(IS_WEB ? { boxShadow: '0 6px 24px rgba(0,0,0,0.6)' } as any : {}),
  },
  liveImg: { width: '100%', height: '100%' },
  liveOverlay: { ...StyleSheet.absoluteFillObject },
  liveBadge: {
    position: 'absolute', bottom: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E53935', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
  },
  ld: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' },
  lbText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  // Mobile title (overlaid on image)
  liveTitleMob: {
    position: 'absolute', bottom: 46, left: 14, right: 14,
    color: '#fff', fontSize: 17, fontWeight: '700', lineHeight: 22,
  },

  // Web: title + sub below card
  liveTitleWeb: {
    color: '#4A2C2A', fontSize: 16, fontWeight: '800',
    marginTop: 14, lineHeight: 23,
  },
  liveSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  liveSubWeb: { color: '#E67E22', fontSize: 13, fontWeight: '600' },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8,
    backgroundColor: 'rgba(230,126,34,0.08)', borderWidth: 1, borderColor: 'rgba(230,126,34,0.3)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  paidText: { color: '#E67E22', fontSize: 10, fontWeight: '700' },

  // Reel card
  reelCard: { flex: 1, aspectRatio: 9 / 14, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  reelImg: { width: '100%', height: '100%' },
  reelOverlay: { ...StyleSheet.absoluteFillObject, padding: 12, justifyContent: 'flex-end' },
  reelTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reelCaption: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  playBadge: {
    position: 'absolute', top: '45%', left: '45%',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,21,21,0.85)', alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  empty: { alignItems: 'center', marginTop: 80, padding: 20 },
  emptyText: {
    color: theme.colors.textSecondary,
    fontWeight: '700', fontSize: 16, marginTop: 14,
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: 13, marginTop: 6, textAlign: 'center',
  },
});
