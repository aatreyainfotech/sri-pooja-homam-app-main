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
import WebView from 'react-native-webview';
import { api, apiError } from '../../src/services/api';
import {
  isAgoraAvailable, getAgora, fetchStreamToken,
} from '../../src/services/agoraService';
import { theme } from '../../src/constants/theme';

// Returns true if URL is a direct playable video (HLS/MP4/etc.)
// Returns false for regular web pages which need WebView
function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0];
  return (
    lower.endsWith('.m3u8') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ts') ||
    lower.endsWith('.mpd') ||
    lower.includes('googlevideo.com') ||
    lower.includes('/manifest')
  );
}

const { width } = Dimensions.get('window');
const CLIENT_ROLE_AUDIENCE = 2;

export default function LiveStream() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const safeBack = useSafeBack();
  const [stream, setStream] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null); // auth/fetch errors
  const [videoError, setVideoError] = useState<string | null>(null); // stream load errors
  const [loading, setLoading] = useState(true);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const engineRef = useRef<any>(null);

  const RtcSurfaceView: React.ComponentType<any> | null =
    isAgoraAvailable() ? (getAgora()?.RtcSurfaceView || null) : null;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/live-streams/${id}`);
        setStream(data);
        if (data.provider === 'agora' && data.channel_name && isAgoraAvailable()) {
          joinAsAudience(data);
        }
      } catch (e) {
        setFetchError(apiError(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { cleanupEngine(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const joinAsAudience = async (_streamData: any) => {
    try {
      const uid = Math.floor(Math.random() * 100000) + 1;
      const tok = await fetchStreamToken(id!, 'subscriber', uid);
      const Agora = getAgora();
      const rtc = Agora.createAgoraRtcEngine();

      rtc.initialize({ appId: tok.app_id, channelProfile: 1 });
      rtc.enableVideo();
      rtc.enableAudio();
      rtc.setClientRole(CLIENT_ROLE_AUDIENCE);

      // Mute local mic/camera — audience must never send audio (prevents echo)
      rtc.muteLocalAudioStream(true);
      rtc.muteLocalVideoStream(true);

      // onUserJoined fires when broadcaster enters — onUserPublished does NOT exist in v4.x
      rtc.addListener('onUserJoined', (_conn: any, remoteUser: number) => {
        setRemoteUid(remoteUser);
      });
      rtc.addListener('onUserOffline', (_conn: any, offlineUid: number) => {
        setRemoteUid(prev => (prev === offlineUid ? null : prev));
      });
      // Backup: catch video state change in case broadcaster was already live
      rtc.addListener('onRemoteVideoStateChanged', (_conn: any, remoteUser: number, state: number) => {
        if (state === 2) setRemoteUid(remoteUser);
      });

      rtc.joinChannel(tok.token, tok.channel_name, uid, {
        clientRoleType: CLIENT_ROLE_AUDIENCE,
        autoSubscribeVideo: true,
        autoSubscribeAudio: true,
      });

      engineRef.current = rtc;
    } catch (e) {
      console.warn('[Agora] audience join failed:', e);
    }
  };

  const cleanupEngine = () => {
    const rtc = engineRef.current;
    if (rtc) {
      try { rtc.leaveChannel(); } catch {}
      try { rtc.release(); } catch {}
      engineRef.current = null;
    }
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={theme.colors.secondary} size="large" /></View>;
  }

  // Auth/fetch error — show locked screen
  if (fetchError) {
    return (
      <SafeAreaView style={styles.lockedWrap}>
        <TouchableOpacity onPress={() => safeBack('/(tabs)/live')} style={styles.closeTop}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.lockedCard}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={48} color={theme.colors.secondary} />
          </View>
          <Text style={styles.lockTitle}>Premium Content</Text>
          <Text style={styles.lockMsg}>{fetchError}</Text>
          <TouchableOpacity style={styles.lockBtn} onPress={() => router.replace('/(tabs)/temples')}>
            <Text style={styles.lockBtnText}>Browse Poojas to Unlock</Text>
            <Ionicons name="arrow-forward" size={16} color="#2D1B19" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAgoraStream = stream?.provider === 'agora' && stream?.channel_name;
  const streamUrl: string = stream?.stream_url || '';
  const useWebView = streamUrl && !isDirectVideoUrl(streamUrl); // webpage URL → WebView

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>

      {isAgoraStream ? (
        // ── Agora real-time camera stream ──
        RtcSurfaceView && remoteUid !== null ? (
          <RtcSurfaceView canvas={{ uid: remoteUid }} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.waitingOverlay]}>
            <ActivityIndicator color={theme.colors.secondary} size="large" />
            <Text style={styles.waitingText}>Connecting to live stream…</Text>
            <Text style={styles.waitingSub}>Waiting for the pujari to start</Text>
          </View>
        )
      ) : streamUrl && Platform.OS === 'web' ? (
        // ── All stream types on web → iframe (WebView & expo-av don't support web) ──
        <iframe
          src={streamUrl}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' } as any}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
        />
      ) : useWebView ? (
        // ── Native: webpage URL → WebView ──
        <WebView
          source={{ uri: streamUrl }}
          style={StyleSheet.absoluteFill}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onError={() => setVideoError('Could not load the stream page.')}
        />
      ) : streamUrl ? (
        // ── Native: direct video URL (.m3u8 / .mp4) → expo-av ──
        <Video
          source={{ uri: streamUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          useNativeControls={false}
          onError={() => setVideoError('Unable to play this stream.')}
        />
      ) : (
        // ── No URL configured ──
        <View style={[StyleSheet.absoluteFill, styles.waitingOverlay]}>
          <Ionicons name="videocam-off" size={48} color="#555" />
          <Text style={styles.waitingText}>No stream configured</Text>
          <Text style={styles.waitingSub}>Admin has not set a stream URL for this broadcast.</Text>
        </View>
      )}

      {/* Video load error banner (non-blocking — doesn't replace full screen) */}
      {videoError && (
        <View style={styles.videErrBanner}>
          <Ionicons name="alert-circle" size={16} color="#FF8A80" />
          <Text style={styles.videoErrText}>{videoError}</Text>
          <TouchableOpacity onPress={() => setVideoError(null)}>
            <Ionicons name="close" size={16} color="#FF8A80" />
          </TouchableOpacity>
        </View>
      )}

      <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.topGrad} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.botGrad} pointerEvents="none" />

      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <TouchableOpacity testID="live-back-btn-top" onPress={() => safeBack('/(tabs)/live')} style={styles.closeTop}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.liveBadge}>
          <View style={styles.redDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </SafeAreaView>

      <View style={styles.watermark} testID="live-watermark">
        <Image source={require('../../assets/images/icon.png')} style={styles.wmLogo} />
        <Text style={styles.wmText}>Sri Pooja Homam</Text>
      </View>

      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <Text style={styles.streamTitle}>{stream?.title}</Text>
        <View style={styles.row}>
          <Ionicons name="eye" size={14} color={theme.colors.secondary} />
          <Text style={styles.sub}>
            {isAgoraStream ? 'Live Pooja Broadcast' : 'Streaming now'}
          </Text>
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
  waitingOverlay: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  waitingText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  waitingSub: { color: '#bbb', fontSize: 13, textAlign: 'center' },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 140, zIndex: 1 },
  botGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, zIndex: 1 },
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
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
    position: 'absolute', top: 90, right: 16, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(139,21,21,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.5)',
  },
  wmLogo: { width: 24, height: 24, borderRadius: 6 },
  wmText: { color: theme.colors.secondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, zIndex: 2 },
  streamTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sub: { color: theme.colors.secondary, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 20, marginTop: 18 },
  actBtn: { alignItems: 'center', gap: 4 },
  actText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  videErrBanner: {
    position: 'absolute', top: 100, left: 16, right: 16, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,50,50,0.15)', padding: 10, borderRadius: 10,
  },
  videoErrText: { color: '#FF8A80', fontSize: 12, flex: 1 },
  lockedWrap: { flex: 1, backgroundColor: '#2D1B19', padding: 20 },
  lockedCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
