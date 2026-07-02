import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  useWindowDimensions, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../src/services/api';
import WebFooter from '../src/components/WebFooter';

const GOLD = '#C9922A';
const SAFFRON = '#8B3520';
const IS_WEB = Platform.OS === 'web';

const STATES = [
  {
    id: 'andhra-pradesh', name: 'Andhra Pradesh', color: '#7A3020',
    temples: ['Tirupati Balaji', 'Srisailam Mallikarjuna', 'Kanaka Durga – Vijayawada', 'Simhachalam Temple', 'Annavaram Satyanarayana'],
    highlights: 'Home to the richest temple in the world – Tirumala Tirupati Devasthanams.',
  },
  {
    id: 'telangana', name: 'Telangana', color: '#C9922A',
    temples: ['Yadagirigutta Narasimha', 'Bhadrachalam Sita Ramachandra', 'Dharmapuri Narasimha', 'Keesaragutta Ramalingeswara', 'Vemulawada Rajarajeshwara'],
    highlights: 'Rich in Shaivite and Vaishnavite traditions with ancient rock-cut temples.',
  },
  {
    id: 'tamil-nadu', name: 'Tamil Nadu', color: '#A67A1E',
    temples: ['Meenakshi Amman – Madurai', 'Ramanathaswamy – Rameswaram', 'Brihadeeswarar – Thanjavur', 'Nataraja – Chidambaram', 'Murugan – Palani'],
    highlights: 'Land of Dravidian architecture with towering gopurams and ancient Divya Desams.',
  },
  {
    id: 'karnataka', name: 'Karnataka', color: '#8B3520',
    temples: ['Udupi Sri Krishna', 'Kukke Subramanya', 'Chamundeshwari – Mysore', 'Murdeshwar Shiva', 'Dharmasthala Manjunatha'],
    highlights: 'Karnataka blends coastal temples with Deccan plateau shrines.',
  },
  {
    id: 'kerala', name: 'Kerala', color: '#9A4130',
    temples: ['Guruvayur Krishna', 'Sabarimala Ayyappa', 'Padmanabhaswamy – Thiruvananthapuram', 'Ettumanoor Mahadeva', 'Kodungallur Bhagavathy'],
    highlights: 'God\'s Own Country — serene temples set amid lush green backwaters.',
  },
  {
    id: 'maharashtra', name: 'Maharashtra', color: '#C9922A',
    temples: ['Shirdi Sai Baba', 'Trimbakeshwar Jyotirlinga', 'Pandharpur Vitthal', 'Kolhapur Mahalaxmi', 'Ashtavinayak Circuit'],
    highlights: 'Maharashtra holds 3 of the 12 Jyotirlingas and the beloved Shirdi Sai Baba.',
  },
  {
    id: 'gujarat', name: 'Gujarat', color: '#7A3020',
    temples: ['Somnath Jyotirlinga', 'Dwarkadhish – Dwarka', 'Ambaji Devi', 'Akshardham – Gandhinagar', 'Bahucharaji Mata'],
    highlights: 'Gujarat has 2 of the 12 Jyotirlingas and the sacred Char Dham city of Dwarka.',
  },
  {
    id: 'uttarakhand', name: 'Uttarakhand', color: '#A67A1E',
    temples: ['Badrinath', 'Kedarnath', 'Gangotri', 'Yamunotri', 'Haridwar & Rishikesh'],
    highlights: 'Dev Bhoomi — the sacred land of gods, home to Char Dham yatra.',
  },
  {
    id: 'uttar-pradesh', name: 'Uttar Pradesh', color: '#8B3520',
    temples: ['Kashi Vishwanath – Varanasi', 'Krishna Janmabhoomi – Mathura', 'Ram Janmabhoomi – Ayodhya', 'Vindhyavasini Devi', 'Chitrakoot Dham'],
    highlights: 'UP is the spiritual heartland — Varanasi, Mathura, Ayodhya: all are here.',
  },
];

export default function DestinationsPage() {
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state?: string }>();
  const { width: W } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [states, setStates] = useState(STATES);
  const innerW = Math.min(W, 1280);

  // Load states from platform settings (cache → backend)
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem('sph_platform_settings');
        if (cached) {
          const p = JSON.parse(cached);
          if (Array.isArray(p.states) && p.states.length > 0) setStates(p.states);
        }
      } catch {}
      try {
        const { data } = await api.get('/platform-settings');
        if (Array.isArray(data?.states) && data.states.length > 0) {
          setStates(data.states);
          const cached = await AsyncStorage.getItem('sph_platform_settings').catch(() => null);
          const prev = cached ? JSON.parse(cached) : {};
          await AsyncStorage.setItem('sph_platform_settings', JSON.stringify({ ...prev, states: data.states }));
        }
      } catch {}
    })();
  }, []);

  const filtered = states.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = state ? states.find(s => s.id === state) : null;

  if (IS_WEB) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', ...(Platform.OS === 'web' ? { overflowY: 'auto' } as any : {}) }}>
        {/* Hero */}
        <LinearGradient colors={['#1A0C07', '#3D1408', '#7A3020']} locations={[0, 0.5, 1]} style={s.hero}>
          <Text style={s.heroOm}>ॐ</Text>
          <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={s.backText}>Home</Text>
            </TouchableOpacity>
            <Text style={s.heroTitle}>Sacred Destinations</Text>
            <Text style={s.heroSub}>Explore 1000+ temples across 9 Indian states</Text>
            {/* Search */}
            <View style={s.searchBar}>
              <Ionicons name="search" size={18} color={SAFFRON} />
              <TextInput
                style={s.searchInput}
                placeholder="Search state or destination..."
                placeholderTextColor="#aaa"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        </LinearGradient>

        {/* State Detail (if state selected) */}
        {selected && (
          <View style={{ backgroundColor: '#F9F4F4', borderBottomWidth: 1, borderBottomColor: 'rgba(139,21,21,0.12)' }}>
            <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', padding: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 280 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: selected.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="location" size={24} color={selected.color} />
                    </View>
                    <Text style={{ color: '#1A0505', fontSize: 28, fontWeight: '900' }}>{selected.name}</Text>
                  </View>
                  <Text style={{ color: '#5A5A5A', fontSize: 15, lineHeight: 24, marginBottom: 16 }}>{selected.highlights}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 240 }}>
                  <Text style={{ color: '#1A0505', fontSize: 14, fontWeight: '800', marginBottom: 12, letterSpacing: 0.8 }}>FAMOUS TEMPLES</Text>
                  {selected.temples.map((t) => (
                    <TouchableOpacity key={t} onPress={() => router.push('/(tabs)/temples' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(139,21,21,0.08)' }}>
                      <Ionicons name="business-outline" size={14} color={selected.color} />
                      <Text style={{ color: '#1A0505', fontSize: 14, flex: 1 }}>{t}</Text>
                      <Ionicons name="chevron-forward" size={14} color="rgba(74,44,42,0.35)" />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => router.push('/accommodation' as any)}
                    style={{ marginTop: 16, backgroundColor: SAFFRON, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Find Accommodation Here</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* All States Grid */}
        <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', padding: 40 }}>
          <Text style={{ color: '#1A0505', fontSize: 22, fontWeight: '900', marginBottom: 24, borderLeftWidth: 4, borderLeftColor: SAFFRON, paddingLeft: 14 }}>
            {selected ? 'All Destinations' : 'Explore All States'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {filtered.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                onPress={() => router.push(`/destinations?state=${dest.id}` as any)}
                activeOpacity={0.85}
                style={{
                  flex: 1, minWidth: 220,
                  backgroundColor: dest.id === state ? dest.color + '15' : '#fff',
                  borderRadius: 18, padding: 22,
                  borderWidth: dest.id === state ? 2 : 1,
                  borderColor: dest.id === state ? dest.color : 'rgba(230,126,34,0.15)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } as any : {}),
                } as any}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: dest.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="location" size={20} color={dest.color} />
                  </View>
                  <Text style={{ color: '#1A0505', fontSize: 16, fontWeight: '800', flex: 1 }}>{dest.name}</Text>
                </View>
                <Text style={{ color: '#666666', fontSize: 12, lineHeight: 18 }} numberOfLines={2}>{dest.highlights}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}>
                  <Text style={{ color: dest.color, fontSize: 12, fontWeight: '700' }}>{dest.temples.length}+ temples</Text>
                  <Ionicons name="arrow-forward" size={12} color={dest.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <WebFooter />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <LinearGradient colors={['#1A0C07', '#3D1408', '#7A3020']} style={{ paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 }}>Destinations</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {states.map((dest) => (
          <TouchableOpacity
            key={dest.id}
            onPress={() => router.push('/(tabs)/temples' as any)}
            style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: dest.color, borderWidth: 1, borderColor: 'rgba(139,21,21,0.1)' }}
          >
            <Text style={{ color: '#1A0505', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>{dest.name}</Text>
            <Text style={{ color: '#666666', fontSize: 12 }} numberOfLines={1}>{dest.highlights}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { paddingVertical: 56, paddingHorizontal: 24, overflow: 'hidden' },
  heroOm: { position: 'absolute', right: -10, top: -10, fontSize: 220, color: 'rgba(0,0,0,0.1)', fontWeight: '400' } as any,
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  heroTitle: { color: '#fff', fontSize: 44, fontWeight: '900', lineHeight: 52 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 8, marginBottom: 28 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13,
    maxWidth: 520,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(0,0,0,0.2)' } as any : {}),
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A0505', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) } as any,
});
