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

const CATEGORIES = [
  { label: 'All', icon: 'apps-outline' },
  { label: 'Temple Stories', icon: 'business-outline' },
  { label: 'Spiritual', icon: 'flower-outline' },
  { label: 'Pilgrimage', icon: 'map-outline' },
  { label: 'Travel Tips', icon: 'airplane-outline' },
  { label: 'Festivals', icon: 'calendar-outline' },
];

const BLOGS = [
  {
    category: 'Temple Stories', title: 'The Divine Legend of Tirupati Balaji', date: 'June 10, 2025',
    excerpt: 'Discover the ancient mythology and spiritual significance of Sri Venkateswara — the most visited temple in the world.',
    readTime: '5 min read', color: '#7A3020',
  },
  {
    category: 'Pilgrimage', title: 'Complete Guide to Char Dham Yatra 2025', date: 'May 28, 2025',
    excerpt: 'Everything you need to know about the Char Dham yatra — best time to visit, how to register, and what to carry.',
    readTime: '8 min read', color: '#A67A1E',
  },
  {
    category: 'Spiritual', title: 'The Science Behind Vedic Homam Rituals', date: 'May 15, 2025',
    excerpt: 'Homams are not just rituals — modern science confirms the air-purifying and health benefits of sacred fire ceremonies.',
    readTime: '6 min read', color: '#8B3520',
  },
  {
    category: 'Festivals', title: 'How to Celebrate Ganesh Chaturthi at Home', date: 'Apr 30, 2025',
    excerpt: 'A step-by-step guide to performing Ganesh puja at home with proper rituals, mantras, and prasad preparation.',
    readTime: '7 min read', color: '#3D1408',
  },
  {
    category: 'Travel Tips', title: 'Varanasi on a Pilgrim Budget — 5 Days', date: 'Apr 18, 2025',
    excerpt: 'Explore the eternal city of Kashi without breaking the bank. Best ghats, dharamshalas, and hidden gems revealed.',
    readTime: '6 min read', color: '#7A3020',
  },
  {
    category: 'Spiritual', title: 'Understanding the 12 Jyotirlingas of Lord Shiva', date: 'Apr 5, 2025',
    excerpt: 'The 12 Jyotirlingas are the most sacred abodes of Lord Shiva. Learn the stories and significance of each one.',
    readTime: '9 min read', color: '#8B3520',
  },
  {
    category: 'Temple Stories', title: 'Shirdi Sai Baba — The Saint Who Transcended Religion', date: 'Mar 22, 2025',
    excerpt: 'How a simple fakir from Shirdi became the most beloved saint worshipped by millions across all religions.',
    readTime: '5 min read', color: '#A67A1E',
  },
  {
    category: 'Travel Tips', title: 'Sabarimala Yatra — Preparation and Protocol', date: 'Mar 10, 2025',
    excerpt: 'The 41-day Mandala Deeksham, the Irumudi, and what to expect on the Sabarimala pilgrimage to Lord Ayyappa.',
    readTime: '8 min read', color: '#3D1408',
  },
];

export default function BlogsPage() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const innerW = Math.min(W, 1280);

  if (IS_WEB) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8E7', ...(Platform.OS === 'web' ? { overflowY: 'auto' } as any : {}) }}>
        <LinearGradient colors={['#1A0C07', '#3D1408', '#7A3020']} style={s.hero}>
          <Text style={s.heroOm}>ॐ</Text>
          <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={s.heroTitle}>Spiritual Blogs</Text>
            <Text style={s.heroSub}>Temple stories, pilgrimage guides, festival wisdom & spiritual insights</Text>
          </View>
        </LinearGradient>

        <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', padding: 40 }}>
          {/* Categories */}
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: cat.label === 'All' ? SAFFRON : '#fff',
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                  borderWidth: 1, borderColor: cat.label === 'All' ? SAFFRON : 'rgba(230,126,34,0.25)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(74,44,42,0.08)' } as any : {}),
                } as any}
              >
                <Ionicons name={cat.icon as any} size={14} color={cat.label === 'All' ? '#fff' : SAFFRON} />
                <Text style={{ color: cat.label === 'All' ? '#fff' : '#4A2C2A', fontSize: 13, fontWeight: '700' }}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Blog grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
            {BLOGS.map((blog, i) => (
              <TouchableOpacity
                key={blog.title}
                activeOpacity={0.88}
                style={{
                  flex: i < 2 ? 2 : 1, minWidth: 280,
                  backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
                  borderWidth: 1, borderColor: 'rgba(230,126,34,0.12)',
                  ...(Platform.OS === 'web' ? { boxShadow: '0 6px 24px rgba(74,44,42,0.1)' } as any : {}),
                } as any}
              >
                <LinearGradient
                  colors={[blog.color + 'DD', blog.color + '88']}
                  style={{ height: i < 2 ? 200 : 140, justifyContent: 'flex-end', padding: 20 }}
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{blog.category.toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: '#fff', fontSize: i < 2 ? 22 : 17, fontWeight: '900', lineHeight: i < 2 ? 30 : 24 }}>{blog.title}</Text>
                </LinearGradient>
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#7A6A5A', fontSize: 13, lineHeight: 20, marginBottom: 16 }}>{blog.excerpt}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="calendar-outline" size={12} color="#aaa" />
                      <Text style={{ color: '#aaa', fontSize: 12 }}>{blog.date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="time-outline" size={12} color={SAFFRON} />
                      <Text style={{ color: SAFFRON, fontSize: 12, fontWeight: '600' }}>{blog.readTime}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text style={{ color: '#7A6A5A', fontSize: 16, marginBottom: 16 }}>More articles coming soon — subscribe for updates</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SAFFRON, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 }}
              onPress={() => router.push('/(auth)/register' as any)}
            >
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Subscribe for Updates</Text>
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
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 }}>Spiritual Blogs</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {BLOGS.map((blog) => (
          <View key={blog.title} style={{ backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)' }}>
            <LinearGradient colors={[blog.color, blog.color + 'AA']} style={{ padding: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>{blog.category.toUpperCase()}</Text>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{blog.title}</Text>
            </LinearGradient>
            <View style={{ padding: 14 }}>
              <Text style={{ color: '#7A6A5A', fontSize: 13, lineHeight: 20 }}>{blog.excerpt}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                <Text style={{ color: '#aaa', fontSize: 12 }}>{blog.date}</Text>
                <Text style={{ color: SAFFRON, fontSize: 12, fontWeight: '600' }}>{blog.readTime}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { paddingVertical: 56, paddingHorizontal: 24, overflow: 'hidden' },
  heroOm: { position: 'absolute', right: -10, top: -20, fontSize: 240, color: 'rgba(212,175,55,0.06)', fontWeight: '400' } as any,
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  heroTitle: { color: '#fff', fontSize: 48, fontWeight: '900', lineHeight: 56 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 17, marginTop: 10, maxWidth: 540, lineHeight: 27 },
});
