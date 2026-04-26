import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeBack } from '../src/hooks/useSafeBack';
import { api, apiError } from '../src/services/api';
import { theme } from '../src/constants/theme';

type Prefs = {
  notify_pooja: boolean;
  notify_video: boolean;
  notify_live: boolean;
  notify_booking: boolean;
};

const DEFAULTS: Prefs = {
  notify_pooja: true,
  notify_video: true,
  notify_live: true,
  notify_booking: true,
};

export default function NotificationSettings() {
  const safeBack = useSafeBack();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/notification-prefs');
        setPrefs({
          notify_pooja: !!data.notify_pooja,
          notify_video: !!data.notify_video,
          notify_live: !!data.notify_live,
          notify_booking: !!data.notify_booking,
        });
      } catch {}
      setLoading(false);
    })();
  }, []);

  const update = async (key: keyof Prefs, val: boolean) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    setSaving(true);
    try {
      await api.put('/users/notification-prefs', next);
    } catch (e) {
      Alert.alert('Failed to save', apiError(e));
      setPrefs(prefs);
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity testID="notif-back" onPress={() => safeBack('/(tabs)/profile')} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.back} />
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={styles.sub}>Choose which updates you want to receive as push notifications.</Text>

          <Row
            icon="flower" color="#8B1515"
            title="New Poojas" desc="When a new pooja is added to the app"
            value={prefs.notify_pooja} onChange={(v) => update('notify_pooja', v)}
            testID="notif-pref-pooja"
          />
          <Row
            icon="film" color="#1565C0"
            title="New Videos" desc="When new devotional videos are published"
            value={prefs.notify_video} onChange={(v) => update('notify_video', v)}
            testID="notif-pref-video"
          />
          <Row
            icon="radio" color="#D32F2F"
            title="Live Streams" desc="When a live darshan or stream begins"
            value={prefs.notify_live} onChange={(v) => update('notify_live', v)}
            testID="notif-pref-live"
          />
          <Row
            icon="calendar" color="#2E7D32"
            title="My Bookings" desc="Booking confirmations & assignment updates"
            value={prefs.notify_booking} onChange={(v) => update('notify_booking', v)}
            testID="notif-pref-booking"
          />

          {saving ? <Text style={styles.saving}>Saving…</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({
  icon, color, title, desc, value, onChange, testID,
}: {
  icon: any; color: string; title: string; desc: string;
  value: boolean; onChange: (v: boolean) => void; testID?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.primary, false: '#ccc' }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  rowDesc: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  saving: { fontSize: 12, color: theme.colors.textMuted, textAlign: 'center', marginTop: 8 },
});
