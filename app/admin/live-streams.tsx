import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';
import Chip from '../../src/components/ui/Chip';
import Badge from '../../src/components/ui/Badge';

const EMPTY = { temple_id: '', pooja_id: null, title: '', stream_url: '', is_paid_only: true, is_live: true };

export default function ManageLiveStreams() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const [items, setItems] = useState<any[]>([]);
  const [temples, setTemples] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const load = useCallback(async () => {
    try {
      const [l, t] = await Promise.all([api.get('/live-streams'), api.get('/temples')]);
      setItems(l.data);
      setTemples(t.data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, temple_id: temples[0]?.id || '' });
    setModal(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ ...s });
    setModal(true);
  };

  const save = async () => {
    if (!form.temple_id || !form.title || !form.stream_url) {
      Alert.alert('Required', 'Temple, title and stream URL are required');
      return;
    }
    try {
      if (editing) await api.put(`/live-streams/${editing.id}`, form);
      else await api.post('/live-streams', form);
      setModal(false);
      load();
    } catch (e) { Alert.alert('Failed', apiError(e)); }
  };

  const remove = (s: any) => {
    Alert.alert('Delete Stream?', s.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/live-streams/${s.id}`); load(); }
          catch (e) { Alert.alert('Failed', apiError(e)); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader
        title="Live Streams"
        onBack={() => safeBack('/admin')}
        rightAction={
          <TouchableOpacity testID="smg-new-btn" onPress={openNew} hitSlop={10}>
            <Ionicons name="add-circle" size={28} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm + 2, alignItems: 'center' }}
        renderItem={({ item }) => (
          <ResponsiveContainer maxWidth={900}>
            <Surface testID={`smg-item-${item.id}`} elevation="sm" padding="sm" radius="lg" style={styles.card}>
              <View style={styles.ldot} />
              <View style={{ flex: 1, marginLeft: theme.spacing.sm + 4 }}>
                <Text style={styles.name}>{item.title}</Text>
                <Text style={styles.sub} numberOfLines={1}>{item.stream_url}</Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs + 2 }}>
                  <Badge label={item.is_paid_only ? 'PAID ONLY' : 'PUBLIC'} status="warning" size="sm" />
                  <Badge label={item.is_live ? 'LIVE' : 'OFFLINE'} status={item.is_live ? 'success' : 'neutral'} size="sm" />
                </View>
              </View>
              <View style={{ gap: theme.spacing.xs + 2 }}>
                <TouchableOpacity
                  testID={`smg-golive-${item.id}`}
                  onPress={() => router.push(`/live-broadcast/${item.id}`)}
                  style={[styles.actEdit, { backgroundColor: theme.statusColors.danger.bg }]}
                >
                  <Ionicons name="radio" size={14} color={theme.colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity testID={`smg-edit-${item.id}`} onPress={() => openEdit(item)} style={styles.actEdit}>
                  <Ionicons name="pencil" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity testID={`smg-del-${item.id}`} onPress={() => remove(item)} style={styles.actEdit}>
                  <Ionicons name="trash" size={14} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            </Surface>
          </ResponsiveContainer>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.mhead}>
              <TouchableOpacity testID="smg-modal-close" onPress={() => setModal(false)} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Ionicons name="close" size={26} color={theme.colors.text} /></TouchableOpacity>
              <Text style={styles.mtitle}>{editing ? 'Edit Stream' : 'New Stream'}</Text>
              <TouchableOpacity testID="smg-save-btn" onPress={save} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.msave}>Save</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
              <Text style={styles.flabel}>Temple</Text>
              <View style={styles.chipRow}>
                {temples.map((t) => (
                  <Chip key={t.id} label={t.name} selected={form.temple_id === t.id} onPress={() => setForm({ ...form, temple_id: t.id })} />
                ))}
              </View>

              <Input testID="smg-title-input" label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
              <Input
                testID="smg-url-input"
                label="Stream URL (HLS / YouTube Live / MP4)"
                value={form.stream_url}
                onChangeText={(v) => setForm({ ...form, stream_url: v })}
                autoCapitalize="none"
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Paid Devotees Only</Text>
                  <Text style={styles.switchSub}>Requires a paid booking in this temple</Text>
                </View>
                <Switch testID="smg-paid-switch" value={form.is_paid_only} onValueChange={(v) => setForm({ ...form, is_paid_only: v })} />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Currently Live</Text>
                  <Text style={styles.switchSub}>Show as live on devotee home</Text>
                </View>
                <Switch testID="smg-live-switch" value={form.is_live} onValueChange={(v) => setForm({ ...form, is_live: v })} />
              </View>

              <View style={styles.tip}>
                <Ionicons name="bulb" size={16} color={theme.colors.secondaryDark} />
                <Text style={styles.tipText}>
                  Paste YouTube Live URL, HLS (.m3u8) link, or MP4. Watermark is automatically added to player.
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center' },
  ldot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53935' },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  actEdit: { backgroundColor: theme.statusColors.neutral.bg, padding: 8, borderRadius: theme.radius.sm + 2 },

  mhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  mcloseBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mtitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  msave: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  flabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, padding: theme.spacing.sm + 4, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.sm + 4 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  switchSub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm, padding: theme.spacing.sm + 4, borderRadius: theme.radius.sm + 4, backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  tipText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 16 },
});
