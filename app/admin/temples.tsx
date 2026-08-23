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
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';

const EMPTY = { name: '', deity: '', location: '', description: '', logo: '', banner: '', phone: '' };

export default function ManageTemples() {
  const safeBack = useSafeBack();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/temples');
      setItems(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setEditing(null);
    setForm({
      ...EMPTY,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Tirumala_Tirupati_Balaji_Temple.jpg/400px-Tirumala_Tirupati_Balaji_Temple.jpg',
      banner: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Tirumala_temple_1.jpg/1024px-Tirumala_temple_1.jpg',
    });
    setModal(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ ...t });
    setModal(true);
  };

  const save = async () => {
    for (const k of ['name', 'deity', 'location', 'description', 'logo', 'banner']) {
      if (!form[k]?.toString().trim()) {
        Alert.alert('Required', `Please fill ${k}`);
        return;
      }
    }
    try {
      if (editing) {
        await api.put(`/temples/${editing.id}`, form);
      } else {
        await api.post('/temples', form);
      }
      setModal(false);
      load();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    }
  };

  const remove = (t: any) => {
    if (user?.role !== 'super_admin') {
      Alert.alert('Forbidden', 'Only super admin can delete temples');
      return;
    }
    Alert.alert('Delete Temple', `Delete "${t.name}"? This also removes its poojas.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/temples/${t.id}`);
            load();
          } catch (e) { Alert.alert('Failed', apiError(e)); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader
        title="Manage Temples"
        onBack={() => safeBack('/admin')}
        rightAction={
          <TouchableOpacity testID="tmg-new-btn" onPress={openNew} hitSlop={10}>
            <Ionicons name="add-circle" size={28} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm + 4, alignItems: 'center' }}
        renderItem={({ item }) => (
          <ResponsiveContainer maxWidth={900}>
            <Surface testID={`tmg-item-${item.id}`} elevation="sm" padding="sm" radius="lg" style={styles.card}>
              <Image source={{ uri: item.banner }} style={styles.cardImg} />
              <View style={{ flex: 1, marginLeft: theme.spacing.sm + 4 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.deity} • {item.location}</Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                  <TouchableOpacity testID={`tmg-edit-${item.id}`} onPress={() => openEdit(item)} style={styles.actEdit}>
                    <Ionicons name="pencil" size={14} color={theme.colors.primary} />
                    <Text style={styles.actEditText}>Edit</Text>
                  </TouchableOpacity>
                  {user?.role === 'super_admin' && (
                    <TouchableOpacity testID={`tmg-del-${item.id}`} onPress={() => remove(item)} style={styles.actDel}>
                      <Ionicons name="trash" size={14} color={theme.colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Surface>
          </ResponsiveContainer>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No temples yet. Tap + to create one.</Text>}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.mhead}>
              <TouchableOpacity testID="tmg-modal-close" onPress={() => setModal(false)} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.mtitle}>{editing ? 'Edit Temple' : 'New Temple'}</Text>
              <TouchableOpacity testID="tmg-save-btn" onPress={save} style={styles.mcloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.msave}>Save</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
              <Input testID="tmg-name-input" label="Temple Name" value={form.name} onChangeText={(v: string) => setForm({ ...form, name: v })} />
              <Input testID="tmg-deity-input" label="Presiding Deity" value={form.deity} onChangeText={(v: string) => setForm({ ...form, deity: v })} />
              <Input testID="tmg-location-input" label="Location" value={form.location} onChangeText={(v: string) => setForm({ ...form, location: v })} />
              <Input testID="tmg-desc-input" label="Description" value={form.description} onChangeText={(v: string) => setForm({ ...form, description: v })} multiline />
              <ImagePickerField testID="tmg-logo-input" label="Logo Image" value={form.logo} onChangeValue={(v: string) => setForm({ ...form, logo: v })} />
              <ImagePickerField testID="tmg-banner-input" label="Banner Image" value={form.banner} onChangeValue={(v: string) => setForm({ ...form, banner: v })} />
              <Input testID="tmg-phone-input" label="Phone (optional)" value={form.phone} onChangeText={(v: string) => setForm({ ...form, phone: v })} />
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
  cardImg: { width: 90, height: 90, borderRadius: theme.radius.md },
  cardName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  cardSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  actEdit: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.statusColors.neutral.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.sm + 2 },
  actEditText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  actDel: { backgroundColor: theme.statusColors.danger.bg, padding: 6, borderRadius: theme.radius.sm + 2 },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40 },
  mhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  mcloseBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mtitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  msave: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  flabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  finput: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.sm + 4, fontSize: 14, color: theme.colors.text },
  preview: { width: '100%', height: 180, borderRadius: theme.radius.md + 2, marginTop: theme.spacing.sm + 2 },
  imgRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  pickBtn: { backgroundColor: theme.colors.primary, padding: 13, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { backgroundColor: theme.statusColors.danger.bg, padding: 13, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
});
