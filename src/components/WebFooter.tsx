import { View, Text, TouchableOpacity, Image, Linking, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#C9922A';
const GOLD_LIGHT = '#E3B85C';
const DARK = '#1A0C07';

export default function WebFooter() {
  const router = useRouter();
  return (
    <LinearGradient colors={['#3D1408', '#25100A', DARK]} style={s.footer}>
      <View style={s.footerRow}>

        {/* Brand */}
        <View style={s.brandCol}>
          <TouchableOpacity onPress={() => router.push('/(tabs)' as any)} style={s.brandRow}>
            <Image source={require('../../assets/images/icon.png')} style={s.logo} />
            <View>
              <Text style={s.telugu}>శ్రీ పూజా హోమం</Text>
              <Text style={s.tagline}>Sri Pooja Homam</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.about}>
            India's most trusted platform for booking sacred poojas, homams & live temple darshan. Connect with verified pujaris from the comfort of your home.
          </Text>
          <View style={s.socialRow}>
            <TouchableOpacity style={s.socialBtn} onPress={() => Linking.openURL('https://wa.me/918309067121')}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialBtn} onPress={() => Linking.openURL('https://facebook.com/sripoojahomam')}>
              <Ionicons name="logo-facebook" size={16} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialBtn} onPress={() => Linking.openURL('https://instagram.com/sripoojahomam')}>
              <Ionicons name="logo-instagram" size={16} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialBtn} onPress={() => Linking.openURL('https://youtube.com/@sripoojahomam')}>
              <Ionicons name="logo-youtube" size={16} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View style={s.col}>
          <Text style={s.colHead}>Quick Links</Text>
          {[
            { label: 'Home',             route: '/(tabs)' },
            { label: 'Temples',          route: '/(tabs)/temples' },
            { label: 'Register Free',    route: '/(auth)/register' },
            { label: 'Live Darshan',     route: '/(tabs)/live' },
            { label: 'Sign In',          route: '/(auth)/login' },
            { label: 'Privacy Policy',   route: '/legal/privacy-policy' },
            { label: 'Terms & Conditions', route: '/legal/terms' },
          ].map((item) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)}>
              <Text style={s.link}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Services */}
        <View style={s.col}>
          <Text style={s.colHead}>Our Services</Text>
          <Text style={s.item}>📿  Book Poojas Online</Text>
          <Text style={s.item}>🔥  Homam Booking</Text>
          <Text style={s.item}>📺  Live Temple Darshan</Text>
          <Text style={s.item}>🙏  Pujari at Your Home</Text>
          <Text style={s.item}>🏨  Temple Accommodation</Text>
          <Text style={s.item}>📅  Panchangam Calendar</Text>
          <Text style={s.item}>🎁  Gift a Pooja</Text>
        </View>

        {/* Contact */}
        <View style={s.col}>
          <Text style={s.colHead}>Contact Us</Text>
          <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL('tel:+918644297366')}>
            <Ionicons name="call-outline" size={13} color={GOLD} />
            <Text style={s.link}>+91 86442 97366</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL('https://wa.me/918309067121')}>
            <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
            <Text style={s.link}>WhatsApp Us</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 14 }}>
            <Text style={s.colHead}>Download App</Text>
            <TouchableOpacity style={[s.storeBtn, { marginTop: 6 }]} onPress={() => Linking.openURL('https://play.google.com/store/search?q=sri+pooja+homam')}>
              <Ionicons name="logo-android" size={14} color="#E3B85C" />
              <Text style={s.storeTxt}>Google Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.storeBtn, { marginTop: 6 }]} onPress={() => Linking.openURL('https://apps.apple.com/search?term=sri+pooja+homam')}>
              <Ionicons name="logo-apple" size={14} color="#E3B85C" />
              <Text style={s.storeTxt}>App Store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Trust & Security Strip ── */}
      <View style={s.trustStrip}>
        <View style={s.trustInner}>
          <Text style={s.trustHeading}>Trusted & Secure Platform</Text>
          <View style={s.trustBadges}>
            {[
              { icon: 'shield-checkmark', color: '#E3B85C', title: '256-bit SSL',    sub: 'Encrypted' },
              { icon: 'ribbon',           color: '#C9922A', title: 'ISO 27001',       sub: 'Certified Security' },
              { icon: 'card',             color: '#E3B85C', title: 'Razorpay',        sub: 'Secure Payments' },
              { icon: 'globe',            color: '#C9922A', title: 'Digital India',   sub: 'Compliant' },
              { icon: 'phone-portrait',   color: '#E3B85C', title: 'UPI / IMPS',      sub: 'Payments Accepted' },
              { icon: 'people',           color: '#C9922A', title: '10,000+ Devotees', sub: 'Served' },
            ].map((b) => (
              <View key={b.title} style={s.trustBadge}>
                <Ionicons name={b.icon as any} size={22} color={b.color} />
                <View>
                  <Text style={s.trustTitle}>{b.title}</Text>
                  <Text style={s.trustSub}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={s.bottom}>
        <Text style={s.copyright}>© 2026 Aatreya Infotech Systems LLP • All rights reserved</Text>
        <View style={s.bottomLinks}>
          <TouchableOpacity onPress={() => router.push('/legal/privacy-policy' as any)}>
            <Text style={s.bottomLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={s.bottomDot}>•</Text>
          <TouchableOpacity onPress={() => router.push('/legal/terms' as any)}>
            <Text style={s.bottomLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={s.bottomDot}>•</Text>
          <TouchableOpacity onPress={() => router.push('/legal/refund' as any)}>
            <Text style={s.bottomLink}>Refund</Text>
          </TouchableOpacity>
          <Text style={s.bottomDot}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://aatreya.org')}>
            <Text style={s.devTxt}>
              Powered by <Text style={s.devName}>Aatreya Infotech</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  footer: {
    borderTopWidth: 3, borderTopColor: GOLD,
    flexShrink: 0,
  },
  footerRow: {
    flexDirection: 'row', gap: 32,
    paddingHorizontal: 32, paddingTop: 36, paddingBottom: 24,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' ? { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any : {}),
  },
  brandCol: { flexDirection: 'column', gap: 12, flex: 1.5, minWidth: 220 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 10 },
  telugu: { color: GOLD_LIGHT, fontSize: 15, fontWeight: '800' },
  tagline: { color: 'rgba(253,251,247,0.6)', fontSize: 11, marginTop: 2 },
  about: { color: 'rgba(253,251,247,0.62)', fontSize: 12, lineHeight: 20, maxWidth: 280 },
  socialRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  socialBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(227,184,92,0.18)',
  },
  col: { gap: 8, minWidth: 140 },
  colHead: { color: GOLD_LIGHT, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  link: { color: 'rgba(253,251,247,0.8)', fontSize: 13, paddingVertical: 1 },
  item: { color: 'rgba(253,251,247,0.62)', fontSize: 13, paddingVertical: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  storeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeTxt: { color: 'rgba(253,251,247,0.72)', fontSize: 13 },
  bottom: {
    borderTopWidth: 1, borderTopColor: 'rgba(201,146,42,0.25)',
    paddingVertical: 14, paddingHorizontal: 32,
    flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
    ...(Platform.OS === 'web' ? { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any : {}),
  },
  copyright: { color: 'rgba(227,184,92,0.6)', fontSize: 11 },
  bottomLinks: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bottomLink: { color: 'rgba(253,251,247,0.6)', fontSize: 11, fontWeight: '600' } as any,
  bottomDot: { color: 'rgba(201,146,42,0.4)', fontSize: 11 },
  devTxt: { color: 'rgba(253,251,247,0.5)', fontSize: 11 } as any,
  devName: { color: GOLD_LIGHT, fontWeight: '700' },

  // Trust strip
  trustStrip: {
    backgroundColor: 'rgba(201,146,42,0.1)',
    borderTopWidth: 1, borderTopColor: 'rgba(201,146,42,0.25)',
    paddingVertical: 20, paddingHorizontal: 32,
  },
  trustInner: {
    ...(Platform.OS === 'web' ? { maxWidth: 1280, alignSelf: 'center', width: '100%' } as any : {}),
  },
  trustHeading: {
    color: 'rgba(227,184,92,0.75)', fontSize: 10, fontWeight: '800',
    letterSpacing: 2, textAlign: 'center' as const, marginBottom: 14,
  },
  trustBadges: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
  },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,146,42,0.25)',
    minWidth: 140,
  },
  trustTitle: { color: 'rgba(253,251,247,0.9)', fontSize: 12, fontWeight: '700' },
  trustSub: { color: 'rgba(253,251,247,0.6)', fontSize: 10, marginTop: 1 },
});
