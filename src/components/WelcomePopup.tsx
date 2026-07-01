import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const SAFFRON = '#8B3520';
const GOLD    = '#C9922A';
const DARK    = '#4A2C2A';

const FEATURES = [
  { icon: 'flower-outline',           text: 'Book Poojas & Homams with verified Vedic pujaris' },
  { icon: 'videocam-outline',         text: 'Watch Live Darshan from temples across India' },
  { icon: 'home-outline',             text: 'Invite a pujari to your home for auspicious events' },
  { icon: 'bed-outline',              text: 'Book accommodation near temples — hotels, dharamshalas & more!' },
  { icon: 'shield-checkmark-outline', text: '100% verified pujaris • Secure payments • 24/7 support' },
];

export default function WelcomePopup() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('sph_popup_v1');
      if (!shown) {
        const t = setTimeout(show, 1800);
        return () => clearTimeout(t);
      }
    } else {
      const t = setTimeout(show, 1800);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setVisible(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      sessionStorage.setItem('sph_popup_v1', '1');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1} />
        <View style={s.card}>
          {/* Header */}
          <LinearGradient colors={['#3D1408', '#7A3020', '#8B3520', '#C9922A']} style={s.header}>
            <Text style={s.om}>ॐ</Text>
            <TouchableOpacity style={s.closeBtn} onPress={close}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <View style={s.headerBadge}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' }} />
              <Text style={s.headerBadgeTxt}>LIVE POOJAS AVAILABLE</Text>
            </View>
            <Text style={s.headerTitle}>Sri Pooja Homam</Text>
            <Text style={s.headerTelugu}>శ్రీ పూజా హోమం</Text>
            <Text style={s.headerSub}>India's most trusted platform for sacred rituals</Text>
          </LinearGradient>

          {/* Body */}
          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            <Text style={s.bodyTitle}>🙏 Why Choose Us?</Text>

            {FEATURES.map((f, i) => (
              <View key={i} style={s.feature}>
                <View style={s.featIcon}>
                  <Ionicons name={f.icon as any} size={18} color={SAFFRON} />
                </View>
                <Text style={s.featText}>{f.text}</Text>
              </View>
            ))}

            {/* Trust row */}
            <View style={s.trustRow}>
              {[
                { icon: 'shield-checkmark', color: '#4CAF50', label: 'SSL Secured' },
                { icon: 'ribbon',           color: GOLD,      label: 'ISO 27001' },
                { icon: 'card',             color: '#528FF0', label: 'Razorpay' },
                { icon: 'globe',            color: SAFFRON,   label: 'Digital India' },
              ].map((b) => (
                <View key={b.label} style={s.trustBadge}>
                  <Ionicons name={b.icon as any} size={16} color={b.color} />
                  <Text style={s.trustLabel}>{b.label}</Text>
                </View>
              ))}
            </View>

            {/* CTAs */}
            <View style={s.btns}>
              <TouchableOpacity
                style={s.btn1}
                onPress={() => { close(); router.push('/(auth)/register' as any); }}
              >
                <Ionicons name="person-add" size={16} color="#fff" />
                <Text style={s.btn1Text}>Register Free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btn2}
                onPress={() => { close(); router.push('/(tabs)/live' as any); }}
              >
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E53935' }} />
                <Text style={s.btn2Text}>Watch Live</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={close} style={s.skipBtn}>
              <Text style={s.skipTxt}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const IS_WEB = Platform.OS === 'web';

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: {
    width: '100%', maxWidth: IS_WEB ? 480 : 360,
    borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff',
    ...(IS_WEB ? { boxShadow: '0 24px 80px rgba(0,0,0,0.5)' } as any : {
      shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, elevation: 24,
    }),
  },
  header: {
    paddingTop: IS_WEB ? 36 : 28, paddingBottom: 28,
    paddingHorizontal: 28, alignItems: 'center', position: 'relative', overflow: 'hidden',
  },
  om: {
    position: 'absolute', fontSize: 120, color: 'rgba(255,255,255,0.07)',
    fontWeight: '400', top: -10,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, marginBottom: 12,
  },
  headerBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: IS_WEB ? 28 : 24, fontWeight: '900', letterSpacing: 0.5 },
  headerTelugu: { color: 'rgba(255,255,255,0.8)', fontSize: IS_WEB ? 16 : 14, fontWeight: '700', marginTop: 4 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6, textAlign: 'center' },

  body: { padding: 22, maxHeight: IS_WEB ? 420 : 340 },
  bodyTitle: { fontSize: IS_WEB ? 17 : 15, fontWeight: '800', color: DARK, marginBottom: 14 },

  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  featIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(230,126,34,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featText: { flex: 1, fontSize: 13, color: '#5A5A5A', lineHeight: 20, paddingTop: 8 },

  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 18 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF8E7', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(230,126,34,0.2)',
  },
  trustLabel: { fontSize: 10, fontWeight: '700', color: DARK },

  btns: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btn1: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    ...(IS_WEB ? {
      background: 'linear-gradient(135deg, #C9922A 0%, #7A3020 100%)',
      boxShadow: '0 4px 16px rgba(122,48,32,0.4)',
    } as any : { backgroundColor: '#7A3020' }),
  },
  btn1Text: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btn2: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#FFF8E7', borderWidth: 1.5, borderColor: 'rgba(230,126,34,0.3)',
  },
  btn2Text: { color: DARK, fontWeight: '700', fontSize: 14 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipTxt: { color: 'rgba(90,90,90,0.5)', fontSize: 12 },
});
