import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import { useResponsive } from '../../src/hooks/useResponsive';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';
import Chip from '../../src/components/ui/Chip';

const EMPTY = { temple_id: null, title: '', caption: '', video_url: '', thumbnail: '' };

export default function ManageVideos() {
  const safeBack = useSafeBack();
  const { isDesktop } = useResponsive();
  const numColumns = isDesktop ? 3 : 2;
  const [items, setItems] = useState<any[]>([]);
  const [temples, setTemples] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const load = useCallback(async () => {
    try {
      const [v, t] = await Promise.all([api.get('/videos'), api.get('/temples')]);
      setItems(v.data);
      setTemples(t.data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setForm({
      ...EMPTY,
      temple_id: temples[0]?.id || null,
      thumbnail: 'https://images.pexels.com/photos/30679068/pexels-photo-30679068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.title || !form.caption || !form.video_url) {
      Alert.alert('Required', 'Title, caption and video URL are required');
      return;
    }
    try {
      await api.post('/videos', form);
      setModal(false);
      load();
    } catch (e) { Alert.alert('Failed', apiError(e)); }
  };

  const remove = (v: any) => {
    Alert.alert('Delete Video?', v.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/videos/${v.id}`); load(); }
          catch (e) { Alert.alert('Failed', apiError(e)); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader
        title="Manage Videos"
        onBack={() => safeBack('/admin')}
        rightAction={
          <TouchableOpacity testID="vmg-new-btn" onPress={openNew} hitSlop={10}>
            <Ionicons name="add-circle" size={28} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ResponsiveContainer maxWidth={1100} style={{ flex: 1, alignSelf: 'center' }}>
        <FlatList
          key={numColumns}
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={numColumns}
          contentContainerStyle={{ padding: theme.spacing.sm + 4, gap: theme.spacing.sm + 4 }}
          columnWrapperStyle={{ gap: theme.spacing.sm + 4 }}
          renderItem={({ item }) => (
            <Surface testID={`vmg-item-${item.id}`} elevation="sm" padding="xs" radius="lg" style={styles.card}>
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              <View style={styles.playBadge}>
                <Ionicons name="play" size={14} color="#fff" />
              </View>
              <View style={{ padding: theme.spacing.sm + 2 }}>
                <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cap} numberOfLines={2}>{item.caption}</Text>
                <TouchableOpacity testID={`vmg-del-${item.id}`} onPress={() => remove(item)} style={styles.delBtn}>
                  <Ionicons name="trash" size={14} color={theme.colors.danger} />
                  <Text style={styles.delText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          )}
        />
      </ResponsiveContainer>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.mhead}>
              <TouchableOpacity testID="vmg-modal-close" onPress={() => setModal(false)} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Ionicons name="close" size={26} color={theme.colors.text} /></TouchableOpacity>
              <Text style={styles.mtitle}>Upload Video</Text>
              <TouchableOpacity testID="vmg-save-btn" onPress={save} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.msave}>Publish</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
              <Text style={styles.flabel}>Temple (optional)</Text>
              <View style={styles.chipRow}>
                <Chip label="General" selected={!form.temple_id} onPress={() => setForm({ ...form, temple_id: null })} />
                {temples.map((t) => (
                  <Chip key={t.id} label={t.name} selected={form.temple_id === t.id} onPress={() => setForm({ ...form, temple_id: t.id })} />
                ))}
              </View>

              <Input testID="vmg-title-input" label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
              <Input testID="vmg-caption-input" label="Caption" value={form.caption} onChangeText={(v) => setForm({ ...form, caption: v })} multiline />
              <Input testID="vmg-video-input" label="Video URL" value={form.video_url} onChangeText={(v) => setForm({ ...form, video_url: v })} autoCapitalize="none" />
              <Input testID="vmg-thumb-input" label="Thumbnail URL" value={form.thumbnail} onChangeText={(v) => setForm({ ...form, thumbnail: v })} autoCapitalize="none" />

              {form.thumbnail ? <Image source={{ uri: form.thumbnail }} style={styles.preview} /> : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 16 / 11 },
  playBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(122,48,32,0.85)', borderRadius: theme.radius.full, padding: 6 },
  name: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  cap: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2, minHeight: 28 },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, backgroundColor: theme.statusColors.danger.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.sm },
  delText: { fontSize: 11, color: theme.colors.danger, fontWeight: '600' },

  mhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  mcloseBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mtitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  msave: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  flabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  preview: { width: '100%', height: 180, borderRadius: theme.radius.md },
});
