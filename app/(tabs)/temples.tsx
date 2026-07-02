import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, RefreshControl, Platform, ActivityIndicator,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import WebFooter from '../../src/components/WebFooter';

const IS_WEB  = Platform.OS === 'web';
const GOLD    = '#C9922A';
const MAROON  = '#7A3020';
const DMAROON = '#3D1408';

function TempleBanner({ uri, name }: { uri?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <LinearGradient
      colors={[DMAROON, MAROON, '#C9922A22']}
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
    >
      <Text style={{ fontSize: IS_WEB ? 48 : 36, opacity: 0.3 }}>🕉</Text>
    </LinearGradient>
  );
}

function TempleCard({ item, onPress, cardW }: { item: any; onPress: () => void; cardW?: number }) {
  return (
    <TouchableOpacity
      testID={`temple-card-${item.id}`}
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        IS_WEB && { boxShadow: '0 4px 24px rgba(122,48,32,0.12)' } as any,
        cardW ? { width: cardW } : {},
      ]}
    >
      <View style={styles.bannerWrap}>
        <TempleBanner uri={item.banner} name={item.name} />
        <LinearGradient colors={['transparent', 'rgba(61,20,8,0.65)']} style={StyleSheet.absoluteFill} />
        {item.deity ? (
          <View style={styles.deityBadge}>
            <Text style={styles.deityBadgeText}>🕉 {item.deity}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <View style={styles.logoWrap}>
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} resizeMode="cover" />
            ) : (
              <LinearGradient colors={[DMAROON, MAROON]} style={[StyleSheet.absoluteFill, { borderRadius: 22, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 16, color: '#fff' }}>🕉</Text>
              </LinearGradient>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <View style={styles.meta}>
              <Ionicons name="location-outline" size={13} color={MAROON} />
              <Text style={styles.loc} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.btnView}>
            <Text style={styles.btnViewText}>View Poojas</Text>
            <Ionicons name="arrow-forward" size={14} color={MAROON} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Temples() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const innerW = Math.min(W, 1280);
  const [temples, setTemples] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/temples');
      setTemples(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to load temples.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = temples.filter((t) =>
    !q ||
    (t.name || '').toLowerCase().includes(q.toLowerCase()) ||
    (t.location || '').toLowerCase().includes(q.toLowerCase()) ||
    (t.deity || '').toLowerCase().includes(q.toLowerCase())
  );

  // Web grid: compute card width based on screen
  const COLS = W >= 1100 ? 3 : W >= 700 ? 2 : 1;
  const GAP  = 20;
  const listPad = IS_WEB ? 28 : 16;
  const availW = Math.min(W, innerW) - listPad * 2;
  const cardW  = IS_WEB ? Math.floor((availW - GAP * (COLS - 1)) / COLS) : undefined;

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.emptySub}>Loading sacred temples…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyBox}>
          <View style={styles.errorIcon}>
            <Ionicons name="cloud-offline-outline" size={40} color="#E53935" />
          </View>
          <Text style={styles.errorTitle}>Could Not Load Temples</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyBox}>
        <LinearGradient colors={[DMAROON, MAROON]} style={styles.emptyIconBox}>
          <Ionicons name="business-outline" size={36} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No Temples Found</Text>
        <Text style={styles.emptySub}>
          {q ? `No results for "${q}" — try a different name or location.` : 'Temples will appear here once added by admin.'}
        </Text>
        {q ? (
          <TouchableOpacity style={styles.retryBtn} onPress={() => setQ('')}>
            <Text style={styles.retryText}>Clear Search</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1A0C07', DMAROON, MAROON]}
        locations={[0, 0.5, 1]}
        style={styles.header}
      >
        <View style={[styles.headerInner, IS_WEB && { maxWidth: innerW, alignSelf: 'center', width: '100%' } as any]}>
          <View style={styles.headerBadge}>
            <Ionicons name="business-outline" size={11} color={GOLD} />
            <Text style={styles.headerBadgeText}>SACRED TEMPLES</Text>
          </View>
          <Text style={styles.headerTitle}>Sacred Temples</Text>
          <Text style={styles.headerSub}>Discover temples & book divine services</Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              testID="temples-search-input"
              value={q}
              onChangeText={setQ}
              placeholder="Search by name, location, deity…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.search}
            />
            {q.length > 0 && (
              <TouchableOpacity onPress={() => setQ('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>
          {temples.length > 0 && (
            <Text style={styles.countText}>{filtered.length} temple{filtered.length !== 1 ? 's' : ''} found</Text>
          )}
        </View>
      </LinearGradient>

      {/* ── Grid (web) / FlatList (native) ── */}
      {IS_WEB ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#FDF6EE' }}
          contentContainerStyle={{ padding: listPad, paddingBottom: 48 }}
        >
          {filtered.length === 0 ? renderEmpty() : (
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap', gap: GAP,
              maxWidth: innerW, alignSelf: 'center', width: '100%',
            }}>
              {filtered.map((item) => (
                <TempleCard
                  key={item.id}
                  item={item}
                  cardW={cardW}
                  onPress={() => router.push(`/temple/${item.id}` as any)}
                />
              ))}
            </View>
          )}
          <WebFooter />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id?.toString()}
          numColumns={1}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
          renderItem={({ item }) => (
            <TempleCard item={item} onPress={() => router.push(`/temple/${item.id}` as any)} />
          )}
          ListEmptyComponent={renderEmpty()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EE' },

  header: { paddingBottom: IS_WEB ? 32 : 20 },
  headerInner: { paddingHorizontal: IS_WEB ? 48 : 20, paddingTop: IS_WEB ? 36 : 8 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBadgeText: { color: '#FFF8E7', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: IS_WEB ? 40 : 26, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: IS_WEB ? 15 : 13, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    ...(IS_WEB ? { maxWidth: 560 } as any : {}),
  },
  search: { flex: 1, color: '#fff', fontSize: 14, ...(IS_WEB ? { outlineStyle: 'none' } as any : {}) } as any,
  countText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(122,48,32,0.1)',
  },
  bannerWrap: { width: '100%', height: IS_WEB ? 180 : 155, backgroundColor: DMAROON, position: 'relative' },
  deityBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  deityBadgeText: { color: GOLD, fontSize: 11, fontWeight: '700' },

  cardBody: { padding: IS_WEB ? 16 : 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoWrap: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: GOLD,
    overflow: 'hidden', backgroundColor: DMAROON,
    position: 'relative',
  },
  name: { fontSize: IS_WEB ? 16 : 17, fontWeight: '800', color: '#1A0505', lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  loc: { fontSize: 12, color: '#7A6A5A', flex: 1 },
  desc: { fontSize: 13, color: '#5A4A3A', lineHeight: 19, marginBottom: 12 },
  footer: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(122,48,32,0.1)',
  },
  btnView: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnViewText: { color: MAROON, fontWeight: '700', fontSize: 13 },

  // Empty / Error / Loading
  emptyBox: { alignItems: 'center', marginTop: 60, padding: 28 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#1A0505', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#7A6A5A', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  errorTitle: { fontSize: 17, fontWeight: '800', color: '#C62828', marginBottom: 6 },
  errorSub: { fontSize: 13, color: '#7A6A5A', textAlign: 'center', lineHeight: 20, maxWidth: 300, marginBottom: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: MAROON, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 999, marginTop: 16,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
