import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebFooter from '../src/components/WebFooter';

const GOLD = '#C9922A';
const IS_WEB = Platform.OS === 'web';

const FEATURES = [
  { icon: 'qr-code-outline', title: 'Digital QR Pass', desc: 'One QR code for seamless entry at all enrolled temples. No paper tickets needed.' },
  { icon: 'id-card-outline', title: 'Identity Verification', desc: 'Aadhaar-linked digital ID ensures secure, fraud-proof pilgrim identity.' },
  { icon: 'wallet-outline', title: 'Digital Wallet', desc: 'Pre-load funds for prasad, donations, and puja bookings at the temple.' },
  { icon: 'people-outline', title: 'Crowd Management', desc: 'Real-time crowd data helps you plan your visit and avoid long queues.' },
  { icon: 'scan-outline', title: 'Gate Scanning', desc: 'Temple gates scan your pass for instant, contactless entry verification.' },
  { icon: 'bar-chart-outline', title: 'Live Dashboard', desc: 'Track your yatra stats — temples visited, donations, blessings received.' },
  { icon: 'notifications-outline', title: 'Puja Alerts', desc: 'Get notified about special pujas, festivals, and VIP darshan slots.' },
  { icon: 'gift-outline', title: 'Pilgrim Benefits', desc: 'Exclusive discounts on prasad, accommodation, and travel packages.' },
];

const PLANS = [
  {
    name: 'Seva Pass', price: '₹299', period: '/year', color: '#4CAF50',
    features: ['Basic QR temple entry', 'Digital pilgrim ID', 'Crowd alerts', '10 temple network'],
  },
  {
    name: 'Yatra Pass', price: '₹599', period: '/year', color: '#FF9800', recommended: true,
    features: ['QR entry + gate scanning', 'Digital wallet ₹500 credit', 'Crowd alerts + live dashboard', '50+ temple network', 'Puja booking priority'],
  },
  {
    name: 'Divya Pass', price: '₹1499', period: '/year', color: '#9C27B0',
    features: ['All Yatra Pass features', 'VIP darshan slots', '200+ temples nationwide', 'Personal seva coordinator', 'Family group (up to 5)', 'Annual pilgrimage package discount'],
  },
];

export default function YatraPassPage() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const innerW = Math.min(W, 1280);

  if (IS_WEB) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8E7', ...(Platform.OS === 'web' ? { overflowY: 'auto' } as any : {}) }}>
        {/* Hero */}
        <LinearGradient colors={['#1A0C07', '#3D1408', '#7A3020']} style={s.hero}>
          <Text style={s.heroOm}>ॐ</Text>
          <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <View style={s.badge}>
              <Ionicons name="card-outline" size={14} color={GOLD} />
              <Text style={s.badgeText}>DIGITAL PILGRIM PASS</Text>
            </View>
            <Text style={s.heroTitle}>Yatra Pass</Text>
            <Text style={s.heroSub}>One pass for seamless access to temples across India — digital, secure, and contactless.</Text>
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GOLD, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999 }}
                onPress={() => router.push('/(auth)/register' as any)}
              >
                <Ionicons name="card-outline" size={18} color="#1A237E" />
                <Text style={{ color: '#1A237E', fontWeight: '800', fontSize: 15 }}>Get Your Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
                onPress={() => router.push('/contact' as any)}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Features */}
        <View style={{ backgroundColor: '#fff', paddingVertical: 56, paddingHorizontal: 24 }}>
          <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%' }}>
            <Text style={s.sectionTitle}>Everything You Need for Your Yatra</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 28 }}>
              {FEATURES.map((f) => (
                <View key={f.title} style={{
                  flex: 1, minWidth: 220,
                  backgroundColor: '#FFF8E7', borderRadius: 16, padding: 22,
                  borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 18px rgba(74,44,42,0.07)' } as any : {}),
                } as any}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(26,35,126,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Ionicons name={f.icon as any} size={24} color="#1A237E" />
                  </View>
                  <Text style={{ color: '#4A2C2A', fontSize: 15, fontWeight: '800', marginBottom: 6 }}>{f.title}</Text>
                  <Text style={{ color: '#7A6A5A', fontSize: 13, lineHeight: 20 }}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={{ backgroundColor: '#FFF8E7', paddingVertical: 56, paddingHorizontal: 24 }}>
          <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%' }}>
            <Text style={s.sectionTitle}>Choose Your Pass</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 28 }}>
              {PLANS.map((plan) => (
                <View key={plan.name} style={{
                  flex: 1, minWidth: 260, borderRadius: 20,
                  backgroundColor: '#fff', overflow: 'hidden',
                  borderWidth: plan.recommended ? 2 : 1,
                  borderColor: plan.recommended ? plan.color : 'rgba(230,126,34,0.15)',
                  ...(Platform.OS === 'web' ? { boxShadow: plan.recommended ? `0 12px 40px ${plan.color}40` : '0 6px 24px rgba(74,44,42,0.1)' } as any : {}),
                } as any}>
                  {plan.recommended && (
                    <View style={{ backgroundColor: plan.color, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>MOST POPULAR</Text>
                    </View>
                  )}
                  <View style={{ padding: 28 }}>
                    <Text style={{ color: '#4A2C2A', fontSize: 20, fontWeight: '900', marginBottom: 6 }}>{plan.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                      <Text style={{ color: plan.color, fontSize: 36, fontWeight: '900' }}>{plan.price}</Text>
                      <Text style={{ color: '#999', fontSize: 13 }}>{plan.period}</Text>
                    </View>
                    {plan.features.map((f) => (
                      <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                        <Text style={{ color: '#5A5A5A', fontSize: 13, flex: 1 }}>{f}</Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={{ marginTop: 20, backgroundColor: plan.color, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                      onPress={() => router.push('/(auth)/register' as any)}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Get {plan.name}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <WebFooter />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8E7' }} edges={['top']}>
      <LinearGradient colors={['#1A0C07', '#3D1408', '#7A3020']} style={{ paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 }}>Yatra Pass</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, paddingHorizontal: 20, marginTop: 4 }}>Your digital pilgrim identity pass</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {PLANS.map((plan) => (
          <View key={plan.name} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: plan.color, borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)' }}>
            <Text style={{ color: '#4A2C2A', fontSize: 18, fontWeight: '800' }}>{plan.name}</Text>
            <Text style={{ color: plan.color, fontSize: 24, fontWeight: '900', marginTop: 4 }}>{plan.price}<Text style={{ fontSize: 13, color: '#999' }}>{plan.period}</Text></Text>
            {plan.features.map((f) => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Ionicons name="checkmark-circle" size={14} color={plan.color} />
                <Text style={{ color: '#5A5A5A', fontSize: 13 }}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={{ marginTop: 14, backgroundColor: plan.color, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Get {plan.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { paddingVertical: 64, paddingHorizontal: 24, overflow: 'hidden' },
  heroOm: { position: 'absolute', right: 0, top: -20, fontSize: 280, color: 'rgba(255,255,255,0.04)', fontWeight: '400' } as any,
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(212,175,55,0.15)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)', marginBottom: 16 },
  badgeText: { color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: '#fff', fontSize: 52, fontWeight: '900', lineHeight: 60 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 17, marginTop: 12, maxWidth: 520, lineHeight: 27 },
  sectionTitle: { color: '#4A2C2A', fontSize: 28, fontWeight: '900', borderLeftWidth: 4, borderLeftColor: '#7A3020', paddingLeft: 14 },
});
