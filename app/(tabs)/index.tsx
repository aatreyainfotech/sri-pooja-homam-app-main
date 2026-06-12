import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  RefreshControl, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [temples, setTemples] = useState<any[]>([]);
  const [poojas, setPoojas] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [liveIdx, setLiveIdx] = useState(0);
  const liveRef = useRef<FlatList>(null);

  // Auto-scroll live carousel every 4s
  useEffect(() => {
    if (live.length <= 1) return;
    const t = setInterval(() => {
      setLiveIdx((prev) => {
        const next = (prev + 1) % live.length;
        liveRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [live.length]);

  const onLiveScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
    if (i !== liveIdx) setLiveIdx(i);
  };

  const load = useCallback(async () => {
    try {
      const [t, p, l] = await Promise.all([
        api.get('/temples'),
        api.get('/poojas'),
        api.get('/live-streams'),
      ]);
      setTemples(t.data);
      setPoojas(p.data);
      setLive(l.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const upcoming = [...poojas].sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || '')).slice(0, 6);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.headerBg}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greet}>🙏 Namaste,</Text>
              <Text style={styles.name} numberOfLines={1}>{user?.full_name}</Text>
            </View>
            <TouchableOpacity testID="home-profile-btn" onPress={() => router.push('/(tabs)/profile')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.full_name || 'D').charAt(0).toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.brandSm}>శ్రీ పూజా హోమం</Text>
        </LinearGradient>

        {/* Live Now carousel - one-by-one scroll */}
        {live.length > 0 && (
          <View style={styles.liveWrap}>
            <FlatList
              ref={liveRef}
              data={live}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onLiveScroll}
              scrollEventThrottle={16}
              snapToInterval={width - 40}
              decelerationRate="fast"
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`home-live-${item.id}`}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/live-stream/${item.id}`)}
                  style={[styles.liveBanner, { width: width - 40, marginHorizontal: 0 }]}
                >
                  <Image
                    source={{ uri: 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
                    style={styles.liveBannerImg}
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.liveOverlay}>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                    </View>
                    <Text style={styles.liveTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.liveSub}>Tap to watch sacred rituals live →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
            {live.length > 1 && (
              <View style={styles.dots}>
                {live.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === liveIdx && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Services</Text>
          <View style={styles.catRow}>
            <CategoryCard
              icon="flame"
              title="Homam"
              subtitle="Fire rituals"
              color="#E65100"
              onPress={() => router.push('/(tabs)/temples')}
            />
            <CategoryCard
              icon="rose"
              title="Pooja"
              subtitle="Daily sevas"
              color="#8B1515"
              onPress={() => router.push('/(tabs)/temples')}
            />
            <CategoryCard
              icon="videocam"
              title="Live"
              subtitle="Watch live"
              color="#D4AF37"
              onPress={() => router.push('/(tabs)/live')}
            />
          </View>
        </View>

        {/* Featured Temples */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Temples</Text>
            <TouchableOpacity testID="home-view-all-temples" onPress={() => router.push('/(tabs)/temples')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={temples}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`home-temple-card-${item.id}`}
                activeOpacity={0.9}
                onPress={() => router.push(`/temple/${item.id}`)}
                style={styles.templeCard}
              >
                <Image source={{ uri: item.banner }} style={styles.templeImg} />
                <LinearGradient colors={['transparent', 'rgba(45,27,25,0.95)']} style={styles.templeOverlay}>
                  <Text style={styles.templeName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.templeMeta}>
                    <Ionicons name="location" size={12} color={theme.colors.secondary} />
                    <Text style={styles.templeLoc} numberOfLines={1}>{item.location}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Upcoming Poojas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Poojas & Homams</Text>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {upcoming.map((p) => (
              <TouchableOpacity
                key={p.id}
                testID={`home-pooja-${p.id}`}
                activeOpacity={0.9}
                onPress={() => router.push(`/book-pooja/${p.id}`)}
                style={styles.poojaRow}
              >
                <Image source={{ uri: p.image }} style={styles.poojaImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.typeBadge(p.type)}>
                    <Text style={styles.typeBadgeText}>{p.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.poojaName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.poojaDesc} numberOfLines={1}>{p.description}</Text>
                  <View style={styles.poojaFoot}>
                    <Text style={styles.poojaPrice}>₹{p.price.toFixed(0)}</Text>
                    <Text style={styles.poojaDur}>• {p.duration}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryCard({ icon, title, subtitle, color, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.catCard} testID={`home-cat-${title.toLowerCase()}`}>
      <View style={[styles.catIconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.catTitle}>{title}</Text>
      <Text style={styles.catSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles: any = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  headerBg: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greet: { fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  name: { fontFamily: 'Cinzel-Bold', color: '#fff', fontSize: 19, marginTop: 2 },
  brandSm: { color: theme.colors.secondary, fontSize: 14, marginTop: 10, letterSpacing: 2, fontWeight: '800' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  avatarText: { fontFamily: 'Cinzel-Bold', color: theme.colors.primary, fontSize: 18 },

  liveWrap: { marginTop: 18 },
  liveBanner: { height: 180, borderRadius: 20, overflow: 'hidden' },
  liveBannerImg: { width: '100%', height: '100%' },
  liveOverlay: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: 'flex-end' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  liveTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  liveSub: { color: theme.colors.secondary, fontSize: 13, marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  dotActive: { width: 20, backgroundColor: theme.colors.primary },

  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Cinzel-Bold', fontSize: 16, color: theme.colors.text, paddingHorizontal: 20, marginBottom: 12 },
  seeAll: { fontFamily: 'DMSans-Regular', color: theme.colors.primary, fontWeight: '600', fontSize: 13 },

  catRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  catCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'flex-start',
  },
  catIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  catTitle: { fontFamily: 'Cinzel-Bold', fontSize: 14, color: theme.colors.text },
  catSub: { fontFamily: 'DMSans-Regular', fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },

  templeCard: {
    width: width * 0.75, height: 180, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#000',
  },
  templeImg: { width: '100%', height: '100%' },
  templeOverlay: { ...StyleSheet.absoluteFillObject, padding: 14, justifyContent: 'flex-end' },
  templeName: { fontFamily: 'Cinzel-Bold', color: '#fff', fontSize: 16 },
  templeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  templeLoc: { color: theme.colors.secondary, fontSize: 12 },

  poojaRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, padding: 10, borderWidth: 1, borderColor: theme.colors.border,
  },
  poojaImg: { width: 70, height: 70, borderRadius: 14 },
  typeBadge: (type: string) => ({
    alignSelf: 'flex-start',
    backgroundColor: type === 'homam' ? '#FFF3E0' : '#FFEBEE',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4,
  }),
  typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: theme.colors.primary },
  poojaName: { fontFamily: 'Cinzel-Bold', fontSize: 14, color: theme.colors.text },
  poojaDesc: { fontFamily: 'DMSans-Regular', fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  poojaFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  poojaPrice: { fontFamily: 'Cinzel-Bold', fontSize: 15, color: theme.colors.primary },
  poojaDur: { fontFamily: 'DMSans-Regular', fontSize: 12, color: theme.colors.textMuted },
});
