import React, {
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import WebFooter from '../../src/components/WebFooter';
import WelcomePopup from '../../src/components/WelcomePopup';

const GOLD    = '#C9922A';
const SAFFRON = '#8B3520';   // warm amber-brown (was blood-red #B22222)
const BG      = '#FFFFFF';
const IS_WEB  = Platform.OS === 'web';

function parseImages(s: string | null | undefined): string[] {
  if (!s) return [];
  if (s.includes('|||')) return s.split('|||').map(v => v.trim()).filter(Boolean);
  if (s.startsWith('data:')) return [s.trim()];
  return s.split(',').map(v => v.trim()).filter(Boolean);
}

// Image that gracefully falls back if the URL is missing or fails to load.
function SmartImage({
  uri, style, resizeMode = 'cover', fallback,
}: { uri?: string | null; style?: any; resizeMode?: any; fallback?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <View style={[style, { backgroundColor: '#EFE3D0', alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="image-outline" size={26} color={GOLD} />
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
}

const DESTINATIONS = [
  { name: 'Tirupati', state: 'Andhra Pradesh', color: '#7A3020', route: '/destinations?state=andhra-pradesh' },
  { name: 'Varanasi', state: 'Uttar Pradesh', color: '#C9922A', route: '/destinations?state=uttar-pradesh' },
  { name: 'Rishikesh', state: 'Uttarakhand', color: '#A67A1E', route: '/destinations?state=uttarakhand' },
  { name: 'Shirdi', state: 'Maharashtra', color: '#9A4130', route: '/destinations?state=maharashtra' },
  { name: 'Madurai', state: 'Tamil Nadu', color: '#8B3520', route: '/destinations?state=tamil-nadu' },
  { name: 'Udupi', state: 'Karnataka', color: '#7A3020', route: '/destinations?state=karnataka' },
  { name: 'Dwarka', state: 'Gujarat', color: '#C9922A', route: '/destinations?state=gujarat' },
  { name: 'Guruvayur', state: 'Kerala', color: '#A67A1E', route: '/destinations?state=kerala' },
];

const FESTIVALS = [
  { name: 'Guru Purnima', date: 'Jul 21, 2025', desc: 'Day of spiritual teachers', color: '#7A3020' },
  { name: 'Varalakshmi Vratham', date: 'Aug 8, 2025', desc: 'Goddess Lakshmi festival', color: '#9A4130' },
  { name: 'Ganesh Chaturthi', date: 'Aug 27, 2025', desc: "Lord Ganesha's birthday", color: '#C9922A' },
  { name: 'Navratri Begins', date: 'Oct 2, 2025', desc: 'Nine nights of goddess worship', color: '#8B3520' },
  { name: 'Diwali', date: 'Oct 20, 2025', desc: 'Festival of lights', color: '#C9922A' },
  { name: 'Karthika Masam', date: 'Nov 1, 2025', desc: 'Holy month of Lord Shiva', color: '#A67A1E' },
];

const SERVICES = [
  { title: 'Book Pooja',    desc: 'Perform sacred poojas at home or at the temple with verified Vedic pujaris.', icon: 'flower-outline',   route: '/(tabs)/temples' },
  { title: 'Perform Homam', desc: 'Sacred fire rituals for prosperity, health and removal of obstacles.',         icon: 'flame-outline',    route: '/(tabs)/temples' },
  { title: 'Live Darshan',  desc: 'Watch sacred rituals streaming live from temples across India.',               icon: 'videocam-outline', route: '/(tabs)/live' },
  { title: 'Pujari at Home',desc: 'Invite a qualified pujari to your home for all auspicious occasions.',        icon: 'home-outline',     route: '/(tabs)/temples' },
];

// ── Destinations Auto-Slideshow ───────────────────────────────────────────
function DestinationsCarousel({ items, innerW }: { items: any[]; innerW: number }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const VISIBLE = innerW >= 1100 ? 5 : innerW >= 800 ? 4 : innerW >= 600 ? 3 : 2;
  const GAP = 14;
  const cardW = Math.floor((innerW - GAP * (VISIBLE - 1)) / VISIBLE);
  const cardH = Math.round(cardW * 0.72);
  const step = cardW + GAP;
  const maxIdx = Math.max(0, items.length - VISIBLE);

  const goTo = useCallback((next: number) => {
    const n = ((next % (maxIdx + 1)) + (maxIdx + 1)) % (maxIdx + 1);
    setIdx(n);
    Animated.timing(anim, { toValue: -n * step, duration: 650, useNativeDriver: false }).start();
  }, [maxIdx, step, anim]);

  useEffect(() => {
    if (items.length <= VISIBLE) return;
    const t = setInterval(() => goTo(idx + 1), 3200);
    return () => clearInterval(t);
  }, [idx, items.length, VISIBLE, goTo]);

  if (items.length === 0) return null;

  const arrowStyle: any = {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(122,48,32,0.18)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(0,0,0,0.12)', cursor: 'pointer' } : {}),
  };

  return (
    <View>
      <View style={{ overflow: 'hidden' } as any}>
        <Animated.View style={{ flexDirection: 'row', gap: GAP, transform: [{ translateX: anim }], width: (cardW + GAP) * items.length }}>
          {items.map((d: any, i: number) => (
            <TouchableOpacity
              key={d.name + i}
              onPress={() => router.push(d.route as any)}
              activeOpacity={0.88}
              style={{ width: cardW, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff',
                borderWidth: 1, borderColor: 'rgba(122,48,32,0.08)',
                ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0,0,0,0.10)' } as any : {}) } as any}
            >
              {d.photo ? (
                <View style={{ height: cardH }}>
                  <SmartImage
                    uri={d.photo}
                    style={{ width: '100%', height: cardH }}
                    fallback={
                      <LinearGradient
                        colors={[d.color + '28', d.color + '0A']}
                        style={{ height: cardH, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: d.color + '20',
                          borderWidth: 2, borderColor: d.color + '50', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="location" size={22} color={d.color} />
                        </View>
                      </LinearGradient>
                    }
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.78)']}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingVertical: 12 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{d.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{d.state}</Text>
                  </LinearGradient>
                </View>
              ) : (
                <LinearGradient
                  colors={[d.color + '28', d.color + '0A']}
                  style={{ height: cardH, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 12 }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: d.color + '20',
                    borderWidth: 2, borderColor: d.color + '50', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="location" size={22} color={d.color} />
                  </View>
                  <Text style={{ color: '#1A0505', fontSize: 15, fontWeight: '800', textAlign: 'center' }}>{d.name}</Text>
                  <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>{d.state}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
        <TouchableOpacity onPress={() => goTo(idx - 1)} style={arrowStyle}>
          <Ionicons name="chevron-back" size={18} color={SAFFRON} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: maxIdx + 1 }).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={{
                width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
                backgroundColor: i === idx ? SAFFRON : 'rgba(122,48,32,0.2)',
              }} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => goTo(idx + 1)} style={arrowStyle}>
          <Ionicons name="chevron-forward" size={18} color={SAFFRON} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Temple Multi-Card Carousel (4 visible, auto-scroll) ──────────────────
const ssArrow = {
  width: 44, height: 44, borderRadius: 22,
  backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' as const,
  justifyContent: 'center' as const, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.4)' } : {}),
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
                <View style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === idx ? GOLD : 'rgba(255,255,255,0.25)' }} />
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
                borderWidth: 1, borderColor: 'rgba(139,21,21,0.12)',
                ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(0,0,0,0.1)' } : {}),
              } as any}
            >
              {/* Image */}
              <View style={{ height: 210, position: 'relative', backgroundColor: '#F5E8E0' }}>
                {!!p.image && <Image source={{ uri: p.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
              </View>
              {/* Card body */}
              <View style={{ padding: 18, borderTopWidth: 1, borderTopColor: 'rgba(139,21,21,0.08)' }}>
                <View style={{
                  alignSelf: 'flex-start', marginBottom: 10,
                  backgroundColor: p.type === 'homam' ? 'rgba(139,21,21,0.08)' : 'rgba(178,34,34,0.1)',
                  borderWidth: 1,
                  borderColor: p.type === 'homam' ? 'rgba(139,21,21,0.35)' : 'rgba(178,34,34,0.35)',
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#1A0505' }}>
                    {p.type?.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ color: '#1A0505', fontSize: 16, fontWeight: '800', marginBottom: 6, lineHeight: 22 }} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={{ color: '#555555', fontSize: 12, lineHeight: 18, marginBottom: 14 }} numberOfLines={2}>
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
                    backgroundColor: '#8B3520',
                    ...(Platform.OS === 'web' ? {
                      boxShadow: '0 4px 16px rgba(139,53,32,0.4)',
                    } : {}),
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
                <View style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === idx ? GOLD : 'rgba(255,255,255,0.25)' }} />
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

// ── Live Darshan Grid — Hotstar-style hover popup ─────────────────────────
function LiveGrid({ items, innerW }: { items: any[]; innerW: number }) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const COLS   = Math.min(3, items.length);
  const GAP    = 16;
  const cardW  = Math.floor((innerW - GAP * (COLS - 1)) / COLS);
  const cardH  = Math.floor(cardW * 9 / 16);
  const pageW  = innerW;
  const maxIdx = Math.max(0, items.length - COLS);

  const goTo = useCallback((next: number) => {
    const n = Math.max(0, Math.min(next, maxIdx));
    setIdx(n);
    Animated.timing(anim, { toValue: -n * (cardW + GAP), duration: 550, useNativeDriver: false }).start();
  }, [maxIdx, cardW, GAP, anim]);

  useEffect(() => {
    if (items.length <= COLS) return;
    const t = setInterval(() => goTo(idx < maxIdx ? idx + 1 : 0), 4000);
    return () => clearInterval(t);
  }, [idx, items.length, COLS, maxIdx, goTo]);

  if (items.length === 0) return null;

  const FALLBACK = 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <View>
      {/* Scrolling row */}
      <View style={{ overflow: 'hidden' } as any}>
        <Animated.View style={{ flexDirection: 'row', gap: GAP, transform: [{ translateX: anim }], width: (cardW + GAP) * items.length }}>
          {items.map((item: any) => {
            const hov = hoveredId === item.id;
            return (
              <View
                key={item.id}
                style={{ width: cardW, position: 'relative', zIndex: hov ? 50 : 1 } as any}
                {...(IS_WEB ? {
                  onMouseEnter: () => setHoveredId(item.id),
                  onMouseLeave: () => setHoveredId(null),
                } : {})}
              >
                {/* Thumbnail */}
                <TouchableOpacity
                  onPress={() => router.push(`/live-stream/${item.id}` as any)}
                  activeOpacity={0.88}
                  style={{
                    height: cardH, borderRadius: 14, overflow: 'hidden',
                    borderWidth: 2, borderColor: hov ? GOLD : 'transparent',
                    ...(IS_WEB && hov ? { boxShadow: '0 0 0 2px rgba(201,146,42,0.4), 0 16px 40px rgba(0,0,0,0.8)' } : {}),
                  } as any}
                >
                  <Image source={{ uri: item.thumbnail || FALLBACK }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  {/* Strong gradient at bottom for text readability */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.88)']}
                    locations={[0.35, 0.6, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* LIVE badge — top left */}
                  <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>LIVE NOW</Text>
                  </View>
                  {/* Title overlaid at bottom of image */}
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 18 }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={{ color: GOLD, fontSize: 11, fontWeight: '600', marginTop: 4 }}>Tap to watch →</Text>
                  </View>
                </TouchableOpacity>

                {/* ── Hotstar-style hover popup ── */}
                {hov && IS_WEB && (
                  <View style={{
                    position: 'absolute', top: cardH + 2, left: -10, right: -10,
                    backgroundColor: '#1C0606', borderRadius: 14, padding: 16, zIndex: 60,
                    borderWidth: 1, borderColor: 'rgba(201,146,42,0.22)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
                  } as any}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 12 }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push(`/live-stream/${item.id}` as any)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start', marginBottom: 10 }}
                    >
                      <Ionicons name="play" size={13} color="#1C0606" />
                      <Text style={{ color: '#1C0606', fontWeight: '800', fontSize: 13 }}>Watch Live</Text>
                    </TouchableOpacity>
                    {!!item.description && (
                      <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Arrow + dots */}
      {items.length > COLS && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 24 }}>
          <TouchableOpacity onPress={() => goTo(idx - 1)} style={ssArrow}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <View style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === idx ? GOLD : 'rgba(255,255,255,0.25)' }} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => goTo(idx + 1)} style={ssArrow}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
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
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [destinations, setDestinations] = useState<any[]>(DESTINATIONS);
  const [settings, setSettings] = useState<any>({});
  const today = new Date().toISOString().split('T')[0];

  const guestSummary = `${rooms} Room${rooms > 1 ? 's' : ''}, ${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}`;

  const innerW = Math.min(W, 1280);

  useEffect(() => {
    const empty = { data: [] };
    Promise.all([
      api.get('/temples').catch(() => empty),
      api.get('/poojas').catch(() => empty),
      api.get('/live-streams').catch(() => empty),
      api.get('/properties').catch(() => empty),
    ]).then(([t, p, l, pr]) => {
      setTemples(Array.isArray(t.data) ? t.data : []);
      setPoojas(Array.isArray(p.data) ? p.data : []);
      setLive(Array.isArray(l.data) ? l.data : []);
      setProperties(Array.isArray(pr.data) ? pr.data.filter((x: any) => x.is_active !== false) : []);
    });
  }, []);

  // Load platform settings (CMS) from cache → then from backend
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem('sph_platform_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(parsed || {});
          if (Array.isArray(parsed.destinations) && parsed.destinations.length > 0)
            setDestinations(parsed.destinations);
        }
      } catch {}
      try {
        const { data } = await api.get('/platform-settings');
        if (data && typeof data === 'object') {
          setSettings(data);
          if (Array.isArray(data.destinations) && data.destinations.length > 0)
            setDestinations(data.destinations);
          await AsyncStorage.setItem('sph_platform_settings', JSON.stringify(data));
        }
      } catch {}
    })();
  }, []);

  // ── CMS-driven content with safe fallbacks ──────────────────────────────
  const heroTitle = settings.heroTitle || 'Sri Pooja Homam';
  const heroTelugu = settings.heroTelugu || 'శ్రీ పూజా హోమం';
  const heroSub = settings.heroSubtitle || settings.heroDesc
    ? `${settings.heroSubtitle || 'Book sacred poojas and homams with verified pujaris.'}\n${settings.heroDesc || 'Experience the grace of ancient Vedic rituals from your home.'}`
    : 'Book sacred poojas and homams with verified pujaris.\nExperience the grace of ancient Vedic rituals from your home.';
  const cta1Text = settings.cta1Text || 'Book a Pooja Now';
  const cta2Text = settings.cta2Text || 'Watch Live Darshan';
  const services = Array.isArray(settings.services) && settings.services.length > 0
    ? settings.services.map((s: any) => ({ ...s, route: s.route || '/(tabs)/temples' }))
    : SERVICES;
  const stats = Array.isArray(settings.stats) && settings.stats.length === 4
    ? settings.stats
    : [
        { v: '500+', l: 'Temples' },
        { v: '1000+', l: 'Poojas & Homams' },
        { v: '24/7', l: 'Live Darshan' },
        { v: '10,000+', l: 'Devotees Served' },
      ];

  return (
    <View style={[
      { backgroundColor: BG },
      Platform.OS === 'web' ? { flex: 1, overflowY: 'auto' } as any : {},
    ]}>
      {/* Styles: date fix + hero image animations */}
      {React.createElement('style', { key: 'sph-styles' }, `
        input.sph-date { position: relative; }
        input.sph-date::-webkit-calendar-picker-indicator {
          position: absolute; left: 0; top: 0;
          width: 100%; height: 100%;
          opacity: 0; cursor: pointer;
        }
        input.sph-date::-webkit-inner-spin-button,
        input.sph-date::-webkit-clear-button { display: none; }

        @keyframes sph-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        @keyframes sph-float2 {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50%       { transform: translateY(-10px) rotate(4deg); }
        }
        .sph-img1 {
          width: 100%; max-height: 440px;
          object-fit: contain; object-position: right bottom; display: block;
          filter: drop-shadow(0 20px 48px rgba(0,0,0,0.55));
          animation: sph-float 4.5s ease-in-out infinite;
        }
        .sph-img2 {
          width: 130px; height: 130px;
          object-fit: contain; display: block;
          filter: drop-shadow(0 8px 20px rgba(0,0,0,0.45));
          animation: sph-float2 3.2s ease-in-out infinite 0.6s;
        }
      `)}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View style={wh.hero}>
        {/* Background gradient */}
        <LinearGradient
          colors={['#3D1408', '#5C1F0A', '#8B3520', '#C9922A']}
          locations={[0, 0.3, 0.65, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Radial glow center */}
        {IS_WEB && (
          <View style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(ellipse 60% 70% at 65% 50%, rgba(201,146,42,0.28) 0%, transparent 70%)',
          } as any} />
        )}
        {/* Decorative OM — faint background */}
        <Text style={wh.heroOm}>ॐ</Text>

        {/* Two-column layout for desktop web */}
        {IS_WEB && W >= 768 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: innerW, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 60, zIndex: 2 }}>

            {/* LEFT — text */}
            <View style={{ flex: 1, paddingRight: 32 }}>
              <View style={wh.heroBadge}>
                <View style={wh.heroBadgeDot} />
                <Text style={wh.heroBadgeText}>DIVINE DEVOTION AT YOUR FINGERTIPS</Text>
              </View>
              <Text style={wh.heroTitle}>{heroTitle}</Text>
              <Text style={wh.heroTelugu}>{heroTelugu}</Text>
              <Text style={wh.heroSub}>{heroSub}</Text>
              <View style={wh.heroBtns}>
                <TouchableOpacity
                  onPress={() => user ? router.push('/(tabs)/temples' as any) : router.push('/(auth)/login' as any)}
                  style={wh.heroBtn1}
                >
                  <Text style={wh.heroBtn1Text}>{cta1Text}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#2D0B00" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/live' as any)}
                  style={wh.heroBtn2}
                >
                  <View style={wh.liveDotRed} />
                  <Text style={wh.heroBtn2Text}>{cta2Text}</Text>
                </TouchableOpacity>
              </View>
              {/* Stats */}
              <View style={[wh.statsBar, { marginTop: 36 }]}>
                {stats.map((s: any, i: number) => (
                  <View key={i} style={[wh.statItem, i === stats.length - 1 && wh.statItemLast]}>
                    <Text style={wh.statValue}>{s.v}</Text>
                    <Text style={wh.statLabel}>{s.l}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* RIGHT — HTML img elements (guaranteed to load on web) */}
            {React.createElement('div', {
              style: {
                position: 'relative',
                width: Math.min(500, W * 0.44),
                display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                flexShrink: 0,
              }
            },
              /* Pujari performing homam — main */
              React.createElement('img', { src: '/img/img1.png', className: 'sph-img1', alt: 'Pujari' }),
              /* Kalash — bottom-left accent */
              React.createElement('div', {
                style: { position: 'absolute', bottom: 0, left: -10 }
              },
                React.createElement('img', { src: '/img/img2.png', className: 'sph-img2', alt: 'Kalash' })
              )
            )}

          </View>
        ) : (
          /* Mobile / narrow layout — centered */
          <View style={[wh.heroInner, { maxWidth: innerW, zIndex: 2 }]}>
            <View style={wh.heroBadge}>
              <View style={wh.heroBadgeDot} />
              <Text style={wh.heroBadgeText}>DIVINE DEVOTION AT YOUR FINGERTIPS</Text>
            </View>
            <Text style={wh.heroTitle}>{heroTitle}</Text>
            <Text style={wh.heroTelugu}>{heroTelugu}</Text>
            <Text style={wh.heroSub}>{heroSub}</Text>
            <View style={wh.heroBtns}>
              <TouchableOpacity
                onPress={() => user ? router.push('/(tabs)/temples' as any) : router.push('/(auth)/login' as any)}
                style={wh.heroBtn1}
              >
                <Text style={wh.heroBtn1Text}>{cta1Text}</Text>
                <Ionicons name="arrow-forward" size={16} color="#2D0B00" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/live' as any)}
                style={wh.heroBtn2}
              >
                <View style={wh.liveDotRed} />
                <Text style={wh.heroBtn2Text}>{cta2Text}</Text>
              </TouchableOpacity>
            </View>
            <View style={wh.statsBar}>
              {stats.map((s: any, i: number) => (
                <View key={i} style={[wh.statItem, i === stats.length - 1 && wh.statItemLast]}>
                  <Text style={wh.statValue}>{s.v}</Text>
                  <Text style={wh.statLabel}>{s.l}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ── SMART SEARCH ─────────────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FFFFFF', paddingTop: 0, paddingBottom: 24, overflow: 'visible' as any, zIndex: 90 }]}>
        <View style={{
          maxWidth: innerW, alignSelf: 'center', width: '100%',
          paddingHorizontal: 24, marginTop: -48,
          overflow: 'visible' as any, zIndex: 95,
        } as any}>
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
                {IS_WEB ? React.createElement('input', {
                  type: 'date',
                  className: 'sph-date',
                  value: checkIn,
                  min: today,
                  onChange: (e: any) => setCheckIn(e.target.value),
                  style: {
                    flex: 1, fontSize: 14, border: 'none', outline: 'none',
                    backgroundColor: 'transparent', cursor: 'pointer',
                    color: checkIn ? '#1A0505' : '#9CA3AF', fontFamily: 'inherit',
                  },
                }) : (
                  <TextInput
                    style={wh.searchInput}
                    placeholder="Check-in Date"
                    placeholderTextColor="#aaa"
                    value={checkIn}
                    onChangeText={setCheckIn}
                  />
                )}
              </View>
              <View style={wh.searchDivider} />
              <View style={wh.searchField}>
                <Ionicons name="calendar-outline" size={18} color={SAFFRON} />
                {IS_WEB ? React.createElement('input', {
                  type: 'date',
                  className: 'sph-date',
                  value: checkOut,
                  min: checkIn || today,
                  onChange: (e: any) => setCheckOut(e.target.value),
                  style: {
                    flex: 1, fontSize: 14, border: 'none', outline: 'none',
                    backgroundColor: 'transparent', cursor: 'pointer',
                    color: checkOut ? '#1A0505' : '#9CA3AF', fontFamily: 'inherit',
                  },
                }) : (
                  <TextInput
                    style={wh.searchInput}
                    placeholder="Check-out Date"
                    placeholderTextColor="#aaa"
                    value={checkOut}
                    onChangeText={setCheckOut}
                  />
                )}
              </View>
              <View style={wh.searchDivider} />
              {/* ── Guests dropdown trigger ─────────────────────────── */}
              <View style={{ position: 'relative', zIndex: 200 } as any}>
                <TouchableOpacity
                  style={[wh.searchField, { minWidth: 200, gap: 8 }]}
                  onPress={() => setShowGuestPicker(!showGuestPicker)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="people-outline" size={18} color={SAFFRON} />
                  <Text style={{ flex: 1, fontSize: 14, color: '#1A0505' }} numberOfLines={1}>{guestSummary}</Text>
                  <Ionicons name={showGuestPicker ? 'chevron-up' : 'chevron-down'} size={14} color="#999" />
                </TouchableOpacity>

                {showGuestPicker && (
                  <>
                    {/* Backdrop */}
                    <TouchableOpacity
                      style={{ position: 'fixed', inset: 0, zIndex: 199 } as any}
                      onPress={() => setShowGuestPicker(false)}
                      activeOpacity={1}
                    />
                    {/* Popup card */}
                    <View style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 8,
                      backgroundColor: '#fff', borderRadius: 18, padding: 24,
                      zIndex: 300, minWidth: 310,
                      borderWidth: 1, borderColor: 'rgba(139,21,21,0.1)',
                      ...(IS_WEB ? { boxShadow: '0 8px 40px rgba(0,0,0,0.18)' } : {}),
                    } as any}>
                      {[
                        { label: 'Rooms',    sub: '',              val: rooms,    set: setRooms,    min: 1, max: 10 },
                        { label: 'Adults',   sub: '12+ years',     val: adults,   set: setAdults,   min: 1, max: 20 },
                        { label: 'Children', sub: '0 – 11 years',  val: children, set: setChildren, min: 0, max: 10 },
                      ].map((row, i, arr) => (
                        <View key={row.label} style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          paddingVertical: 14,
                          borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                          borderBottomColor: '#F3F4F6',
                        }}>
                          <View>
                            <Text style={{ color: '#0D1220', fontSize: 15, fontWeight: '700' }}>{row.label}</Text>
                            {!!row.sub && <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>{row.sub}</Text>}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <TouchableOpacity
                              onPress={() => row.set(Math.max(row.min, row.val - 1))}
                              disabled={row.val <= row.min}
                              style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', borderColor: row.val <= row.min ? '#E5E7EB' : 'rgba(139,21,21,0.4)' }}
                            >
                              <Text style={{ fontSize: 20, lineHeight: 22, fontWeight: '700', color: row.val <= row.min ? '#D1D5DB' : SAFFRON }}>−</Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0D1220', minWidth: 22, textAlign: 'center' }}>{row.val}</Text>
                            <TouchableOpacity
                              onPress={() => row.set(Math.min(row.max, row.val + 1))}
                              disabled={row.val >= row.max}
                              style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', borderColor: row.val >= row.max ? '#E5E7EB' : 'rgba(139,21,21,0.4)' }}
                            >
                              <Text style={{ fontSize: 20, lineHeight: 22, fontWeight: '700', color: row.val >= row.max ? '#D1D5DB' : SAFFRON }}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={() => setShowGuestPicker(false)}
                        style={{ backgroundColor: SAFFRON, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
              <TouchableOpacity
                style={wh.searchBtn}
                onPress={() => {
                  const params = new URLSearchParams();
                  if (searchDest) params.set('dest', searchDest);
                  if (searchTemple) params.set('temple', searchTemple);
                  if (checkIn) params.set('checkIn', checkIn);
                  if (checkOut) params.set('checkOut', checkOut);
                  params.set('rooms', String(rooms));
                  params.set('adults', String(adults));
                  if (children > 0) params.set('children', String(children));
                  const qs = params.toString();
                  router.push(('/accommodation' + (qs ? '?' + qs : '')) as any);
                }}
              >
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={wh.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── LIVE DARSHAN ─────────────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#2A1208' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title={settings.secLiveTitle || "Live Darshan"} sub={settings.secLiveSub || "Sacred rituals streaming now"} onAll={() => router.push('/(tabs)/live' as any)} dark />
          {live.length > 0 ? (
            <LiveGrid items={live} innerW={Math.min(W, 1280) - 96} />
          ) : (
            /* Placeholder when no live streams active */
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/live' as any)}
              activeOpacity={0.88}
              style={{ borderRadius: 20, overflow: 'hidden', ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.5)' } : {}) } as any}
            >
              <LinearGradient colors={['#5A2010', '#2A1208']} style={{ padding: 48, alignItems: 'center', gap: 16 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(229,57,53,0.15)', borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="radio-outline" size={34} color="#EF9A9A" />
                </View>
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>No Active Streams</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 420 }}>
                    Our pujaris will go live soon. Tap to see past streams and devotional reels.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(229,57,53,0.2)', borderWidth: 1, borderColor: 'rgba(229,57,53,0.45)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF5350' }} />
                  <Text style={{ color: '#EF9A9A', fontWeight: '700', fontSize: 14 }}>Watch Past Darshans & Reels</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── POPULAR DESTINATIONS ─────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FFFFFF' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title={settings.secDestTitle || "Popular Destinations"} sub={settings.secDestSub || "Sacred pilgrimage cities across India"} onAll={() => router.push('/destinations' as any)} />
          <DestinationsCarousel items={destinations} innerW={innerW} />
        </View>
      </View>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#F2F0EF' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          {/* Centered header with gold overline — aatreyanews.in style */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 10 }}>{settings.secPlatTitle || 'PLATFORM FEATURES'}</Text>
            <Text style={{ color: '#0D1220', fontSize: 32, fontWeight: '900', textAlign: 'center' }}>{settings.secPlatSub || 'Everything for Your Spiritual Journey'}</Text>
            <Text style={{ color: '#6B7280', fontSize: 15, textAlign: 'center', marginTop: 8, maxWidth: 500 }}>
              {settings.secPlatDesc || 'One platform. Every sacred service your devotion needs.'}
            </Text>
          </View>
          <View style={wh.servGrid}>
            {services.map((s: any) => (
              <TouchableOpacity key={s.title} onPress={() => router.push(s.route as any)} style={wh.servCard}>
                {/* Dark square icon box — aatreyanews.in style */}
                <View style={wh.servIcon}>
                  <Ionicons name={s.icon as any} size={28} color={GOLD} />
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
        <View style={{ paddingTop: 56, paddingBottom: 56, backgroundColor: '#3D1A0A' }}>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%', marginBottom: 28 }}>
            <SecHead title={settings.secTemplesTitle || "Featured Temples"} sub={settings.secTemplesSub || "Sacred shrines across India"} onAll={() => router.push('/(tabs)/temples' as any)} dark />
          </View>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%' }}>
            <TempleMultiCarousel temples={temples} innerW={Math.min(W, 1280) - 96} />
          </View>
        </View>
      )}

      {/* ── FEATURED ACCOMMODATIONS ──────────────────────────────────────── */}
      {properties.length > 0 && (
        <View style={[wh.sectionBg, { backgroundColor: '#FFFFFF' }]}>
          <View style={[wh.section, { maxWidth: innerW }]}>
            <SecHead title={settings.secAccTitle || "Featured Accommodations"} sub={settings.secAccSub || "Hotels & dharamshalas near sacred temples"} onAll={() => router.push('/accommodation' as any)} />
            <AccomCarousel properties={properties} innerW={Math.min(innerW, 1280) - 96} />
          </View>
        </View>
      )}

      {/* ── POOJAS CAROUSEL ──────────────────────────────────────────────── */}
      {poojas.length > 0 && (
        <View style={{ paddingTop: 56, paddingBottom: 56, backgroundColor: '#2A1208' }}>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%', marginBottom: 28 }}>
            <SecHead title={settings.secPoojasTitle || "Book a Pooja or Homam"} sub={settings.secPoojasSub || "Performed by verified Vedic pujaris"} onAll={() => router.push('/(tabs)/temples' as any)} dark />
          </View>
          <View style={{ paddingHorizontal: 48, maxWidth: innerW, alignSelf: 'center', width: '100%' }}>
            <PoojaCarousel poojas={poojas} innerW={Math.min(W, 1280) - 96} />
          </View>
        </View>
      )}

      {/* ── FESTIVAL HIGHLIGHTS ──────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#F7F4F1' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title={settings.secFestTitle || "Festival Highlights"} sub={settings.secFestSub || "Upcoming sacred festivals & celebrations"} onAll={() => router.push('/(tabs)/calendar' as any)} />
          <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
            {FESTIVALS.map((f) => (
              <View
                key={f.name}
                style={{
                  flex: 1, minWidth: 220,
                  backgroundColor: '#fff', borderRadius: 16, padding: 18,
                  borderLeftWidth: 4, borderLeftColor: f.color,
                  borderWidth: 1, borderColor: 'rgba(139,21,21,0.08)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 18px rgba(0,0,0,0.07)' } as any : {}),
                } as any}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: f.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="calendar" size={18} color={f.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: f.color, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{f.date}</Text>
                    <Text style={{ color: '#1A0505', fontSize: 14, fontWeight: '800', marginTop: 1 }}>{f.name}</Text>
                  </View>
                </View>
                <Text style={{ color: '#555555', fontSize: 12, lineHeight: 18 }}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── ACCOMMODATION TEASER ─────────────────────────────────────────── */}
      <View style={[wh.sectionBg, { backgroundColor: '#FFFFFF' }]}>
        <View style={[wh.section, { maxWidth: innerW }]}>
          <SecHead title="Temple Accommodation" sub="Stay near the divine — hotels & dharamshalas near temples" />
          <View style={{
            borderRadius: 24, overflow: 'hidden', position: 'relative',
            ...(Platform.OS === 'web' ? { boxShadow: '0 8px 40px rgba(0,0,0,0.15)' } as any : {}),
          } as any}>
            <LinearGradient
              colors={['#120805', '#3D1A0A', '#7A3020', '#C9922A']}
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
      <View style={[wh.sectionBg, { backgroundColor: '#F7F4F1' }]}>
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
        <LinearGradient colors={['#C4722A', '#7A3020', '#2A0F07']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
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
function SecHead({ title, sub, onAll, dark }: { title: string; sub: string; onAll?: () => void; dark?: boolean }) {
  return (
    <View style={wh.secHead}>
      <View>
        <Text style={[wh.secTitle, dark && { color: '#FFFFFF', borderLeftColor: GOLD }]}>{title}</Text>
        <Text style={[wh.secSub, dark && { color: 'rgba(255,255,255,0.55)' }]}>{sub}</Text>
      </View>
      {onAll && (
        <TouchableOpacity onPress={onAll} style={[wh.secAllBtn, dark && { borderColor: 'rgba(201,146,42,0.4)' }]}>
          <Text style={[wh.secAllText, dark && { color: GOLD }]}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color={dark ? GOLD : SAFFRON} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Web home styles ─────────────────────────────────────────────────────────
const wh: any = {
  // Hero
  hero: {
    minHeight: '82vh',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOm: {
    position: 'absolute', left: '30%', top: '5%',
    fontSize: 320, color: 'rgba(0,0,0,0.08)',
    fontWeight: '400', lineHeight: 360, zIndex: 1,
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
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(201,146,42,0.45)' } as any : {}),
  },
  heroBtn1Text: { color: '#1A0505', fontSize: 16, fontWeight: '800' },
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
    flexGrow: 1, flexBasis: 120, minWidth: 120,
    paddingRight: 24, paddingBottom: 16,
    borderRightWidth: 1, borderRightColor: 'rgba(212,175,55,0.15)',
  },
  statItemLast: { borderRightWidth: 0 },
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
    color: '#1A0505', fontSize: 32, fontWeight: '900',
    paddingLeft: 16, borderLeftWidth: 4, borderLeftColor: SAFFRON,
  },
  secSub: { color: '#666666', fontSize: 14, marginTop: 5, paddingLeft: 16 },
  secAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(139,21,21,0.3)',
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
    borderWidth: 1, borderColor: 'rgba(139,21,21,0.1)',
    borderRadius: 20, padding: 26,
    ...(Platform.OS === 'web' ? { transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' } as any : {}),
  },
  servIcon: {
    width: 58, height: 58, borderRadius: 16,
    backgroundColor: '#1A0505',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  servTitle: { color: '#1A0505', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  servDesc: { color: '#555555', fontSize: 13, lineHeight: 21 },
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
    backgroundColor: '#8B3520',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 16px rgba(139,21,21,0.45)',
    } as any : {}),
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  // Why us
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  whyCard: {
    flex: 1, minWidth: 240,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(139,21,21,0.1)',
    borderTopWidth: 3, borderTopColor: SAFFRON,
    borderRadius: 16, padding: 24,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0,0,0,0.07)' } as any : {}),
  },
  whyIcon: {
    width: 54, height: 54, borderRadius: 15,
    backgroundColor: '#1A0505',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  whyTitle: { color: '#1A0505', fontSize: 15, fontWeight: '800', marginBottom: 6 },
  whyDesc: { color: '#555555', fontSize: 13, lineHeight: 21 },

  // Search widget
  searchCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 6,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
      overflow: 'visible',
    } as any : {}),
    borderWidth: 1, borderColor: 'rgba(139,21,21,0.12)',
    zIndex: 100,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', overflow: 'visible' as any },
  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, minWidth: 120,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#1A0505', outline: 'none',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  } as any,
  searchDivider: { width: 1, height: 28, backgroundColor: 'rgba(139,21,21,0.12)' },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#7A3020', paddingHorizontal: 22, paddingVertical: 13,
    borderRadius: 12, margin: 4,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(139,21,21,0.4)' } as any : {}),
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
        <LinearGradient colors={['#120805', '#3D1A0A', '#7A3020', '#C9922A']} style={mob.headerBg}>
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
              getItemLayout={(_, index) => ({ length: SCREEN_W - 40, offset: (SCREEN_W - 40) * index, index })}
              onScrollToIndexFailed={() => {}}
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
            <CategoryCard icon="rose"  title="Pooja"  subtitle="Daily sevas" color="#8B3520" gradColors={['#A34020', '#5A1A0A']} onPress={() => router.push('/(tabs)/temples')} />
            <CategoryCard icon="videocam" title="Live" subtitle="Watch live" color="#C9922A" gradColors={['#C9922A', '#A67A1E']} onPress={() => router.push('/(tabs)/live')} />
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
        {IS_WEB && <WebFooter />}
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

function AccomCarousel({ properties, innerW }: { properties: any[]; innerW: number }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const active = properties[idx] || properties[0];
  const heroH = Math.max(300, Math.min(460, Math.round(innerW * 0.42)));

  const goTo = useCallback((next: number) => {
    const n = ((next % properties.length) + properties.length) % properties.length;
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => {
      setIdx(n);
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: false }).start();
    });
  }, [properties.length, fade]);

  useEffect(() => {
    if (properties.length <= 1 || paused) return;
    const t = setInterval(() => goTo(idx + 1), 4000);
    return () => clearInterval(t);
  }, [idx, properties.length, paused, goTo]);

  if (properties.length === 0) return null;

  const heroImg = parseImages(active.images)[0] || null;
  const open = () => router.push(`/accommodation/${active.id}` as any);
  const hoverProps = Platform.OS === 'web'
    ? { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) }
    : {};

  return (
    <View {...(hoverProps as any)}>
      {/* Hero */}
      <View style={{
        height: heroH, borderRadius: 24, overflow: 'hidden', position: 'relative',
        backgroundColor: '#1A0A05',
        ...(Platform.OS === 'web' ? { boxShadow: '0 10px 44px rgba(0,0,0,0.28)' } as any : {}),
      } as any}>
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: fade } as any}>
          {heroImg ? (
            <Image source={{ uri: heroImg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#3D1408', '#7A3020', '#C9922A']} style={StyleSheet.absoluteFill} />
          )}
          {/* left + bottom scrim for text legibility */}
          <LinearGradient
            colors={['rgba(10,4,2,0.85)', 'rgba(10,4,2,0.25)', 'transparent']}
            start={[0, 0]} end={[1, 0]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,4,2,0.6)', 'rgba(10,4,2,0.95)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Overlay content */}
        <Animated.View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: innerW >= 800 ? 36 : 22, opacity: fade,
          maxWidth: innerW >= 800 ? '65%' : '100%',
        } as any}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
            backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 5,
            borderRadius: 999, marginBottom: 14,
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>
              {(active.type || 'HOTEL').toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: innerW >= 800 ? 40 : 26, fontWeight: '900', lineHeight: innerW >= 800 ? 46 : 32, marginBottom: 10 }} numberOfLines={2}>
            {active.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
            {active.min_price ? (
              <Text style={{ color: '#FFD27A', fontSize: 15, fontWeight: '800' }}>₹{parseFloat(active.min_price).toFixed(0)}/night</Text>
            ) : null}
            {(active.city || active.address) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.75)" />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }} numberOfLines={1}>{active.city || active.address}</Text>
              </View>
            ) : null}
          </View>
          {active.description ? (
            <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 21, marginBottom: 20 }} numberOfLines={2}>
              {active.description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={open}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#fff', paddingHorizontal: 26, paddingVertical: 13, borderRadius: 999,
                ...(Platform.OS === 'web' ? { boxShadow: '0 4px 18px rgba(0,0,0,0.28)', cursor: 'pointer' } as any : {}),
              } as any}
            >
              <Ionicons name="bed" size={18} color="#B0300F" />
              <Text style={{ color: '#B0300F', fontWeight: '900', fontSize: 15 }}>View Rooms</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/accommodation' as any)}
              style={{
                width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
              } as any}
            >
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Arrows */}
        {properties.length > 1 && (
          <>
            <TouchableOpacity
              onPress={() => goTo(idx - 1)}
              style={{ position: 'absolute', left: 14, top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}) } as any}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => goTo(idx + 1)}
              style={{ position: 'absolute', right: 14, top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}) } as any}
            >
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Poster strip */}
      {properties.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
          {properties.map((p: any, i: number) => {
            const thumb = parseImages(p.images)[0] || null;
            const activeThumb = i === idx;
            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                onPress={() => goTo(i)}
                style={{
                  width: 148, height: 92, borderRadius: 12, overflow: 'hidden', position: 'relative',
                  borderWidth: 2, borderColor: activeThumb ? '#B0300F' : 'transparent',
                  backgroundColor: '#2A1208',
                  ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
                } as any}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={['#3D1408', '#7A3020']} style={StyleSheet.absoluteFill} />
                )}
                {!activeThumb && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,4,2,0.45)' } as any} />}
                <LinearGradient colors={['transparent', 'rgba(10,4,2,0.9)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, justifyContent: 'flex-end', padding: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }} numberOfLines={1}>{p.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
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
        borderWidth: 1, borderColor: 'rgba(139,21,21,0.1)',
        ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(0,0,0,0.1)' } as any : {}),
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
            colors={['#3D1408', '#7A3020']}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="bed-outline" size={48} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        )}
        <View style={{
          position: 'absolute', top: 12, left: 12,
          backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
        }}>
          <Text style={{ color: SAFFRON, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
            {p.type || 'Hotel'}
          </Text>
        </View>
        {p.min_price ? (
          <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#7A3020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>₹{parseFloat(p.min_price).toFixed(0)}/night</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#1A0505', fontSize: 16, fontWeight: '800', marginBottom: 4 }} numberOfLines={1}>{p.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <Ionicons name="location-outline" size={13} color={SAFFRON} />
          <Text style={{ color: '#666666', fontSize: 12 }} numberOfLines={1}>{p.city || p.address}</Text>
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
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(139,21,21,0.2)' },
  dotActive: { width: 20, backgroundColor: SAFFRON },
  section: { marginTop: 26 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 15, color: '#1A0505', paddingHorizontal: 20, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: SAFFRON, paddingLeft: 12, fontWeight: '700' },
  seeAll: { color: SAFFRON, fontWeight: '600', fontSize: 13 },
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
    borderRadius: 18, padding: 10, borderWidth: 1, borderColor: 'rgba(139,21,21,0.1)',
  },
  poojaImgWrap: { width: 70, height: 70, borderRadius: 14, backgroundColor: '#F5E8E0', overflow: 'hidden' },
  typeBadge: (type: string) => ({
    alignSelf: 'flex-start',
    backgroundColor: type === 'homam' ? 'rgba(139,21,21,0.08)' : 'rgba(198,40,40,0.18)',
    borderWidth: 1,
    borderColor: type === 'homam' ? 'rgba(139,21,21,0.35)' : 'rgba(198,40,40,0.4)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4,
  }),
  typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#1A0505' },
  poojaName: { fontSize: 14, color: '#1A0505', fontWeight: '700' },
  poojaDesc: { fontSize: 12, color: '#555555', marginTop: 2 },
  poojaFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  poojaPrice: { fontSize: 15, color: SAFFRON, fontWeight: '700' },
  poojaDur: { fontSize: 12, color: '#888888' },
};
