import {
  useEffect, useState, useCallback, useRef,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  RefreshControl, FlatList, Dimensions, NativeSyntheticEvent,
  NativeScrollEvent, useWindowDimensions, Linking, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const GOLD = '#D4AF37';
const MAROON = '#8B1515';
const BG = '#0D0302';

const SERVICES = [
  { title: 'Book Pooja',         desc: 'Perform sacred poojas at home or at the temple with verified pujaris.',   icon: 'flower-outline',    color: MAROON,   bg: '#FFF0F0', route: '/(tabs)/temples' },
  { title: 'Perform Homam',      desc: 'Fire rituals for prosperity, health and removal of obstacles.',            icon: 'flame-outline',     color: '#E65100', bg: '#FFF3E0', route: '/(tabs)/temples' },
  { title: 'Live Darshan',       desc: 'Watch sacred rituals streaming live from temples across India.',           icon: 'videocam-outline',  color: '#1565C0', bg: '#E3F2FD', route: '/(tabs)/live' },
  { title: 'Pujari at Home',     desc: 'Invite a qualified pujari to your home for all auspicious occasions.',    icon: 'home-outline',      color: '#2E7D32', bg: '#E8F5E9', route: '/(tabs)/temples' },
];

// ── Web Desktop Homepage ───────────────────────────────────────────────────
function WebHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { width: W } = useWindowDimensions();
  const [temples, setTemples] = useState<any[]>([]);
  const [poojas, setPoojas] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);

  const cols = W > 1280 ? 4 : W > 960 ? 3 : 2;
  const innerW = Math.min(W, 1280);

  useEffect(() => {
    Promise.all([
      api.get('/temples'),
      api.get('/poojas'),
      api.get('/live-streams').catch(() => ({ data: [] })),
    ]).then(([t, p, l]) => {
      setTemples(t.data || []);
      setPoojas(p.data || []);
      setLive(l.data || []);
    }).catch(() => {});
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} showsVerticalScrollIndicator={false}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View style={wh.hero}>
        {/* Background gradient */}
        <LinearGradient
          colors={['#4A0000', '#8B1515', '#3D0A0A', '#0D0302']}
          locations={[0, 0.3, 0.7, 1]}
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

      {/* ── LIVE DARSHAN ─────────────────────────────────────────────────── */}
      {live.length > 0 && (
        <View style={wh.sectionBg}>
          <View style={[wh.section, { maxWidth: innerW }]}>
            <SecHead title="Live Darshan" sub="Sacred rituals streaming now" onAll={() => router.push('/(tabs)/live' as any)} />
            <View style={wh.liveGrid}>
              {live.slice(0, 3).map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/live-stream/${item.id}` as any)}
                  style={wh.liveCard}
                >
                  <Image
                    source={{ uri: 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&w=600' }}
                    style={wh.liveCardImg}
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}>
                      <View style={wh.liveBadge}>
                        <View style={wh.liveDotRed} />
                        <Text style={wh.liveBadgeText}>LIVE NOW</Text>
                      </View>
                      <Text style={wh.liveCardTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={wh.liveCardSub}>Tap to watch →</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#140808' }]}>
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

      {/* ── TEMPLES GRID ─────────────────────────────────────────────────── */}
      {temples.length > 0 && (
        <View style={wh.sectionBg}>
          <View style={[wh.section, { maxWidth: innerW }]}>
            <SecHead title="Featured Temples" sub="Sacred shrines across India" onAll={() => router.push('/(tabs)/temples' as any)} />
            <View style={[wh.grid, { gap: 20 }]}>
              {temples.slice(0, cols * 2).map((t: any) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => router.push(`/temple/${t.id}` as any)}
                  style={[wh.templeCard, { width: `${Math.floor(100 / cols) - 2}%` as any }]}
                >
                  <Image source={{ uri: t.banner }} style={wh.templeImg} />
                  <LinearGradient colors={['transparent', 'rgba(45,7,7,0.97)']} style={StyleSheet.absoluteFill}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', padding: 14 }}>
                      <Text style={wh.templeDeity}>{t.deity}</Text>
                      <Text style={wh.templeName} numberOfLines={1}>{t.name}</Text>
                      <View style={wh.templeLoc}>
                        <Ionicons name="location" size={12} color={GOLD} />
                        <Text style={wh.templeLocText} numberOfLines={1}>{t.location}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                  <View style={wh.templeHover}>
                    <Text style={wh.templeHoverText}>View Poojas →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── POOJAS GRID ──────────────────────────────────────────────────── */}
      {poojas.length > 0 && (
        <View style={[wh.sectionBg, { backgroundColor: '#140808' }]}>
          <View style={[wh.section, { maxWidth: innerW }]}>
            <SecHead title="Book a Pooja or Homam" sub="Performed by verified Vedic pujaris" onAll={() => router.push('/(tabs)/temples' as any)} />
            <View style={[wh.grid, { gap: 20 }]}>
              {poojas.slice(0, cols * 2).map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/book-pooja/${p.id}` as any)}
                  style={[wh.poojaCard, { width: `${Math.floor(100 / cols) - 2}%` as any }]}
                >
                  <Image source={{ uri: p.image }} style={wh.poojaImg} />
                  <View style={wh.poojaBody}>
                    <View style={wh.poojaTypeBadge(p.type)}>
                      <Text style={wh.poojaTypeBadgeText}>{p.type?.toUpperCase()}</Text>
                    </View>
                    <Text style={wh.poojaName} numberOfLines={2}>{p.name}</Text>
                    <Text style={wh.poojaDesc} numberOfLines={2}>{p.description}</Text>
                    <View style={wh.poojaFoot}>
                      <Text style={wh.poojaPrice}>₹{p.price}</Text>
                      <Text style={wh.poojaDur}>{p.duration}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push(`/book-pooja/${p.id}` as any)}
                      style={wh.bookBtn}
                    >
                      <Text style={wh.bookBtnText}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── WHY CHOOSE US ────────────────────────────────────────────────── */}
      <View style={wh.sectionBg}>
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
        <LinearGradient colors={['#8B1515', '#4A0000']} style={StyleSheet.absoluteFill} />
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

    </ScrollView>
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
    minHeight: 520,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  heroOm: {
    position: 'absolute', right: 0, top: 0,
    fontSize: 320, color: 'rgba(212,175,55,0.06)',
    fontWeight: '400', lineHeight: 380,
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
    borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.15)', paddingTop: 28,
  },
  statItem: {
    paddingRight: 40, paddingBottom: 16,
    borderRightWidth: 1, borderRightColor: 'rgba(212,175,55,0.12)',
    marginRight: 40,
  },
  statValue: { color: GOLD, fontSize: 34, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },

  // Section helpers
  sectionBg: { paddingVertical: 56, paddingHorizontal: 24 },
  section: { alignSelf: 'center', width: '100%' },
  secHead: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  secTitle: {
    color: '#fff', fontSize: 30, fontWeight: '800',
    paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: GOLD,
  },
  secSub: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 4, paddingLeft: 14 },
  secAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
  },
  secAllText: { color: GOLD, fontSize: 13, fontWeight: '600' },

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
  servGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  servCard: {
    flex: 1, minWidth: 200, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, padding: 24,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s' } as any : {}),
  },
  servIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  servTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  servDesc: { color: 'rgba(255,255,255,0.52)', fontSize: 13, lineHeight: 20 },
  servLink: { color: GOLD, fontSize: 13, fontWeight: '700', marginTop: 16 },

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
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(0,0,0,0.15)' } as any : {}),
  },
  poojaImg: { width: '100%', height: 180 },
  poojaBody: { padding: 16 },
  poojaTypeBadge: (type: string) => ({
    alignSelf: 'flex-start',
    backgroundColor: type === 'homam' ? '#FFF3E0' : '#FFEBEE',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 8,
  }),
  poojaTypeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: MAROON },
  poojaName: { fontSize: 16, fontWeight: '800', color: '#1A0505', marginBottom: 4 },
  poojaDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  poojaFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  poojaPrice: { fontSize: 20, fontWeight: '900', color: MAROON },
  poojaDur: { fontSize: 12, color: '#888' },
  bookBtn: {
    marginTop: 12, backgroundColor: MAROON, paddingVertical: 11,
    borderRadius: 12, alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(139,21,21,0.3)' } as any : {}),
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Why us
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  whyCard: {
    flex: 1, minWidth: 240, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 22,
  },
  whyIcon: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  whyTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  whyDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 20 },

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
        <LinearGradient colors={['#5C0A0A', '#8B1515', '#630B0B']} style={mob.headerBg}>
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

// ── Root export ─────────────────────────────────────────────────────────────
export default function Home() {
  const { width: W } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && W >= 768;
  if (isWebDesktop) return <WebHome />;
  return <MobileHome />;
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
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  dotActive: { width: 20, backgroundColor: theme.colors.primary },
  section: { marginTop: 26 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 15, color: theme.colors.text, paddingHorizontal: 20, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: theme.colors.secondary, paddingLeft: 12, fontWeight: '700' },
  seeAll: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
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
    borderRadius: 18, padding: 10, borderWidth: 1, borderColor: theme.colors.border,
  },
  poojaImgWrap: { width: 70, height: 70, borderRadius: 14, backgroundColor: '#F5E6D0', overflow: 'hidden' },
  typeBadge: (type: string) => ({
    alignSelf: 'flex-start',
    backgroundColor: type === 'homam' ? '#FFF3E0' : '#FFEBEE',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4,
  }),
  typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: theme.colors.primary },
  poojaName: { fontSize: 14, color: theme.colors.text, fontWeight: '700' },
  poojaDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  poojaFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  poojaPrice: { fontSize: 15, color: theme.colors.primary, fontWeight: '700' },
  poojaDur: { fontSize: 12, color: theme.colors.textMuted },
};
