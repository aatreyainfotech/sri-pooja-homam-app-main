import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  TextInput, Platform,
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
const BLUE = '#0288D1';

const PROPERTY_TYPE_ICONS: Record<string, string> = {
  hotel: 'bed',
  dharamshala: 'home',
  guesthouse: 'business',
  lodge: 'storefront',
};

export default function AccommodationBrowse() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('');

  const load = useCallback(async () => {
    try {
      const params: any = { active_only: true };
      if (filterType) params.type = filterType;
      const res = await api.get('/properties', { params });
      setProperties(res.data);
    } catch {}
  }, [filterType]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = properties.filter((p) =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(q.toLowerCase()) ||
    (p.temple_name || '').toLowerCase().includes(q.toLowerCase())
  );

  const renderItem = ({ item }: any) => {
    const iconName = PROPERTY_TYPE_ICONS[item.type || 'hotel'] || 'bed';
    return (
      <TouchableOpacity
        style={[styles.card, IS_WEB && styles.cardWeb]}
        activeOpacity={0.88}
        onPress={() => router.push(`/accommodation/${item.id}` as any)}
      >
        <LinearGradient
          colors={['#E3F2FD', '#B3E5FC']}
          style={styles.cardImage}
        >
          <Ionicons name={iconName as any} size={40} color={BLUE} />
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{(item.type || 'hotel').toUpperCase()}</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <Text style={styles.propName} numberOfLines={1}>{item.name}</Text>
          {item.temple_name ? (
            <View style={styles.templeRow}>
              <Ionicons name="business-outline" size={12} color="#E67E22" />
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
            <View style={styles.infoChip}>
              <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
              <Text style={styles.infoChipText}>Check-in {item.check_in_time}</Text>
            </View>
            {item.total_rooms ? (
              <View style={styles.infoChip}>
                <Ionicons name="bed-outline" size={12} color={theme.colors.textMuted} />
                <Text style={styles.infoChipText}>{item.total_rooms} rooms</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => router.push(`/accommodation/${item.id}` as any)}
          >
            <Text style={styles.viewBtnText}>View Rooms & Book</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#4A2C2A', '#0277BD', BLUE]}
        locations={[0, 0.5, 1]}
        style={styles.header}
      >
        <View style={[styles.headerInner, IS_WEB && { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Ionicons name="bed" size={12} color="#FFD54F" />
            <Text style={styles.headerBadgeText}>TEMPLE ACCOMMODATION</Text>
          </View>
          <Text style={styles.headerTitle}>Stay Near Temples</Text>
          <Text style={styles.headerSub}>Hotels, Dharamshalas & Guesthouses</Text>

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

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {[
          { label: 'All', value: '' },
          { label: '🏨 Hotel', value: 'hotel' },
          { label: '🏠 Dharamshala', value: 'dharamshala' },
          { label: '🏢 Guesthouse', value: 'guesthouse' },
          { label: '🏡 Lodge', value: 'lodge' },
        ].map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filterType === f.value && styles.filterChipActive]}
            onPress={() => setFilterType(f.value)}
          >
            <Text style={[styles.filterText, filterType === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[IS_WEB && styles.listWrapWeb]}>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[
            { padding: 16, gap: 16, paddingBottom: 40 },
            IS_WEB && { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any,
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          renderItem={renderItem}
          numColumns={IS_WEB ? 2 : 1}
          key={IS_WEB ? 'web-2' : 'mob-1'}
          columnWrapperStyle={IS_WEB ? ({ gap: 16 } as any) : undefined}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bed-outline" size={56} color={theme.colors.border} />
              <Text style={styles.emptyTitle}>No properties available</Text>
              <Text style={styles.emptySub}>We're adding more accommodation options. Check back soon!</Text>
            </View>
          }
          ListFooterComponent={IS_WEB ? <WebFooter /> : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  header: { paddingBottom: IS_WEB ? 32 : 20 },
  headerInner: { paddingHorizontal: IS_WEB ? 48 : 16, paddingTop: IS_WEB ? 36 : 8 },
  backBtn: { marginBottom: 12 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 10,
  },
  headerBadgeText: { color: '#FFD54F', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: IS_WEB ? 40 : 26, fontWeight: '900', marginBottom: 4 },
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
    ...(IS_WEB ? { overflowX: 'auto' } as any : { flexWrap: 'nowrap' }),
  },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1.5, borderColor: theme.colors.border, flexShrink: 0 },
  filterChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  filterTextActive: { color: '#fff' },

  listWrapWeb: { flex: 1, ...(IS_WEB ? { overflowY: 'auto' } as any : {}) } as any,

  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardWeb: { ...(IS_WEB ? { boxShadow: '0 4px 20px rgba(2,119,189,0.1)' } as any : {}) },

  cardImage: {
    height: IS_WEB ? 160 : 120, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(2,136,209,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  typeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  cardBody: { padding: 14 },
  propName: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  templeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  templeName: { fontSize: 12, color: '#E67E22', fontWeight: '600', flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  location: { fontSize: 12, color: theme.colors.textMuted, flex: 1 },

  infoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  infoChipText: { fontSize: 11, color: theme.colors.textMuted },

  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: BLUE, borderRadius: 12, paddingVertical: 11,
  },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty: { alignItems: 'center', marginTop: 80, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 16 },
  emptySub: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
