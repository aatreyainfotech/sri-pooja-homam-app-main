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
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const EMPTY = { name: '', deity: '', location: '', description: '', logo: '', banner: '', phone: '' };

export default function ManageTemples() {
  const router = useRouter();
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
      logo: 'https://images.pexels.com/photos/36587847/pexels-photo-36587847.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200',
      banner: 'https://images.pexels.com/photos/36609017/pexels-photo-36609017.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
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
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity testID="tmg-back" onPress={() => safeBack('/admin')} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Temples</Text>
        <TouchableOpacity testID="tmg-new-btn" onPress={openNew} style={styles.back}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View testID={`tmg-item-${item.id}`} style={styles.card}>
            <Image source={{ uri: item.banner }} style={styles.cardImg} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSub}>{item.deity} • {item.location}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
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
          </View>
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
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <FormField testID="tmg-name-input" label="Temple Name" value={form.name} onChangeText={(v: string) => setForm({ ...form, name: v })} />
              <FormField testID="tmg-deity-input" label="Presiding Deity" value={form.deity} onChangeText={(v: string) => setForm({ ...form, deity: v })} />
              <FormField testID="tmg-location-input" label="Location" value={form.location} onChangeText={(v: string) => setForm({ ...form, location: v })} />
              <FormField testID="tmg-desc-input" label="Description" value={form.description} onChangeText={(v: string) => setForm({ ...form, description: v })} multiline />
              <FormField testID="tmg-logo-input" label="Logo URL" value={form.logo} onChangeText={(v: string) => setForm({ ...form, logo: v })} />
              <FormField testID="tmg-banner-input" label="Banner URL" value={form.banner} onChangeText={(v: string) => setForm({ ...form, banner: v })} />
              <FormField testID="tmg-phone-input" label="Phone (optional)" value={form.phone} onChangeText={(v: string) => setForm({ ...form, phone: v })} />
              {form.banner ? <Image source={{ uri: form.banner }} style={styles.preview} /> : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChangeText, multiline, testID }: any) {
  return (
    <View>
      <Text style={styles.flabel}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[styles.finput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        placeholderTextColor={theme.colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardImg: { width: 90, height: 90, borderRadius: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  cardSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  actEdit: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actEditText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  actDel: { backgroundColor: '#FFEBEE', padding: 6, borderRadius: 8 },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40 },
  mhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  mcloseBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mtitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  msave: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  flabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  finput: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: theme.colors.text },
  preview: { width: '100%', height: 180, borderRadius: 14, marginTop: 10 },
});
