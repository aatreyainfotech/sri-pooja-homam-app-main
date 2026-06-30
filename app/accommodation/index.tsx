import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  TextInput, Platform, Image, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import WebFooter from '../../src/components/WebFooter';

const IS_WEB = Platform.OS === 'web';
const MAROON = '#8B1515';
const DARK_MAROON = '#4A0E0E';
const GOLD = '#C9922A';

function parseImages(s: string | null | undefined): string[] {
  if (!s) return [];
  if (s.includes('|||')) return s.split('|||').map(v => v.trim()).filter(Boolean);
  if (s.startsWith('data:')) return [s.trim()];
  return s.split(',').map(v => v.trim()).filter(Boolean);
}

const TYPE_ICONS: Record<string, string> = {
  hotel: 'bed', dharamshala: 'home', guesthouse: 'business', lodge: 'storefront',
};

const TYPE_COLORS: Record<string, [string, string]> = {
  hotel: ['#3D0808', '#8B1515'],
  dharamshala: ['#4A148C', '#7B1FA2'],
  guesthouse: ['#1B5E20', '#2E7D32'],
  lodge: ['#BF360C', '#E64A19'],
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= full ? 'star' : (i === full + 1 && half ? 'star-half' : 'star-outline')}
          size={11}
          color="#FFC107"
        />
      ))}
      <Text style={{ fontSize: 11, color: '#78909C', marginLeft: 4, fontWeight: '600' }}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function AccommodationBrowse() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { active_only: true };
      if (filterType) params.type = filterType;
      const res = await api.get('/properties', { params });
      setProperties(res.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [filterType]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = properties.filter((p) =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(q.toLowerCase()) ||
    (p.temple_name || '').toLowerCase().includes(q.toLowerCase())
  );

  const renderItem = ({ item }: any) => {
    const iconName = TYPE_ICONS[item.type || 'hotel'] || 'bed';
    const coverPhoto = parseImages(item.images)[0] || null;
    const minPrice = item.min_price ? parseFloat(item.min_price) : null;
    const gradColors = TYPE_COLORS[item.type || 'hotel'] || [DARK_MAROON, MAROON];
    const hasRating = item.rating && parseFloat(item.rating) > 0;

    return (
      <TouchableOpacity
        style={[styles.card, IS_WEB && styles.cardWeb]}
        activeOpacity={0.88}
        onPress={() => router.push(`/accommodation/${item.id}` as any)}
      >
        {/* ── Photo / Placeholder ─────────────────────────── */}
        <View style={styles.cardImageWrap}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <LinearGradient colors={gradColors as [string, string]} style={styles.cardImage}>
              <View style={styles.placeholderIconWrap}>
                <Ionicons name={iconName as any} size={36} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.placeholderLabel}>{(item.type || 'HOTEL').toUpperCase()}</Text>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.cardImageOverlay}
          />
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{(item.type || 'hotel').toUpperCase()}</Text>
          </View>
          {minPrice ? (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>₹{minPrice.toFixed(0)}</Text>
              <Text style={styles.priceSub}>/night</Text>
            </View>
          ) : null}
        </View>

        {/* ── Card Body ───────────────────────────────────── */}
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.propName} numberOfLines={1}>{item.name}</Text>
            {hasRating && <StarRating rating={parseFloat(item.rating)} />}
          </View>

          {item.temple_name ? (
            <View style={styles.templeRow}>
              <Ionicons name="business-outline" size={12} color={MAROON} />
              <Text style={styles.templeName} numberOfLines={1}>{item.temple_name}</Text>
            </View>
          ) : null}

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {item.address}{item.city ? `, ${item.city}` : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            {item.check_in_time ? (
              <View style={styles.infoChip}>
                <Ionicons name="log-in-outline" size={11} color={MAROON} />
                <Text style={styles.infoChipText}>In {item.check_in_time}</Text>
              </View>
            ) : null}
            {item.check_out_time ? (
              <View style={styles.infoChip}>
                <Ionicons name="log-out-outline" size={11} color="#607D8B" />
                <Text style={styles.infoChipText}>Out {item.check_out_time}</Text>
              </View>
            ) : null}
            {item.total_rooms ? (
              <View style={styles.infoChip}>
                <Ionicons name="bed-outline" size={11} color="#607D8B" />
                <Text style={styles.infoChipText}>{item.total_rooms} rooms</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => router.push(`/accommodation/${item.id}` as any)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[DARK_MAROON, MAROON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.viewBtnGrad}>
              <Text style={styles.viewBtnText}>View Rooms & Book</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ──────────────────────────────────────── */}
      <LinearGradient
        colors={['#C9922A', '#8B1515', '#0D0305']}
        locations={[0, 0.4, 1]}
        style={styles.header}
      >
        <View style={[styles.headerInner, IS_WEB && { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Ionicons name="bed" size={11} color="#FFD54F" />
            <Text style={styles.headerBadgeText}>TEMPLE ACCOMMODATION</Text>
          </View>
          <Text style={styles.headerTitle}>Stay Near Temples</Text>
          <Text style={styles.headerSub}>Hotels · Dharamshalas · Guesthouses</Text>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search by name, city or temple…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.searchInput}
            />
            {q.length > 0 && (
              <TouchableOpacity onPress={() => setQ('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* ── Filter chips ────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEFF1' }}
      >
        {[
          { label: 'All', value: '', icon: 'apps-outline' },
          { label: 'Hotel', value: 'hotel', icon: 'bed-outline' },
          { label: 'Dharamshala', value: 'dharamshala', icon: 'home-outline' },
          { label: 'Guesthouse', value: 'guesthouse', icon: 'business-outline' },
          { label: 'Lodge', value: 'lodge', icon: 'storefront-outline' },
        ].map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filterType === f.value && styles.filterChipActive]}
            onPress={() => setFilterType(f.value)}
          >
            <Ionicons name={f.icon as any} size={13} color={filterType === f.value ? '#fff' : '#78909C'} />
            <Text style={[styles.filterText, filterType === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── List ────────────────────────────────────────── */}
      <View style={[IS_WEB && styles.listWrapWeb]}>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[
            { padding: 16, gap: 16, paddingBottom: 40 },
            IS_WEB && { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any,
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} />}
          renderItem={renderItem}
          numColumns={IS_WEB ? 2 : 1}
          key={IS_WEB ? 'web-2' : 'mob-1'}
          columnWrapperStyle={IS_WEB ? ({ gap: 16 } as any) : undefined}
          ListEmptyComponent={
            loading ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={MAROON} />
                <Text style={styles.emptySub}>Finding stays near temples…</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <LinearGradient colors={[DARK_MAROON, MAROON]} style={styles.emptyIcon}>
                  <Ionicons name="bed-outline" size={36} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No properties available</Text>
                <Text style={styles.emptySub}>We're adding more accommodation options near temples. Check back soon!</Text>
              </View>
            )
          }
          ListFooterComponent={IS_WEB ? <WebFooter /> : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  header: { paddingBottom: IS_WEB ? 32 : 20 },
  headerInner: { paddingHorizontal: IS_WEB ? 48 : 16, paddingTop: IS_WEB ? 36 : 8 },
  backBtn: { marginBottom: 12 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  headerBadgeText: { color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: IS_WEB ? 40 : 26, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: IS_WEB ? 15 : 13, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    ...(IS_WEB ? { maxWidth: 560 } as any : {}),
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, ...(IS_WEB ? { outline: 'none' } as any : {}) } as any,

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#F7F4F4', borderWidth: 1.5, borderColor: 'rgba(139,21,21,0.12)', flexShrink: 0,
  },
  filterChipActive: { backgroundColor: MAROON, borderColor: MAROON },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },

  listWrapWeb: { flex: 1, ...(IS_WEB ? { overflowY: 'auto' } as any : {}) } as any,

  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(139,21,21,0.1)',
    shadowColor: '#8B1515', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardWeb: { ...(IS_WEB ? { boxShadow: '0 4px 24px rgba(139,21,21,0.1)' } as any : {}) },

  cardImageWrap: { position: 'relative' },
  cardImage: {
    height: IS_WEB ? 200 : 150, width: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  cardImageOverlay: { ...StyleSheet.absoluteFillObject },
  placeholderIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  placeholderLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  typeBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  typeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  priceBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: MAROON, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    flexDirection: 'row', alignItems: 'baseline', gap: 1,
  },
  priceText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  priceSub: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '600' },

  cardBody: { padding: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  propName: { fontSize: 16, fontWeight: '800', color: '#1A0505', flex: 1 },
  templeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  templeName: { fontSize: 12, color: MAROON, fontWeight: '600', flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  location: { fontSize: 12, color: theme.colors.textMuted, flex: 1 },

  infoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,21,21,0.15)' },
  infoChipText: { fontSize: 11, color: '#555', fontWeight: '500' },

  viewBtn: { borderRadius: 13, overflow: 'hidden' },
  viewBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty: { alignItems: 'center', marginTop: 80, padding: 24 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A0505', marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
});
