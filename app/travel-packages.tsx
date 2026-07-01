import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebFooter from '../src/components/WebFooter';

const GOLD = '#C9922A';
const SAFFRON = '#8B3520';
const IS_WEB = Platform.OS === 'web';

const PACKAGES = [
  {
    name: 'Char Dham Yatra', duration: '12 Days / 11 Nights', price: '₹45,000',
    color: '#00BCD4', icon: 'mountain',
    temples: ['Badrinath', 'Kedarnath', 'Gangotri', 'Yamunotri'],
    includes: ['Air/Train tickets', 'Hotel stays', 'Meals (Satvik)', 'Puja arrangements', 'Guide'],
    desc: 'The most sacred pilgrimage in Hinduism — visit all four holy abodes of the gods in the Himalayas.',
  },
  {
    name: 'Jyotirlinga Tour', duration: '16 Days / 15 Nights', price: '₹55,000',
    color: '#FF5722', icon: 'flame',
    temples: ['Somnath', 'Mallikarjuna', 'Mahakaleshwar', 'Omkareshwar', 'Kedarnath', 'Bhimashankar', 'Trimbakeshwar', 'Vaidyanath', 'Nageshwar', 'Rameshwaram', 'Ghrishneshwar', 'Kashi Vishwanath'],
    includes: ['Train/flight', '4-star stays', 'All meals', 'Priest for abhishekam', 'Tour manager'],
    desc: 'Visit all 12 sacred Jyotirlingas spread across India in one divine journey.',
  },
  {
    name: 'South India Temple Tour', duration: '10 Days / 9 Nights', price: '₹38,000',
    color: '#4CAF50', icon: 'business',
    temples: ['Tirupati', 'Meenakshi Madurai', 'Rameshwaram', 'Thanjavur', 'Chidambaram'],
    includes: ['Flight tickets', '3-star hotels', 'Vegetarian meals', 'Temple darshans', 'AC transport'],
    desc: 'Explore magnificent Dravidian temples of South India with grand gopurams and ancient sculptures.',
  },
  {
    name: 'Shakti Peetha Tour', duration: '14 Days / 13 Nights', price: '₹50,000',
    color: '#E91E63', icon: 'rose',
    temples: ['Kamakhya', 'Kalighat', 'Vindhyavasini', 'Kolhapur Mahalaxmi', 'Ambaji', 'Vaishno Devi'],
    includes: ['Air + rail travel', 'Hotel accommodation', 'Puja prasadam', 'Certified guide', 'Insurance'],
    desc: 'Sacred journey to the divine Shakti Peethas — goddess shrines of immense spiritual power.',
  },
  {
    name: 'Varanasi & Mathura Spiritual', duration: '6 Days / 5 Nights', price: '₹22,000',
    color: '#9C27B0', icon: 'water',
    temples: ['Kashi Vishwanath', 'Sankat Mochan', 'Krishna Janmabhoomi', 'Banke Bihari', 'Vrindavan'],
    includes: ['Train travel', 'Heritage hotels', 'Ganga Aarti experience', 'Boat ride', 'Priest arrangements'],
    desc: 'Experience the spiritual essence of Varanasi ghats and the birthplace of Lord Krishna in Mathura.',
  },
  {
    name: 'Custom Pilgrimage', duration: 'Flexible', price: 'Custom Quote',
    color: '#FF9800', icon: 'settings',
    temples: ['Your choice of temples'],
    includes: ['Personalized itinerary', 'Flexible dates', 'All arrangements', 'Dedicated coordinator', '24/7 support'],
    desc: 'Design your own sacred journey — we handle all logistics, puja bookings, and accommodation.',
  },
];

export default function TravelPackagesPage() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const innerW = Math.min(W, 1280);

  if (IS_WEB) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8E7', ...(Platform.OS === 'web' ? { overflowY: 'auto' } as any : {}) }}>
        <LinearGradient colors={['#1A0C07', '#7A3020', '#C9922A']} style={s.hero}>
          <Text style={s.heroOm}>ॐ</Text>
          <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <View style={s.badge}>
              <Text style={s.badgeText}>CURATED PILGRIMAGES</Text>
            </View>
            <Text style={s.heroTitle}>Travel Packages</Text>
            <Text style={s.heroSub}>Handcrafted spiritual journeys to India's holiest destinations</Text>
            <View style={s.statsRow}>
              {[{ v: '6+', l: 'Tour Types' }, { v: '50+', l: 'Destinations' }, { v: '4.9★', l: 'Rated' }, { v: '5000+', l: 'Yatris' }].map((x) => (
                <View key={x.l} style={s.statItem}>
                  <Text style={s.statVal}>{x.v}</Text>
                  <Text style={s.statLbl}>{x.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', padding: 40 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
            {PACKAGES.map((pkg) => (
              <View
                key={pkg.name}
                style={{
                  flex: 1, minWidth: 300,
                  backgroundColor: '#fff', borderRadius: 20,
                  overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(74,44,42,0.12)' } as any : {}),
                } as any}
              >
                <LinearGradient colors={[pkg.color + 'EE', pkg.color + 'AA']} style={{ padding: 24 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={pkg.icon as any} size={26} color="#fff" />
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{pkg.duration}</Text>
                      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 }}>{pkg.price}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 14, marginBottom: 6 }}>{pkg.name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 }}>{pkg.desc}</Text>
                </LinearGradient>
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#4A2C2A', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 }}>KEY TEMPLES</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {pkg.temples.slice(0, 4).map((t) => (
                      <View key={t} style={{ backgroundColor: pkg.color + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: pkg.color, fontSize: 11, fontWeight: '700' }}>{t}</Text>
                      </View>
                    ))}
                    {pkg.temples.length > 4 && (
                      <View style={{ backgroundColor: '#F5E6C8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: SAFFRON, fontSize: 11, fontWeight: '700' }}>+{pkg.temples.length - 4} more</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: '#4A2C2A', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 }}>INCLUDES</Text>
                  {pkg.includes.map((inc) => (
                    <View key={inc} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={{ color: '#5A5A5A', fontSize: 13 }}>{inc}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={{ marginTop: 16, backgroundColor: pkg.color, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                    onPress={() => router.push('/(auth)/login' as any)}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Book This Package</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: '#4A2C2A', borderRadius: 20, padding: 36, marginTop: 40, alignItems: 'center' }}>
            <Text style={{ color: GOLD, fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 10 }}>Need a Custom Tour?</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'center', maxWidth: 480, marginBottom: 24 }}>
              Tell us your preferred temples, dates, and budget — we'll create a personalized pilgrimage just for you.
            </Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: GOLD, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 }}
              onPress={() => router.push('/contact' as any)}
            >
              <Ionicons name="call-outline" size={18} color="#2D0B00" />
              <Text style={{ color: '#2D0B00', fontSize: 15, fontWeight: '800' }}>Contact Our Team</Text>
            </TouchableOpacity>
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
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 }}>Travel Packages</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {PACKAGES.map((pkg) => (
          <View key={pkg.name} style={{ backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)' }}>
            <LinearGradient colors={[pkg.color, pkg.color + 'AA']} style={{ padding: 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{pkg.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>{pkg.duration} • {pkg.price}</Text>
            </LinearGradient>
            <View style={{ padding: 14 }}>
              <Text style={{ color: '#5A5A5A', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>{pkg.desc}</Text>
              <TouchableOpacity style={{ backgroundColor: pkg.color, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Book This Package</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { paddingVertical: 60, paddingHorizontal: 24, overflow: 'hidden' },
  heroOm: { position: 'absolute', right: 0, top: -20, fontSize: 260, color: 'rgba(255,140,0,0.06)', fontWeight: '400' } as any,
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  badge: { backgroundColor: 'rgba(212,175,55,0.15)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)', marginBottom: 16 },
  badgeText: { color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: '#fff', fontSize: 48, fontWeight: '900', lineHeight: 56 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 17, marginTop: 10, maxWidth: 560, lineHeight: 27 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 36, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.2)', flexWrap: 'wrap' },
  statItem: {},
  statVal: { color: GOLD, fontSize: 28, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
});
