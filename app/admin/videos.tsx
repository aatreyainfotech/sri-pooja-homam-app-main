import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

const EMPTY = { temple_id: null, title: '', caption: '', video_url: '', thumbnail: '' };

export default function ManageVideos() {
  const router = useRouter();
  const safeBack = useSafeBack();
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
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity testID="vmg-back" onPress={() => safeBack('/admin')} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Videos</Text>
        <TouchableOpacity testID="vmg-new-btn" onPress={openNew} style={styles.back}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View testID={`vmg-item-${item.id}`} style={styles.card}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
            <View style={styles.playBadge}>
              <Ionicons name="play" size={14} color="#fff" />
            </View>
            <View style={{ padding: 10 }}>
              <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cap} numberOfLines={2}>{item.caption}</Text>
              <TouchableOpacity testID={`vmg-del-${item.id}`} onPress={() => remove(item)} style={styles.delBtn}>
                <Ionicons name="trash" size={14} color={theme.colors.danger} />
                <Text style={styles.delText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.mhead}>
              <TouchableOpacity testID="vmg-modal-close" onPress={() => setModal(false)} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Ionicons name="close" size={26} color={theme.colors.text} /></TouchableOpacity>
              <Text style={styles.mtitle}>Upload Video</Text>
              <TouchableOpacity testID="vmg-save-btn" onPress={save} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.msave}>Publish</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Text style={styles.flabel}>Temple (optional)</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity onPress={() => setForm({ ...form, temple_id: null })} style={[styles.chip, !form.temple_id && styles.chipActive]}>
                  <Text style={[styles.chipText, !form.temple_id && styles.chipTextActive]}>General</Text>
                </TouchableOpacity>
                {temples.map((t) => (
                  <TouchableOpacity key={t.id} onPress={() => setForm({ ...form, temple_id: t.id })} style={[styles.chip, form.temple_id === t.id && styles.chipActive]}>
                    <Text style={[styles.chipText, form.temple_id === t.id && styles.chipTextActive]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.flabel}>Title</Text>
              <TextInput testID="vmg-title-input" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} style={styles.finput} />

              <Text style={styles.flabel}>Caption</Text>
              <TextInput testID="vmg-caption-input" value={form.caption} onChangeText={(v) => setForm({ ...form, caption: v })} multiline style={[styles.finput, { minHeight: 70, textAlignVertical: 'top' }]} />

              <Text style={styles.flabel}>Video URL</Text>
              <TextInput testID="vmg-video-input" value={form.video_url} onChangeText={(v) => setForm({ ...form, video_url: v })} style={styles.finput} autoCapitalize="none" />

              <Text style={styles.flabel}>Thumbnail URL</Text>
              <TextInput testID="vmg-thumb-input" value={form.thumbnail} onChangeText={(v) => setForm({ ...form, thumbnail: v })} style={styles.finput} autoCapitalize="none" />

              {form.thumbnail ? <Image source={{ uri: form.thumbnail }} style={styles.preview} /> : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 16 / 11 },
  playBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(139,21,21,0.85)', borderRadius: 999, padding: 6 },
  name: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  cap: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2, minHeight: 28 },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  delText: { fontSize: 11, color: theme.colors.danger, fontWeight: '600' },

  mhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  mcloseBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mtitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  msave: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  flabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  finput: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: theme.colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
  chipTextActive: { color: '#fff' },
  preview: { width: '100%', height: 180, borderRadius: 12 },
});
