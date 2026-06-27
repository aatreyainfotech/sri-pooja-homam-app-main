import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function Temples() {
  const router = useRouter();
  const [temples, setTemples] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/temples');
      setTemples(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = temples.filter((t) =>
    !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.location.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <Text style={styles.headerTitle}>Sacred Temples</Text>
        <Text style={styles.headerSub}>Discover & book divine services</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            testID="temples-search-input"
            value={q}
            onChangeText={setQ}
            placeholder="Search temples..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.search}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`temple-card-${item.id}`}
            activeOpacity={0.9}
            onPress={() => router.push(`/temple/${item.id}`)}
            style={styles.card}
          >
            <View style={styles.bannerWrap}>
              {!!item.banner && <Image source={{ uri: item.banner }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
              <LinearGradient colors={['transparent', 'rgba(45,27,25,0.5)']} style={StyleSheet.absoluteFill} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.row}>
                <View style={styles.logoWrap}>
                  {!!item.logo && <Image source={{ uri: item.logo }} style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} resizeMode="cover" />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.meta}>
                    <Ionicons name="location-outline" size={13} color={theme.colors.primary} />
                    <Text style={styles.loc}>{item.location}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.deity}>🕉 {item.deity}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.btnRow}>
                <View style={styles.btnView}>
                  <Text style={styles.btnViewText}>View Poojas</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ color: theme.colors.textMuted }}>No temples found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  searchWrap: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 14, color: theme.colors.text },

  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#8B1515', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  bannerWrap: { width: '100%', height: 160, backgroundColor: '#3D1515' },
  cardBody: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  logoWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondary, overflow: 'hidden' },
  name: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  loc: { fontSize: 12, color: theme.colors.textSecondary },
  deity: { fontSize: 13, color: theme.colors.secondaryDark, fontWeight: '600', marginTop: 10 },
  desc: { fontSize: 13, color: theme.colors.textMuted, marginTop: 6, lineHeight: 18 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  btnView: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnViewText: { color: theme.colors.primary, fontWeight: '700', fontSize: 13 },
});
