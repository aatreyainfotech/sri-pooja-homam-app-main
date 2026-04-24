import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function LiveStream() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const safeBack = useSafeBack();
  const videoRef = useRef<Video>(null);
  const [stream, setStream] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/live-streams/${id}`);
        setStream(data);
      } catch (e) {
        setError(apiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={theme.colors.secondary} size="large" /></View>;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.lockedWrap}>
        <TouchableOpacity testID="live-back-btn" onPress={() => safeBack('/(tabs)/live')} style={styles.closeTop} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.lockedCard}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={48} color={theme.colors.secondary} />
          </View>
          <Text style={styles.lockTitle}>Premium Content</Text>
          <Text style={styles.lockMsg}>{error}</Text>
          <TouchableOpacity
            testID="live-browse-btn"
            style={styles.lockBtn}
            onPress={() => router.replace('/(tabs)/temples')}
          >
            <Text style={styles.lockBtnText}>Browse Poojas to Unlock</Text>
            <Ionicons name="arrow-forward" size={16} color="#2D1B19" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Video
        ref={videoRef}
        source={{ uri: stream.stream_url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        useNativeControls={false}
        onError={() => setError('Unable to load stream')}
      />

      <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.topGrad} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.botGrad} />

      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <TouchableOpacity testID="live-back-btn-top" onPress={() => safeBack('/(tabs)/live')} style={styles.closeTop} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.liveBadge}>
          <View style={styles.redDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </SafeAreaView>

      {/* Watermark logo - bottom right */}
      <View style={styles.watermark} testID="live-watermark">
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.wmLogo}
        />
        <Text style={styles.wmText}>Sri Pooja Homam</Text>
      </View>

      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <Text style={styles.streamTitle}>{stream.title}</Text>
        <View style={styles.row}>
          <Ionicons name="eye" size={14} color={theme.colors.secondary} />
          <Text style={styles.sub}>Streaming now • Paid Devotee Access</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actBtn}>
            <Ionicons name="heart-outline" size={22} color="#fff" />
            <Text style={styles.actText}>Bless</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actBtn}>
            <Ionicons name="share-social-outline" size={22} color="#fff" />
            <Text style={styles.actText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actBtn} onPress={() => Alert.alert('Thank you 🙏', 'Your donation helps the temple')}>
            <Ionicons name="gift-outline" size={22} color={theme.colors.secondary} />
            <Text style={[styles.actText, { color: theme.colors.secondary }]}>Donate</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  video: { ...StyleSheet.absoluteFillObject, width, height: '100%' },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  botGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16,
  },
  closeTop: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E53935', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  watermark: {
    position: 'absolute', top: 90, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(139,21,21,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.5)',
  },
  wmLogo: { width: 24, height: 24, borderRadius: 6 },
  wmText: { color: theme.colors.secondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  streamTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sub: { color: theme.colors.secondary, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 20, marginTop: 18 },
  actBtn: { alignItems: 'center', gap: 4 },
  actText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  lockedWrap: { flex: 1, backgroundColor: '#2D1B19', padding: 20 },
  lockedCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  lockIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 2, borderColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  lockTitle: { color: theme.colors.secondary, fontSize: 26, fontWeight: '800' },
  lockMsg: { color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', marginTop: 10, paddingHorizontal: 20, lineHeight: 22 },
  lockBtn: {
    marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.secondary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999,
  },
  lockBtnText: { color: '#2D1B19', fontWeight: '800', fontSize: 14 },
});
