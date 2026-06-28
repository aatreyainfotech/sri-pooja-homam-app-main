import {
  useEffect, useState, useCallback, useRef,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated,
  RefreshControl, FlatList, Dimensions, NativeSyntheticEvent,
  NativeScrollEvent, useWindowDimensions, Linking, Platform, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import WebFooter from '../../src/components/WebFooter';
import WelcomePopup from '../../src/components/WelcomePopup';

const GOLD    = '#D4AF37';
const SAFFRON = '#E67E22';
const BG      = '#FFF8E7';
const IS_WEB  = Platform.OS === 'web';

function parseImages(s: string | null | undefined): string[] {
  if (!s) return [];
  if (s.includes('|||')) return s.split('|||').map(v => v.trim()).filter(Boolean);
  if (s.startsWith('data:')) return [s.trim()];
  return s.split(',').map(v => v.trim()).filter(Boolean);
}

const DESTINATIONS = [
  { name: 'Tirupati', state: 'Andhra Pradesh', color: '#FF5722', route: '/destinations?state=andhra-pradesh' },
  { name: 'Varanasi', state: 'Uttar Pradesh', color: '#9C27B0', route: '/destinations?state=uttar-pradesh' },
  { name: 'Rishikesh', state: 'Uttarakhand', color: '#00BCD4', route: '/destinations?state=uttarakhand' },
  { name: 'Shirdi', state: 'Maharashtra', color: '#FF9800', route: '/destinations?state=maharashtra' },
  { name: 'Madurai', state: 'Tamil Nadu', color: '#E91E63', route: '/destinations?state=tamil-nadu' },
  { name: 'Udupi', state: 'Karnataka', color: '#4CAF50', route: '/destinations?state=karnataka' },
  { name: 'Dwarka', state: 'Gujarat', color: '#2196F3', route: '/destinations?state=gujarat' },
  { name: 'Guruvayur', state: 'Kerala', color: '#8BC34A', route: '/destinations?state=kerala' },
];

const FESTIVALS = [
  { name: 'Guru Purnima', date: 'Jul 21, 2025', desc: 'Day of spiritual teachers', color: '#9C27B0' },
  { name: 'Varalakshmi Vratham', date: 'Aug 8, 2025', desc: 'Goddess Lakshmi festival', color: '#E91E63' },
  { name: 'Ganesh Chaturthi', date: 'Aug 27, 2025', desc: "Lord Ganesha's birthday", color: '#FF5722' },
  { name: 'Navratri Begins', date: 'Oct 2, 2025', desc: 'Nine nights of goddess worship', color: '#F44336' },
  { name: 'Diwali', date: 'Oct 20, 2025', desc: 'Festival of lights', color: '#FFC107' },
  { name: 'Karthika Masam', date: 'Nov 1, 2025', desc: 'Holy month of Lord Shiva', color: '#2196F3' },
];

const SERVICES = [
  { title: 'Book Pooja',     desc: 'Perform sacred poojas at home or at the temple with verified Vedic pujaris.', icon: 'flower-outline',   color: '#FF8C00', bg: 'rgba(255,140,0,0.14)', route: '/(tabs)/temples' },
  { title: 'Perform Homam', desc: 'Sacred fire rituals for prosperity, health and removal of obstacles.',          icon: 'flame-outline',    color: '#FF5722', bg: 'rgba(255,87,34,0.14)',  route: '/(tabs)/temples' },
  { title: 'Live Darshan',  desc: 'Watch sacred rituals streaming live from temples across India.',                icon: 'videocam-outline', color: '#29B6F6', bg: 'rgba(41,182,246,0.13)', route: '/(tabs)/live' },
  { title: 'Pujari at Home',desc: 'Invite a qualified pujari to your home for all auspicious occasions.',         icon: 'home-outline',     color: '#66BB6A', bg: 'rgba(102,187,106,0.13)',route: '/(tabs)/temples' },
];

// ── Temple Multi-Card Carousel (4 visible, auto-scroll) ──────────────────
const ssArrow = {
  width: 44, height: 44, borderRadius: 22,
  backgroundColor: 'rgba(255,248,231,0.95)', alignItems: 'center' as const,
  justifyContent: 'center' as const, borderWidth: 1, borderColor: 'rgba(230,126,34,0.35)',
};

function TempleMultiCarousel({ temples, innerW }: { temples: any[]; innerW: number }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const VISIBLE = 4;
  const GAP = 20;
  const cardW = Math.floor((innerW - GAP * (VISIBLE - 1)) / VISIBLE);
  const step = cardW + GAP;
  const maxIdx = Math.max(0, temples.length - VISIBLE);

  const goTo = useCallback((next: number) => {
    const n = ((next % (maxIdx + 1)) + (maxIdx + 1)) % (maxIdx + 1);
    setIdx(n);
    Animated.timing(anim, { toValue: -n * step, duration: 600, useNativeDriver: false }).start();
  }, [maxIdx, step, anim]);

  useEffect(() => {
    if (temples.length <= VISIBLE) return;
    const t = setInterval(() => goTo(idx + 1), 3500);
    return () => clearInterval(t);
  }, [idx, temples.length, goTo]);

  if (temples.length === 0) return null;

  return (
    <View>
      <View style={{ overflow: 'hidden' } as any}>
        <Animated.View style={{
          flexDirection: 'row', gap: GAP,
          transform: [{ translateX: anim }],
          width: (cardW + GAP) * temples.length,
        }}>
          {temples.map((t: any) => (
            <TouchableOpacity
              key={t.id} activeOpacity={0.88}
              onPress={() => router.push(`/temple/${t.id}` as any)}
              style={{ width: cardW, height: 260, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1C0606', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', flexShrink: 0 } as any}
            >
              {!!t.banner && <Image source={{ uri: t.banner }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
              <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(10,2,2,0.93)']} style={StyleSheet.absoluteFill} />
              <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' }}>
                <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700' }}>Explore →</Text>
              </View>
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
                <Text style={{ color: 'rgba(212,175,55,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 5 }}>
                  {(t.deity || '').toUpperCase()}
                </Text>
                <Text style={{ color: '#FFF8F0', fontSize: 17, fontWeight: '900', marginBottom: 4 }}>{t.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="location" size={11} color={GOLD} />
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{t.location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Controls */}
      {temples.length > VISIBLE && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 24 }}>
          <TouchableOpacity onPress={() => goTo(idx - 1)} style={ssArrow}>
            <Ionicons name="chevron-back" size={20} color="#4A2C2A" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <View style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === idx ? GOLD : 'rgba(74,44,42,0.2)' }} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => goTo(idx + 1)} style={ssArrow}>
            <Ionicons name="chevron-forward" size={20} color="#4A2C2A" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Pooja 3-Card Auto Carousel ────────────────────────────────────────────
function PoojaCarousel({ poojas, innerW }: { poojas: any[]; innerW: number }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const VISIBLE = 3;
  const GAP = 22;
  const cardW = Math.floor((innerW - GAP * (VISIBLE - 1)) / VISIBLE);
  const step = cardW + GAP;
  const maxIdx = Math.max(0, poojas.length - VISIBLE);

  const goTo = useCallback((next: number) => {
    const n = ((next % (maxIdx + 1)) + (maxIdx + 1)) % (maxIdx + 1);
    setIdx(n);
    Animated.timing(anim, { toValue: -n * step, duration: 600, useNativeDriver: false }).start();
  }, [maxIdx, step, anim]);

  useEffect(() => {
    if (poojas.length <= VISIBLE) return;
    const t = setInterval(() => goTo(idx + 1), 3500);
    return () => clearInterval(t);
  }, [idx, poojas.length, goTo]);

  if (poojas.length === 0) return null;

  return (
    <View>
      <View style={{ overflow: 'hidden' } as any}>
        <Animated.View style={{
          flexDirection: 'row', gap: GAP,
          transform: [{ translateX: anim }],
          width: (cardW + GAP) * poojas.length,
        }}>
          {poojas.map((p: any) => (
            <TouchableOpacity
              key={p.id} activeOpacity={0.88}
              onPress={() => router.push(`/book-pooja/${p.id}` as any)}
              style={{
                width: cardW, borderRadius: 20, overflow: 'hidden', flexShrink: 0,
                backgroundColor: '#fff',
                borderWidth: 1, borderColor: 'rgba(230,126,34,0.2)',
                ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(74,44,42,0.12)' } : {}),
              } as any}
            >
              {/* Image */}
              <View style={{ height: 210, position: 'relative', backgroundColor: '#FFF0D0' }}>
                {!!p.image && <Image source={{ uri: p.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
              </View>
              {/* Card body */}
              <View style={{ padding: 18, borderTopWidth: 1, borderTopColor: 'rgba(230,126,34,0.1)' }}>
                <View style={{
                  alignSelf: 'flex-start', marginBottom: 10,
                  backgroundColor: p.type === 'homam' ? 'rgba(230,126,34,0.12)' : 'rgba(178,34,34,0.1)',
                  borderWidth: 1,
                  borderColor: p.type === 'homam' ? 'rgba(230,126,34,0.4)' : 'rgba(178,34,34,0.35)',
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#4A2C2A' }}>
                    {p.type?.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ color: '#4A2C2A', fontSize: 16, fontWeight: '800', marginBottom: 6, lineHeight: 22 }} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={{ color: '#5A5A5A', fontSize: 12, lineHeight: 18, marginBottom: 14 }} numberOfLines={2}>
                  {p.description}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: SAFFRON }}>₹{p.price}</Text>
                  {!!p.duration && <Text style={{ fontSize: 11, color: '#8A7A6A' }}>{p.duration}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/book-pooja/${p.id}` as any)}
                  style={{
                    borderRadius: 12, paddingVertical: 11, alignItems: 'center',
                    ...(Platform.OS === 'web' ? {
                      background: 'linear-gradient(135deg, #B22222 0%, #8B1515 100%)',
                      boxShadow: '0 4px 16px rgba(178,34,34,0.4)',
                    } : { backgroundColor: '#B22222' }),
                  } as any}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 }}>Book Now →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Controls */}
      {poojas.length > VISIBLE && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 24 }}>
          <TouchableOpacity onPress={() => goTo(idx - 1)} style={ssArrow}>
            <Ionicons name="chevron-back" size={20} color="#4A2C2A" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <View style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === idx ? GOLD : 'rgba(74,44,42,0.2)' }} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => goTo(idx + 1)} style={ssArrow}>
            <Ionicons name="chevron-forward" size={20} color="#4A2C2A" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Web Desktop Homepage ───────────────────────────────────────────────────
function WebHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { width: W } = useWindowDimensions();
  const [temples, setTemples] = useState<any[]>([]);
  const [poojas, setPoojas] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [searchDest, setSearchDest] = useState('');
  const [searchTemple, setSearchTemple] = useState('');
  const [searchGuests, setSearchGuests] = useState('2');

  const innerW = Math.min(W, 1280);

  useEffect(() => {
    Promise.all([
      api.get('/temples'),
      api.get('/poojas'),
      api.get('/live-streams').catch(() => ({ data: [] })),
      api.get('/properties').catch(() => ({ data: [] })),
    ]).then(([t, p, l, pr]) => {
      setTemples(t.data || []);
      setPoojas(p.data || []);
      setLive(l.data || []);
      setProperties((pr.data || []).filter((x: any) => x.is_active));
    }).catch(() => {});
  }, []);

  return (
    <View style={[
      { backgroundColor: BG },
      Platform.OS === 'web' ? { flex: 1, overflowY: 'auto' } as any : {},
    ]}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View style={wh.hero}>
        {/* Background gradient */}
        <LinearGradient
          colors={['#4A2C2A', '#B22222', '#D35400', '#E67E22']}
          locations={[0, 0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Decorative OM */}
        <Text style={wh.heroOm}>ॐ</Text>

        <View style={[wh.heroInner, { maxWidth: innerW }]}>
          <View style={wh.heroBadge}>
            <View style={wh.heroBadgeDot} />
            <Text style={wh.heroBadgeText}>DIVINE DEVOTION AT YOUR FINGERTIPS</Text>
          </View>

          <Text style={wh.heroTitle}>Sri Pooja Homam</Text>
          <Text style={wh.heroTelugu}>శ్రీ పూజా హోమం</Text>

          <Text style={wh.heroSub}>
            Book sacred poojas and homams with verified pujaris.{'\n'}
            Experience the grace of ancient Vedic rituals from your home.
          </Text>

          <View style={wh.heroBtns}>
            <TouchableOpacity
              onPress={() => user ? router.push('/(tabs)/temples' as any) : router.push('/(auth)/login' as any)}
              style={wh.heroBtn1}
            >
              <Text style={wh.heroBtn1Text}>Book a Pooja Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#2D0B00" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/live' as any)}
              style={wh.heroBtn2}
            >
              <View style={wh.liveDotRed} />
              <Text style={wh.heroBtn2Text}>Watch Live Darshan</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={wh.statsBar}>
            {[
              { v: '500+',   l: 'Temples' },
              { v: '1000+',  l: 'Poojas & Homams' },
              { v: '24/7',   l: 'Live Darshan' },
              { v: '10,000+', l: 'Devotees Served' },
            ].map((s, i) => (
              <View key={i} style={wh.statItem}>
                <Text style={wh.statValue}>{s.v}</Text>
                <Text style={wh.statLabel}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── SMART SEARCH ─────────────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FDF5E6', paddingVertical: 0 }]}>
        <View style={{
          maxWidth: innerW, alignSelf: 'center', width: '100%',
          paddingHorizontal: 24, marginTop: -36,
        }}>
          <View style={wh.searchCard}>
            <View style={wh.searchRow}>
              <View style={wh.searchField}>
                <Ionicons name="location-outline" size={18} color={SAFFRON} />
                <TextInput
                  style={wh.searchInput}
                  placeholder="Destination / State"
                  placeholderTextColor="#aaa"
                  value={searchDest}
                  onChangeText={setSearchDest}
                />
              </View>
              <View style={wh.searchDivider} />
              <View style={wh.searchField}>
                <Ionicons name="business-outline" size={18} color={SAFFRON} />
                <TextInput
                  style={wh.searchInput}
                  placeholder="Temple Name"
                  placeholderTextColor="#aaa"
                  value={searchTemple}
                  onChangeText={setSearchTemple}
                />
              </View>
              <View style={wh.searchDivider} />
              <View style={wh.searchField}>
                <Ionicons name="calendar-outline" size={18} color={SAFFRON} />
                <TextInput style={wh.searchInput} placeholder="Check-in Date" placeholderTextColor="#aaa" />
              </View>
              <View style={wh.searchDivider} />
              <View style={wh.searchField}>
                <Ionicons name="calendar-outline" size={18} color={SAFFRON} />
                <TextInput style={wh.searchInput} placeholder="Check-out Date" placeholderTextColor="#aaa" />
              </View>
              <View style={wh.searchDivider} />
              <View style={[wh.searchField, { maxWidth: 100 }]}>
                <Ionicons name="people-outline" size={18} color={SAFFRON} />
                <TextInput
                  style={wh.searchInput}
                  placeholder="Guests"
                  placeholderTextColor="#aaa"
                  value={searchGuests}
                  onChangeText={setSearchGuests}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={wh.searchBtn}
                onPress={() => router.push('/accommodation' as any)}
              >
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={wh.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── LIVE DARSHAN ─────────────────────────────────────────────────── */}
      {live.length > 0 && (
        <View style={[wh.sectionBg, { backgroundColor: '#FFF8E7' }]}>
          <View style={[wh.section, { maxWidth: innerW }]}>
            <SecHead title="Live Darshan" sub="Sacred rituals streaming now" onAll={() => router.push('/(tabs)/live' as any)} />
            <View style={wh.liveGrid}>
              {live.slice(0, 3).map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/live-stream/${item.id}` as any)}
                  style={{ flex: 1, minWidth: 260 }}
                  activeOpacity={0.88}
                >
                  {/* Image card */}
                  <View style={{
                    height: 300, borderRadius: 16, overflow: 'hidden',
                    backgroundColor: '#1A0505', position: 'relative',
                    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.6)' } : {}),
                  } as any}>
                    <Image
                      source={{ uri: item.thumbnail || 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&w=600' }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    {/* Dark vignette at bottom */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.5)']}
                      style={StyleSheet.absoluteFill}
                    />
                    {/* LIVE NOW badge */}
                    <View style={{
                      position: 'absolute', bottom: 14, left: 14,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: '#E53935',
                      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
                    }}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' }} />
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>LIVE NOW</Text>
                    </View>
                  </View>
                  {/* Title & link below card */}
                  <Text style={{ color: '#4A2C2A', fontSize: 16, fontWeight: '800', marginTop: 14, lineHeight: 23 }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={{ color: SAFFRON, fontSize: 13, fontWeight: '600', marginTop: 6 }}>Tap to watch →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── POPULAR DESTINATIONS ─────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FFF8E7' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title="Popular Destinations" sub="Sacred pilgrimage cities across India" onAll={() => router.push('/destinations' as any)} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {DESTINATIONS.map((d) => (
              <TouchableOpacity
                key={d.name}
                onPress={() => router.push(d.route as any)}
                activeOpacity={0.85}
                style={{
                  flex: 1, minWidth: 140,
                  backgroundColor: '#fff',
                  borderRadius: 16, overflow: 'hidden',
                  borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 18px rgba(74,44,42,0.1)' } as any : {}),
                } as any}
              >
                <LinearGradient
                  colors={[d.color + '22', d.color + '08']}
                  style={{ padding: 18, alignItems: 'center', gap: 8 }}
                >
                  <View style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: d.color + '20',
                    borderWidth: 2, borderColor: d.color + '40',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="location" size={22} color={d.color} />
                  </View>
                  <Text style={{ color: '#4A2C2A', fontSize: 15, fontWeight: '800', textAlign: 'center' }}>{d.name}</Text>
                  <Text style={{ color: '#7A6A5A', fontSize: 11, textAlign: 'center' }}>{d.state}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FDF5E6' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title="Our Services" sub="Everything you need for sacred rituals" />
          <View style={wh.servGrid}>
            {SERVICES.map((s) => (
              <TouchableOpacity key={s.title} onPress={() => router.push(s.route as any)} style={wh.servCard}>
                <View style={[wh.servIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={30} color={s.color} />
                </View>
                <Text style={wh.servTitle}>{s.title}</Text>
                <Text style={wh.servDesc}>{s.desc}</Text>
                <Text style={wh.servLink}>Learn more →</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── TEMPLES CAROUSEL ─────────────────────────────────────────────── */}
      {temples.length > 0 && (
        <View style={{ paddingTop: 56, paddingBottom: 56, backgroundColor: '#FFF8E7' }}>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%', marginBottom: 28 }}>
            <SecHead title="Featured Temples" sub="Sacred shrines across India" onAll={() => router.push('/(tabs)/temples' as any)} />
          </View>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%' }}>
            <TempleMultiCarousel temples={temples} innerW={Math.min(W, 1280) - 96} />
          </View>
        </View>
      )}

      {/* ── FEATURED ACCOMMODATIONS ──────────────────────────────────────── */}
      {properties.length > 0 && (
        <View style={[wh.sectionBg, { backgroundColor: '#FFF8E7' }]}>
          <View style={[wh.section, { maxWidth: innerW }]}>
            <SecHead title="Featured Accommodations" sub="Hotels & dharamshalas near sacred temples" onAll={() => router.push('/accommodation' as any)} />
            <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
              {properties.slice(0, 3).map((p: any) => {
                const img = parseImages(p.images)[0] || null;
                return (
                  <AccomCard
                    key={p.id}
                    property={p}
                    img={img}
                    onPress={() => router.push(`/accommodation/${p.id}` as any)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* ── POOJAS CAROUSEL ──────────────────────────────────────────────── */}
      {poojas.length > 0 && (
        <View style={{ paddingTop: 56, paddingBottom: 56, backgroundColor: '#FDF5E6' }}>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%', marginBottom: 28 }}>
            <SecHead title="Book a Pooja or Homam" sub="Performed by verified Vedic pujaris" onAll={() => router.push('/(tabs)/temples' as any)} />
          </View>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%' }}>
            <PoojaCarousel poojas={poojas} innerW={Math.min(W, 1280) - 96} />
          </View>
        </View>
      )}

      {/* ── FESTIVAL HIGHLIGHTS ──────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FFF8E7' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title="Festival Highlights" sub="Upcoming sacred festivals & celebrations" onAll={() => router.push('/(tabs)/calendar' as any)} />
          <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
            {FESTIVALS.map((f) => (
              <View
                key={f.name}
                style={{
                  flex: 1, minWidth: 220,
                  backgroundColor: '#fff', borderRadius: 16, padding: 18,
                  borderLeftWidth: 4, borderLeftColor: f.color,
                  borderWidth: 1, borderColor: 'rgba(230,126,34,0.12)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 18px rgba(74,44,42,0.08)' } as any : {}),
                } as any}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: f.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="calendar" size={18} color={f.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: f.color, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{f.date}</Text>
                    <Text style={{ color: '#4A2C2A', fontSize: 14, fontWeight: '800', marginTop: 1 }}>{f.name}</Text>
                  </View>
                </View>
                <Text style={{ color: '#7A6A5A', fontSize: 12, lineHeight: 18 }}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── ACCOMMODATION TEASER ─────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FDF5E6' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title="Temple Accommodation" sub="Stay near the divine — hotels & dharamshalas near temples" />
          <View style={{
            borderRadius: 24, overflow: 'hidden', position: 'relative',
            ...(Platform.OS === 'web' ? { boxShadow: '0 8px 40px rgba(74,44,42,0.12)' } as any : {}),
          } as any}>
            <LinearGradient
              colors={['#4A2C2A', '#B22222', '#D35400', '#E67E22']}
              start={[0, 0]} end={[1, 1]}
              style={{ padding: IS_WEB ? 56 : 32 }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 160, position: 'absolute', top: -20, right: 20, fontWeight: '400' } as any}>🏨</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
                <View style={{ flex: 1, minWidth: 280 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 5,
                    borderRadius: 999, marginBottom: 16,
                  }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' }} />
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>NOW AVAILABLE</Text>
                  </View>
                  <Text style={{ color: '#fff', fontSize: IS_WEB ? 36 : 26, fontWeight: '900', lineHeight: IS_WEB ? 44 : 34, marginBottom: 14 }}>
                    Book Your Stay{'\n'}Near Sacred Temples
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: IS_WEB ? 16 : 14, lineHeight: 26, marginBottom: 24 }}>
                    Dharamshalas, hotels & guesthouses near your chosen temple — all in one booking with your pooja.
                  </Text>
                  <View style={{ gap: 10, marginBottom: 28 }}>
                    {[
                      '🛏️  Room categories — Standard, Deluxe, Suite',
                      '📅  Dates synced with your pooja booking',
                      '🍽️  Prasadam & satvik food options',
                      '👨‍👩‍👧  Family rooms & pilgrim group packages',
                    ].map((f) => (
                      <Text key={f} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{f}</Text>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
                      backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999,
                      ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0,0,0,0.2)' } as any : {}),
                    } as any}
                    onPress={() => router.push('/accommodation' as any)}
                  >
                    <Ionicons name="bed-outline" size={18} color="#D35400" />
                    <Text style={{ color: '#D35400', fontWeight: '800', fontSize: 15 }}>Browse & Book Stays</Text>
                  </TouchableOpacity>
                </View>
                {/* Feature boxes */}
                <View style={{ gap: 12, minWidth: 200 }}>
                  {[
                    { icon: 'bed',           label: '500+',   sub: 'Properties listed' },
                    { icon: 'people',        label: '50+',    sub: 'Temple locations' },
                    { icon: 'star',          label: '4.8★',   sub: 'Average rating' },
                    { icon: 'shield-checkmark', label: '100%', sub: 'Verified properties' },
                  ].map((stat) => (
                    <View key={stat.label} style={{
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
                    }}>
                      <Ionicons name={stat.icon as any} size={22} color="#FFE0B2" />
                      <View>
                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{stat.label}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{stat.sub}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FFF8E7' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title="Why Choose Sri Pooja Homam?" sub="Trusted by thousands of devotees across India" />
          <View style={wh.whyGrid}>
            {[
              { icon: 'shield-checkmark-outline', title: 'Verified Pujaris', desc: 'All our pujaris are screened and certified in Vedic traditions.' },
              { icon: 'lock-closed-outline',      title: 'Secure Payments',  desc: 'Your transactions are fully encrypted and secure.' },
              { icon: 'time-outline',             title: 'On-Time Service',  desc: 'Punctual puja performance every time, no delays.' },
              { icon: 'star-outline',             title: 'Rated 4.8/5',      desc: 'Thousands of satisfied devotees across India.' },
              { icon: 'phone-portrait-outline',   title: 'Book Anywhere',    desc: 'Mobile app available on Android and iOS.' },
              { icon: 'videocam-outline',         title: 'Live Streaming',   desc: 'Watch your pooja live on your phone or computer.' },
            ].map((w) => (
              <View key={w.title} style={wh.whyCard}>
                <View style={wh.whyIcon}>
                  <Ionicons name={w.icon as any} size={26} color={GOLD} />
                </View>
                <Text style={wh.whyTitle}>{w.title}</Text>
                <Text style={wh.whyDesc}>{w.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── CTA / REGISTER ───────────────────────────────────────────────── */}
      <View style={wh.ctaSection}>
        <LinearGradient colors={['#C42B0A', '#8B1515', '#3A0000']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
        <Text style={wh.ctaOm}>ॐ</Text>
        <View style={[wh.ctaInner, { maxWidth: innerW }]}>
          <Text style={wh.ctaTitle}>Begin Your Spiritual Journey</Text>
          <Text style={wh.ctaSub}>
            Create a free account to book sacred poojas, watch live darshan{'\n'}
            and receive divine blessings from verified Vedic pujaris.
          </Text>
          <View style={wh.ctaBtns}>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)} style={wh.ctaBtn1}>
              <Text style={wh.ctaBtn1Text}>Register Free</Text>
              <Ionicons name="arrow-forward" size={15} color="#2D0B00" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} style={wh.ctaBtn2}>
              <Text style={wh.ctaBtn2Text}>Sign In</Text>
            </TouchableOpacity>
          </View>
          <View style={wh.storeRow}>
            <Text style={wh.storeLabel}>Also available on</Text>
            <TouchableOpacity style={wh.storeBtn} onPress={() => Linking.openURL('https://play.google.com/store/search?q=sri+pooja+homam')}>
              <Ionicons name="logo-android" size={16} color="#A5D6A7" />
              <Text style={wh.storeBtnText}>Google Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={wh.storeBtn} onPress={() => Linking.openURL('https://apps.apple.com/search?term=sri+pooja+homam')}>
              <Ionicons name="logo-apple" size={16} color="#90CAF9" />
              <Text style={wh.storeBtnText}>App Store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer — scrolls with homepage content */}
      <WebFooter />

    </View>
  );
}

// Section header helper
function SecHead({ title, sub, onAll }: { title: string; sub: string; onAll?: () => void }) {
  return (
    <View style={wh.secHead}>
      <View>
        <Text style={wh.secTitle}>{title}</Text>
        <Text style={wh.secSub}>{sub}</Text>
      </View>
      {onAll && (
        <TouchableOpacity onPress={onAll} style={wh.secAllBtn}>
          <Text style={wh.secAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color={GOLD} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Web home styles ─────────────────────────────────────────────────────────
const wh: any = {
  // Hero
  hero: {
    minHeight: '85vh',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  heroOm: {
    position: 'absolute', right: -20, top: -20,
    fontSize: 360, color: 'rgba(255,140,0,0.07)',
    fontWeight: '400', lineHeight: 400,
  },
  heroInner: { width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', marginBottom: 20,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  heroBadgeText: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  heroTitle: {
    color: '#fff', fontSize: 62, fontWeight: '900',
    letterSpacing: 1, lineHeight: 72,
    ...(Platform.OS === 'web' ? { textShadow: '0 4px 32px rgba(0,0,0,0.5)' } as any : {}),
  },
  heroTelugu: {
    color: GOLD, fontSize: 28, fontWeight: '800', letterSpacing: 2, marginTop: 6,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.72)', fontSize: 18, lineHeight: 30,
    marginTop: 16, maxWidth: 580,
  },
  heroBtns: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 32, flexWrap: 'wrap' },
  heroBtn1: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GOLD, paddingHorizontal: 28, paddingVertical: 15,
    borderRadius: 999,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(212,175,55,0.4)' } as any : {}),
  },
  heroBtn1Text: { color: '#2D0B00', fontSize: 16, fontWeight: '800' },
  heroBtn2: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 24, paddingVertical: 15,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBtn2Text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  liveDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF5350' },

  statsBar: {
    flexDirection: 'row', gap: 0, marginTop: 48, flexWrap: 'wrap',
    borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.2)', paddingTop: 28,
  },
  statItem: {
    paddingRight: 40, paddingBottom: 16,
    borderRightWidth: 1, borderRightColor: 'rgba(212,175,55,0.15)',
    marginRight: 40,
  },
  statValue: { color: GOLD, fontSize: 36, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 3, letterSpacing: 0.5 },

  // Section helpers
  sectionBg: { paddingVertical: 56, paddingHorizontal: 24 },
  section: { alignSelf: 'center', width: '100%' },
  secHead: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  secTitle: {
    color: '#4A2C2A', fontSize: 32, fontWeight: '900',
    paddingLeft: 16, borderLeftWidth: 4, borderLeftColor: SAFFRON,
  },
  secSub: { color: '#5A5A5A', fontSize: 14, marginTop: 5, paddingLeft: 16 },
  secAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(230,126,34,0.35)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
  },
  secAllText: { color: SAFFRON, fontSize: 13, fontWeight: '600' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  // Live
  liveGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  liveCard: {
    flex: 1, minWidth: 260, height: 260, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#1A0505',
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } as any : {}),
  },
  liveCardImg: { width: '100%', height: '100%' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, marginBottom: 8,
  },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  liveCardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 24 },
  liveCardSub: { color: GOLD, fontSize: 12, marginTop: 4 },

  // Services
  servGrid: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  servCard: {
    flex: 1, minWidth: 200,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
    borderRadius: 20, padding: 26,
    ...(Platform.OS === 'web' ? { transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 24px rgba(74,44,42,0.08)' } as any : {}),
  },
  servIcon: {
    width: 62, height: 62, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
  },
  servTitle: { color: '#4A2C2A', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  servDesc: { color: '#5A5A5A', fontSize: 13, lineHeight: 21 },
  servLink: { color: SAFFRON, fontSize: 13, fontWeight: '700', marginTop: 18 },

  // Temples
  templeCard: {
    height: 260, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1A0505',
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.5)' } as any : {}),
  },
  templeImg: { width: '100%', height: '100%', position: 'absolute' },
  templeDeity: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  templeName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  templeLoc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  templeLocText: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  templeHover: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
  },
  templeHoverText: { color: GOLD, fontSize: 11, fontWeight: '700' },

  // Poojas
  poojaCard: {
    backgroundColor: '#1C0606', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.06)' } as any : {}),
  },
  poojaImg: { width: '100%', height: 190 },
  poojaBody: {
    padding: 18,
    borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.08)',
  },
  poojaTypeBadge: (type: string) => ({
    alignSelf: 'flex-start',
    backgroundColor: type === 'homam' ? 'rgba(255,140,0,0.15)' : 'rgba(198,40,40,0.18)',
    borderWidth: 1,
    borderColor: type === 'homam' ? 'rgba(255,140,0,0.4)' : 'rgba(198,40,40,0.4)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 10,
  }),
  poojaTypeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#FFF8F0' },
  poojaName: { fontSize: 16, fontWeight: '800', color: '#F5E8D0', marginBottom: 5 },
  poojaDesc: { fontSize: 13, color: 'rgba(245,232,208,0.5)', lineHeight: 19 },
  poojaFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  poojaPrice: { fontSize: 22, fontWeight: '900', color: GOLD },
  poojaDur: { fontSize: 12, color: 'rgba(255,248,240,0.35)' },
  bookBtn: {
    marginTop: 14,
    paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(135deg, #A01818 0%, #7B1010 100%)',
      boxShadow: '0 4px 16px rgba(139,21,21,0.45)',
    } as any : { backgroundColor: '#C62828' }),
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  // Why us
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  whyCard: {
    flex: 1, minWidth: 240,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
    borderTopWidth: 3, borderTopColor: SAFFRON,
    borderRadius: 16, padding: 24,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(74,44,42,0.08)' } as any : {}),
  },
  whyIcon: {
    width: 54, height: 54, borderRadius: 15,
    backgroundColor: 'rgba(230,126,34,0.08)',
    borderWidth: 1, borderColor: 'rgba(230,126,34,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  whyTitle: { color: '#4A2C2A', fontSize: 15, fontWeight: '800', marginBottom: 6 },
  whyDesc: { color: '#5A5A5A', fontSize: 13, lineHeight: 21 },

  // Search widget
  searchCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 6,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 40px rgba(74,44,42,0.18)',
    } as any : {}),
    borderWidth: 1, borderColor: 'rgba(230,126,34,0.18)',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, minWidth: 120,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#4A2C2A', outline: 'none',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  } as any,
  searchDivider: { width: 1, height: 28, backgroundColor: 'rgba(230,126,34,0.2)' },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D35400', paddingHorizontal: 22, paddingVertical: 13,
    borderRadius: 12, margin: 4,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(211,84,0,0.35)' } as any : {}),
  },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // CTA section
  ctaSection: {
    paddingVertical: 72, paddingHorizontal: 24,
    alignItems: 'center', overflow: 'hidden',
  },
  ctaOm: {
    position: 'absolute', fontSize: 300, color: 'rgba(255,255,255,0.03)',
    fontWeight: '400',
  },
  ctaInner: { alignSelf: 'center', width: '100%', alignItems: 'center' },
  ctaTitle: { color: '#fff', fontSize: 44, fontWeight: '900', textAlign: 'center' },
  ctaSub: {
    color: 'rgba(255,255,255,0.62)', fontSize: 17, textAlign: 'center',
    marginTop: 14, lineHeight: 28, maxWidth: 600,
  },
  ctaBtns: { flexDirection: 'row', gap: 16, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' },
  ctaBtn1: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GOLD, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(212,175,55,0.5)' } as any : {}),
  },
  ctaBtn1Text: { color: '#2D0B00', fontSize: 16, fontWeight: '800' },
  ctaBtn2: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  ctaBtn2Text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  storeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 28,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  storeLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  storeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  storeBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
};

// ── Mobile Home (unchanged) ─────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

function MobileHome() {
  const router = useRouter();
  const { user } = useAuth();
  const [temples, setTemples] = useState<any[]>([]);
  const [poojas, setPoojas] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [liveIdx, setLiveIdx] = useState(0);
  const liveRef = useRef<FlatList>(null);

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
    const i = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 40));
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
    <SafeAreaView style={mob.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <LinearGradient colors={['#4A2C2A', '#B22222', '#E67E22']} style={mob.headerBg}>
          <Text style={mob.omSymbol}>ॐ</Text>
          <View style={mob.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={mob.greet}>Namaste,</Text>
              <Text style={mob.name} numberOfLines={1}>{user?.full_name}</Text>
              <View style={mob.rolePill}>
                <Ionicons name="shield-checkmark" size={10} color={theme.colors.secondary} />
                <Text style={mob.rolePillText}>{(user?.role || 'devotee').replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity testID="home-profile-btn" onPress={() => router.push('/(tabs)/profile')}>
              <View style={mob.avatar}>
                <Text style={mob.avatarText}>{(user?.full_name || 'D').charAt(0).toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={mob.headerDivider} />
          <Text style={mob.brandSm}>శ్రీ పూజా హోమం</Text>
        </LinearGradient>

        {live.length > 0 && (
          <View style={mob.liveWrap}>
            <FlatList
              ref={liveRef}
              data={live}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onLiveScroll}
              scrollEventThrottle={16}
              snapToInterval={SCREEN_W - 40}
              decelerationRate="fast"
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`home-live-${item.id}`}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/live-stream/${item.id}`)}
                  style={[mob.liveBanner, { width: SCREEN_W - 40, marginHorizontal: 0 }]}
                >
                  <Image
                    source={{ uri: 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
                    style={mob.liveBannerImg}
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={mob.liveOverlay}>
                    <View style={mob.liveBadge}>
                      <View style={mob.liveDot} />
                      <Text style={mob.liveBadgeText}>LIVE NOW</Text>
                    </View>
                    <Text style={mob.liveTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={mob.liveSub}>Tap to watch sacred rituals live →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
            {live.length > 1 && (
              <View style={mob.dots}>
                {live.map((_, i) => (
                  <View key={i} style={[mob.dot, i === liveIdx && mob.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={mob.section}>
          <Text style={mob.sectionTitle}>Browse Services</Text>
          <View style={mob.catRow}>
            <CategoryCard icon="flame" title="Homam" subtitle="Fire rituals" color="#E65100" gradColors={['#E65100', '#BF360C']} onPress={() => router.push('/(tabs)/temples')} />
            <CategoryCard icon="rose"  title="Pooja"  subtitle="Daily sevas" color="#8B1515" gradColors={['#A32A2A', '#630B0B']} onPress={() => router.push('/(tabs)/temples')} />
            <CategoryCard icon="videocam" title="Live" subtitle="Watch live" color="#D4AF37" gradColors={['#D4AF37', '#AA8721']} onPress={() => router.push('/(tabs)/live')} />
          </View>
        </View>

        <View style={mob.section}>
          <View style={mob.sectionHeader}>
            <Text style={mob.sectionTitle}>Featured Temples</Text>
            <TouchableOpacity testID="home-view-all-temples" onPress={() => router.push('/(tabs)/temples')}>
              <Text style={mob.seeAll}>See all →</Text>
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
                style={mob.templeCard}
              >
                {!!item.banner && <Image source={{ uri: item.banner }} style={mob.templeImg} />}
                <LinearGradient colors={['transparent', 'rgba(45,27,25,0.95)']} style={mob.templeOverlay}>
                  <Text style={mob.templeName} numberOfLines={1}>{item.name}</Text>
                  <View style={mob.templeMeta}>
                    <Ionicons name="location" size={12} color={theme.colors.secondary} />
                    <Text style={mob.templeLoc} numberOfLines={1}>{item.location}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={mob.section}>
          <View style={mob.sectionHeader}>
            <Text style={mob.sectionTitle}>Upcoming Poojas & Homams</Text>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {upcoming.map((p) => (
              <TouchableOpacity
                key={p.id}
                testID={`home-pooja-${p.id}`}
                activeOpacity={0.9}
                onPress={() => router.push(`/book-pooja/${p.id}`)}
                style={mob.poojaRow}
              >
                <View style={mob.poojaImgWrap}>
                  {!!p.image && <Image source={{ uri: p.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={mob.typeBadge(p.type)}>
                    <Text style={mob.typeBadgeText}>{p.type.toUpperCase()}</Text>
                  </View>
                  <Text style={mob.poojaName} numberOfLines={1}>{p.name}</Text>
                  <Text style={mob.poojaDesc} numberOfLines={1}>{p.description}</Text>
                  <View style={mob.poojaFoot}>
                    <Text style={mob.poojaPrice}>₹{p.price.toFixed(0)}</Text>
                    <Text style={mob.poojaDur}>• {p.duration}</Text>
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

function CategoryCard({ icon, title, subtitle, gradColors, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={mob.catCard} testID={`home-cat-${title.toLowerCase()}`}>
      <LinearGradient colors={gradColors} style={mob.catGrad}>
        <Ionicons name={icon} size={26} color="#fff" style={{ marginBottom: 8 }} />
        <Text style={mob.catTitle}>{title}</Text>
        <Text style={mob.catSub}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function AccomCard({ property: p, img, onPress }: { property: any; img: string | null; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{
        flex: 1, minWidth: 260,
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
        ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(74,44,42,0.12)' } as any : {}),
      } as any}
    >
      <View style={{ height: 180 }}>
        {img && !imgError ? (
          <Image
            source={{ uri: img }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <LinearGradient
            colors={['#7B1515', '#D35400']}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="bed-outline" size={48} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        )}
        <View style={{
          position: 'absolute', top: 12, left: 12,
          backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
        }}>
          <Text style={{ color: '#D35400', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
            {p.type || 'Hotel'}
          </Text>
        </View>
        {p.min_price ? (
          <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#D35400', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>₹{parseFloat(p.min_price).toFixed(0)}/night</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#4A2C2A', fontSize: 16, fontWeight: '800', marginBottom: 4 }} numberOfLines={1}>{p.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <Ionicons name="location-outline" size={13} color={SAFFRON} />
          <Text style={{ color: '#7A6A5A', fontSize: 12 }} numberOfLines={1}>{p.city || p.address}</Text>
        </View>
        {p.amenities ? (
          <Text style={{ color: '#999', fontSize: 11, marginBottom: 8 }} numberOfLines={1}>{p.amenities}</Text>
        ) : null}
        <TouchableOpacity
          onPress={onPress}
          style={{ paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#D35400' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>View Rooms</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Root export ─────────────────────────────────────────────────────────────
export default function Home() {
  const { width: W } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && W >= 768;
  return (
    <>
      <WelcomePopup />
      {isWebDesktop ? <WebHome /> : <MobileHome />}
    </>
  );
}

const mob: any = {
  container: { flex: 1, backgroundColor: theme.colors.bg },
  headerBg: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  omSymbol: { color: 'rgba(212,175,55,0.25)', fontSize: 64, position: 'absolute', right: 16, top: -4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  greet: { color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  name: { color: '#fff', fontSize: 20, marginTop: 2, fontWeight: '800' },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: 'rgba(212,175,55,0.18)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  rolePillText: { color: theme.colors.secondary, fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  headerDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.2)', marginVertical: 10 },
  brandSm: { color: theme.colors.secondary, fontSize: 14, letterSpacing: 2, fontWeight: '800' },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  avatarText: { color: theme.colors.primary, fontSize: 20, fontWeight: '800' },
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
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(230,126,34,0.25)' },
  dotActive: { width: 20, backgroundColor: '#E67E22' },
  section: { marginTop: 26 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 15, color: '#4A2C2A', paddingHorizontal: 20, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#E67E22', paddingLeft: 12, fontWeight: '700' },
  seeAll: { color: '#E67E22', fontWeight: '600', fontSize: 13 },
  catRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  catCard: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  catGrad: { padding: 16, alignItems: 'flex-start', borderRadius: 18, minHeight: 110 },
  catTitle: { fontSize: 14, color: '#fff', fontWeight: '700' },
  catSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  templeCard: { width: SCREEN_W * 0.75, height: 180, borderRadius: 20, overflow: 'hidden', backgroundColor: '#3D1515' },
  templeImg: { ...StyleSheet.absoluteFillObject },
  templeOverlay: { ...StyleSheet.absoluteFillObject, padding: 14, justifyContent: 'flex-end' },
  templeName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  templeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  templeLoc: { color: theme.colors.secondary, fontSize: 12 },
  poojaRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, padding: 10, borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
  },
  poojaImgWrap: { width: 70, height: 70, borderRadius: 14, backgroundColor: '#FFF0D0', overflow: 'hidden' },
  typeBadge: (type: string) => ({
    alignSelf: 'flex-start',
    backgroundColor: type === 'homam' ? 'rgba(255,140,0,0.15)' : 'rgba(198,40,40,0.18)',
    borderWidth: 1,
    borderColor: type === 'homam' ? 'rgba(255,140,0,0.4)' : 'rgba(198,40,40,0.4)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4,
  }),
  typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#4A2C2A' },
  poojaName: { fontSize: 14, color: '#4A2C2A', fontWeight: '700' },
  poojaDesc: { fontSize: 12, color: '#5A5A5A', marginTop: 2 },
  poojaFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  poojaPrice: { fontSize: 15, color: '#E67E22', fontWeight: '700' },
  poojaDur: { fontSize: 12, color: '#8A7A6A' },
};
