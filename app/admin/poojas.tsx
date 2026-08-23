import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
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

const EMPTY = { temple_id: '', name: '', type: 'pooja', description: '', price: '', duration: '', image: '', sched_date: '', sched_time: '' };

function toISOScheduled(date: string, time: string): string | null {
  if (!date || !time) return null;
  try { const iso = `${date}T${time}:00`; new Date(iso).toISOString(); return iso; } catch { return null; }
}
function fromISOScheduled(iso: string | null): { sched_date: string; sched_time: string } {
  if (!iso) return { sched_date: '', sched_time: '' };
  try {
    const d = new Date(iso);
    return { sched_date: d.toISOString().slice(0, 10), sched_time: d.toTimeString().slice(0, 5) };
  } catch { return { sched_date: '', sched_time: '' }; }
}

export default function ManagePoojas() {
  const safeBack = useSafeBack();
  const [items, setItems] = useState<any[]>([]);
  const [temples, setTemples] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api.get('/poojas'), api.get('/temples')]);
      setItems(p.data);
      setTemples(t.data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const templeName = (id: string) => temples.find((t) => t.id === id)?.name || '—';

  const openNew = () => {
    setEditing(null);
    setForm({
      ...EMPTY,
      temple_id: temples[0]?.id || '',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Yajna_Homa_fire.jpg/640px-Yajna_Homa_fire.jpg',
      duration: '1 hour',
      price: '501',
    });
    setModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ ...p, price: String(p.price), ...fromISOScheduled(p.scheduled_at) });
    setModal(true);
  };

  const save = async () => {
    if (!form.temple_id || !form.name || !form.description || !form.price) {
      Alert.alert('Required', 'Temple, name, description and price are required');
      return;
    }
    const payload = {
      temple_id: form.temple_id || '',
      name: form.name || '',
      type: form.type || 'pooja',
      description: form.description || '',
      price: parseFloat(form.price) || 0,
      duration: form.duration || '',
      image: form.image || '',
      scheduled_at: toISOScheduled(form.sched_date, form.sched_time),
    };
    try {
      if (editing) await api.put(`/poojas/${editing.id}`, payload);
      else await api.post('/poojas', payload);
      setModal(false);
      load();
    } catch (e) { Alert.alert('Failed', apiError(e)); }
  };

  const remove = (p: any) => {
    Alert.alert('Delete?', `Delete "${p.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/poojas/${p.id}`); load(); }
          catch (e) { Alert.alert('Failed', apiError(e)); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader
        title="Poojas & Homams"
        onBack={() => safeBack('/admin')}
        rightAction={
          <TouchableOpacity testID="pmg-new-btn" onPress={openNew} hitSlop={10}>
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
            <Surface testID={`pmg-item-${item.id}`} elevation="sm" padding="sm" radius="lg" style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.img} />
              <View style={{ flex: 1, marginLeft: theme.spacing.sm + 4 }}>
                <Badge label={item.type.toUpperCase()} status="neutral" size="sm" />
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{templeName(item.temple_id)} • ₹{item.price}</Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                  <TouchableOpacity testID={`pmg-edit-${item.id}`} onPress={() => openEdit(item)} style={styles.actEdit}>
                    <Ionicons name="pencil" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity testID={`pmg-del-${item.id}`} onPress={() => remove(item)} style={[styles.actEdit, { backgroundColor: theme.statusColors.danger.bg }]}>
                    <Ionicons name="trash" size={14} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Surface>
          </ResponsiveContainer>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.mhead}>
              <TouchableOpacity testID="pmg-modal-close" onPress={() => setModal(false)} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Ionicons name="close" size={26} color={theme.colors.text} /></TouchableOpacity>
              <Text style={styles.mtitle}>{editing ? 'Edit Pooja' : 'New Pooja/Homam'}</Text>
              <TouchableOpacity testID="pmg-save-btn" onPress={save} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.msave}>Save</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
              <Text style={styles.flabel}>Temple</Text>
              <View style={styles.chipRow}>
                {temples.map((t) => (
                  <Chip key={t.id} label={t.name} selected={form.temple_id === t.id} onPress={() => setForm({ ...form, temple_id: t.id })} />
                ))}
              </View>

              <Text style={styles.flabel}>Type</Text>
              <View style={styles.chipRow}>
                {['pooja', 'homam'].map((t) => (
                  <Chip key={t} label={t.toUpperCase()} selected={form.type === t} onPress={() => setForm({ ...form, type: t })} />
                ))}
              </View>

              <Input testID="pmg-name-input" label="Name" value={form.name} onChangeText={(v: string) => setForm({ ...form, name: v })} />
              <Input testID="pmg-desc-input" label="Description" value={form.description} onChangeText={(v: string) => setForm({ ...form, description: v })} multiline />
              <Input testID="pmg-price-input" label="Price (₹)" value={form.price} onChangeText={(v: string) => setForm({ ...form, price: v })} keyboardType="decimal-pad" />
              <Input testID="pmg-duration-input" label="Duration" value={form.duration} onChangeText={(v: string) => setForm({ ...form, duration: v })} />
              <ImagePickerField testID="pmg-image-input" label="Pooja Image" value={form.image} onChangeValue={(v: string) => setForm({ ...form, image: v })} />
              <Input testID="pmg-sched-date-input" label="Pooja Date (YYYY-MM-DD)" value={form.sched_date || ''} onChangeText={(v: string) => setForm({ ...form, sched_date: v })} />
              <Input testID="pmg-sched-time-input" label="Pooja Time (HH:MM, 24h)" value={form.sched_time || ''} onChangeText={(v: string) => setForm({ ...form, sched_time: v })} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ImagePickerField({ label, value, onChangeValue, testID }: any) {
  const [picking, setPicking] = useState(false);
  const isUploaded = value?.startsWith('data:');

  const pickImage = async () => {
    setPicking(true);
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.65,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const mime = result.assets[0].mimeType || 'image/jpeg';
        onChangeValue(`data:${mime};base64,${result.assets[0].base64}`);
      }
    } catch { Alert.alert('Error', 'Could not open image picker'); }
    finally { setPicking(false); }
  };

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={styles.flabel}>{label}</Text>
      <View style={styles.imgRow}>
        <TextInput
          testID={testID}
          value={isUploaded ? '' : (value || '')}
          onChangeText={onChangeValue}
          placeholder={isUploaded ? 'Image uploaded from device' : 'Paste image URL'}
          placeholderTextColor={isUploaded ? theme.colors.primary : theme.colors.textMuted}
          style={[styles.finput, { flex: 1 }]}
          editable={!isUploaded}
        />
        <TouchableOpacity onPress={pickImage} style={styles.pickBtn} disabled={picking}>
          {picking ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="image-outline" size={20} color="#fff" />}
        </TouchableOpacity>
        {isUploaded && (
          <TouchableOpacity onPress={() => onChangeValue('')} style={styles.clearBtn}>
            <Ionicons name="close" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        )}
      </View>
      {value ? <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row' },
  img: { width: 80, height: 80, borderRadius: theme.radius.sm + 4 },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
  sub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  actEdit: { backgroundColor: theme.statusColors.neutral.bg, padding: 8, borderRadius: theme.radius.sm + 2 },

  mhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  mcloseBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mtitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  msave: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  flabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  finput: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.sm + 4, fontSize: 14, color: theme.colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  imgRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  pickBtn: { backgroundColor: theme.colors.primary, padding: 13, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { backgroundColor: theme.statusColors.danger.bg, padding: 13, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: 160, borderRadius: theme.radius.md, marginTop: theme.spacing.sm + 2 },
});
