import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function TempleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const safeBack = useSafeBack();
  const [temple, setTemple] = useState<any>(null);
  const [poojas, setPoojas] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pooja' | 'homam'>('all');

  useEffect(() => {
    (async () => {
      try {
        const [t, p] = await Promise.all([
          api.get(`/temples/${id}`),
          api.get(`/poojas`, { params: { temple_id: id } }),
        ]);
        setTemple(t.data);
        setPoojas(p.data);
      } catch {}
    })();
  }, [id]);

  if (!temple) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const filtered = filter === 'all' ? poojas : poojas.filter((p) => p.type === filter);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bannerWrap}>
          {!!temple.banner && <Image source={{ uri: temple.banner }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(45,27,25,0.9)']} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={styles.bannerSafe} edges={['top']}>
            <TouchableOpacity testID="temple-back-btn" onPress={() => safeBack('/(tabs)/temples')} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.bannerContent}>
            <View style={styles.logoWrap}>
              {!!temple.logo && <Image source={{ uri: temple.logo }} style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} resizeMode="cover" />}
            </View>
            <Text style={styles.templeName}>{temple.name}</Text>
            <View style={styles.row}>
              <Ionicons name="location" size={14} color={theme.colors.secondary} />
              <Text style={styles.loc}>{temple.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.deityCard}>
            <Text style={styles.deityLabel}>PRESIDING DEITY</Text>
            <Text style={styles.deity}>🕉 {temple.deity}</Text>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.desc}>{temple.description}</Text>

          <Text style={styles.sectionTitle}>Available Services ({poojas.length})</Text>

          <View style={styles.filterRow}>
            {(['all', 'pooja', 'homam'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                testID={`temple-filter-${f}`}
                onPress={() => setFilter(f)}
                style={[styles.filter, filter === f && styles.filterActive]}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.map((p) => (
            <TouchableOpacity
              key={p.id}
              testID={`temple-pooja-${p.id}`}
              activeOpacity={0.9}
              onPress={() => router.push(`/book-pooja/${p.id}`)}
              style={styles.poojaCard}
            >
              <View style={styles.poojaImgWrap}>
                {!!p.image && <Image source={{ uri: p.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.typeTag(p.type)}>
                  <Text style={styles.typeTagText}>{p.type === 'homam' ? '🔥 HOMAM' : '🌸 POOJA'}</Text>
                </View>
                <Text style={styles.poojaName}>{p.name}</Text>
                <Text style={styles.poojaDesc} numberOfLines={2}>{p.description}</Text>
                <View style={styles.poojaFoot}>
                  <Text style={styles.poojaPrice}>₹{p.price.toFixed(0)}</Text>
                  <Text style={styles.poojaDur}>⏱ {p.duration}</Text>
                </View>
                <View style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>Book Now</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles: any = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bannerWrap: { height: 320, position: 'relative', backgroundColor: '#3D1515' },
  bannerSafe: { position: 'absolute', top: 0, left: 0, right: 0, padding: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  bannerContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  logoWrap: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 3, borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondary, overflow: 'hidden',
    marginBottom: 10,
  },
  templeName: { color: '#fff', fontSize: 28, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  loc: { color: theme.colors.secondary, fontSize: 13, fontWeight: '600' },

  content: { padding: 20 },
  deityCard: {
    backgroundColor: 'rgba(212,175,55,0.12)', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)', marginBottom: 20,
  },
  deityLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.secondaryDark, letterSpacing: 1.5 },
  deity: { fontSize: 18, fontWeight: '700', color: theme.colors.primary, marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 8, marginBottom: 8 },
  desc: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 14 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filter: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border },
  filterActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  filterTextActive: { color: '#fff' },

  poojaCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 18,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12,
  },
  poojaImgWrap: { width: 100, height: 130, borderRadius: 14, backgroundColor: '#F5E6D0', overflow: 'hidden' },
  typeTag: (type: string) => ({
    alignSelf: 'flex-start',
    backgroundColor: type === 'homam' ? '#FFF3E0' : '#FFEBEE',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4,
  }),
  typeTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: theme.colors.primary },
  poojaName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  poojaDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2, lineHeight: 16 },
  poojaFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  poojaPrice: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },
  poojaDur: { fontSize: 11, color: theme.colors.textMuted },
  bookBtn: {
    flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, marginTop: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
