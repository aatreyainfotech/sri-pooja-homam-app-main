import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, apiError } from '../../src/services/api';
import {
  isAgoraAvailable, getAgora, fetchLiveConfig, fetchStreamToken,
} from '../../src/services/agoraService';
import { theme } from '../../src/constants/theme';

// Channel profile / roles (Agora constants)
const CHANNEL_PROFILE_LIVE_BROADCASTING = 1;
const CLIENT_ROLE_BROADCASTER = 1;

export default function LiveBroadcastScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [engine, setEngine] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [cfg, s] = await Promise.all([
          fetchLiveConfig(),
          api.get(`/live-streams/${id}`).then(r => r.data),
        ]);
        setConfigured(cfg.agora_configured);
        setStream(s);
      } catch (e) {
        setError(apiError(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { stopBroadcast(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startBroadcast = async () => {
    if (Platform.OS === 'web' || !isAgoraAvailable()) {
      Alert.alert(
        'Broadcasting requires the mobile app',
        'Live camera broadcasting is only available in the Sri Pooja Homam mobile app (dev build / production). Web preview and Expo Go cannot run the native broadcasting module.',
      );
      return;
    }
    try {
      setError(null);
      const tok = await fetchStreamToken(id!, 'publisher', 0);
      const Agora = getAgora();
      const rtc = Agora.createAgoraRtcEngine();
      rtc.initialize({ appId: tok.app_id, channelProfile: CHANNEL_PROFILE_LIVE_BROADCASTING });
      rtc.enableVideo();
      rtc.enableAudio();
      rtc.startPreview();
      rtc.setClientRole(CLIENT_ROLE_BROADCASTER);

      rtc.addListener('onJoinChannelSuccess', () => {
        setIsLive(true);
      });
      rtc.addListener('onUserJoined', () => setViewerCount(v => v + 1));
      rtc.addListener('onUserOffline', () => setViewerCount(v => Math.max(0, v - 1)));
      rtc.addListener('onError', (err: any, msg: string) => {
        setError(`Agora error: ${msg || err}`);
      });

      rtc.joinChannel(tok.token, tok.channel_name, tok.uid || 0, {
        clientRoleType: CLIENT_ROLE_BROADCASTER,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
      });

      setEngine(rtc);
      // Mark the stream as live + provider=agora on backend
      await api.put(`/live-streams/${id}`, {
        ...stream, is_live: true, provider: 'agora', channel_name: tok.channel_name,
      });
    } catch (e) {
      setError(apiError(e));
    }
  };

  const stopBroadcast = async () => {
    try {
      if (engine) {
        try { engine.leaveChannel(); } catch {}
        try { engine.release(); } catch {}
      }
      setEngine(null);
      setIsLive(false);
      setViewerCount(0);
      if (stream) {
        try {
          await api.put(`/live-streams/${id}`, { ...stream, is_live: false });
        } catch {}
      }
    } catch {}
  };

  const confirmEnd = () => {
    Alert.alert('End broadcast?', 'Viewers will be disconnected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Live', style: 'destructive', onPress: async () => { await stopBroadcast(); router.back(); } },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{stream?.title || 'Live Broadcast'}</Text>
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE · {viewerCount} watching</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.preview}>
        {!isAgoraAvailable() || Platform.OS === 'web' ? (
          <View style={styles.placeholder}>
            <Ionicons name="videocam-off" size={64} color="#777" />
            <Text style={styles.placeholderTitle}>Broadcasting requires the mobile app</Text>
            <Text style={styles.placeholderSub}>
              Install the Sri Pooja Homam dev / production build to broadcast with your phone camera.{'\n\n'}
              Web preview & Expo Go can still WATCH streams, just not publish.
            </Text>
          </View>
        ) : !configured ? (
          <View style={styles.placeholder}>
            <Ionicons name="key-outline" size={64} color="#D4AF37" />
            <Text style={styles.placeholderTitle}>Agora not configured</Text>
            <Text style={styles.placeholderSub}>
              Ask your admin to set{'\n'}AGORA_APP_ID + AGORA_APP_CERTIFICATE{'\n'}in the backend .env, then restart.
            </Text>
          </View>
        ) : !isLive ? (
          <View style={styles.placeholder}>
            <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.bigIcon}>
              <Ionicons name="videocam" size={56} color="#fff" />
            </LinearGradient>
            <Text style={styles.placeholderTitle}>Ready to go live</Text>
            <Text style={styles.placeholderSub}>
              Make sure you're in good light and hold the phone steady.{'\n'}
              Devotees will get a push notification when you go live.
            </Text>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.bigIconLive}>
              <Ionicons name="radio" size={56} color="#fff" />
            </View>
            <Text style={[styles.placeholderTitle, { color: '#fff' }]}>You are LIVE</Text>
            <Text style={styles.placeholderSub}>Camera preview would appear here in the mobile build.</Text>
          </View>
        )}
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        {!isLive ? (
          <TouchableOpacity style={styles.goLiveBtn} onPress={startBroadcast}>
            <Ionicons name="radio" size={20} color="#fff" />
            <Text style={styles.goLiveText}>Go Live</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endBtn} onPress={confirmEnd}>
            <Ionicons name="stop-circle" size={20} color="#fff" />
            <Text style={styles.goLiveText}>End Live</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  liveText: { color: '#E53935', fontSize: 12, fontWeight: '800' },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholder: { alignItems: 'center', gap: 14, maxWidth: 360 },
  placeholderTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  placeholderSub: { color: '#bbb', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bigIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  bigIconLive: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E53935' },
  err: { color: '#FF8A80', padding: 16, textAlign: 'center', backgroundColor: 'rgba(255,0,0,0.08)' },
  bottomBar: { padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  goLiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, backgroundColor: '#E53935' },
  endBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, backgroundColor: '#424242' },
  goLiveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
