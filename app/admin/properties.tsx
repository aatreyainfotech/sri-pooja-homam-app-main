import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const BLUE = '#0288D1';

export default function AdminProperties() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [temples, setTemples] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', type: 'hotel', temple_id: '', address: '', city: '',
    phone: '', description: '', check_in_time: '12:00', check_out_time: '11:00',
    total_rooms: '0',
  });

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get('/admin/properties'),
        api.get('/temples'),
      ]);
      setProperties(pRes.data);
      setTemples(tRes.data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.address.trim()) {
      Alert.alert('Missing Fields', 'Name, address and description are required.');
      return;
    }
    try {
      await api.post('/properties', {
        ...form,
        total_rooms: parseInt(form.total_rooms) || 0,
        temple_id: form.temple_id || null,
      });
      setShowCreate(false);
      setForm({ name: '', type: 'hotel', temple_id: '', address: '', city: '', phone: '', description: '', check_in_time: '12:00', check_out_time: '11:00', total_rooms: '0' });
      await load();
      Alert.alert('Created', 'Property created. Activate it to make it visible to devotees.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create property');
    }
  };

  const toggleActivate = async (prop: any) => {
    if (user?.role !== 'super_admin') {
      Alert.alert('Permission Denied', 'Only super admins can activate/deactivate properties.');
      return;
    }
    const newState = !prop.is_active;
    Alert.alert(
      newState ? 'Activate Property' : 'Deactivate Property',
      `${newState ? 'Activate' : 'Deactivate'} "${prop.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.put(`/properties/${prop.id}/activate`, { is_active: newState });
              await load();
            } catch {}
          },
        },
      ]
    );
  };

  const renderProp = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/admin/property-detail?id=${item.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, { backgroundColor: BLUE + '20' }]}>
          <Ionicons name="bed" size={14} color={BLUE} />
          <Text style={[styles.typeText, { color: BLUE }]}>{(item.type || 'hotel').toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.activeBadge, { backgroundColor: item.is_active ? '#E8F5E9' : '#FFF3E0' }]}
          onPress={() => toggleActivate(item)}
        >
          <View style={[styles.activeDot, { backgroundColor: item.is_active ? '#4CAF50' : '#FF9800' }]} />
          <Text style={[styles.activeText, { color: item.is_active ? '#2E7D32' : '#E65100' }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.propName}>{item.name}</Text>
      {item.temple_name ? (
        <Text style={styles.templeName}>🛕 {item.temple_name}</Text>
      ) : null}
      <Text style={styles.address} numberOfLines={1}>📍 {item.address}{item.city ? `, ${item.city}` : ''}</Text>

      <View style={styles.statsRow}>
        <StatChip icon="albums-outline" label={`${item.room_category_count || 0} categories`} />
        <StatChip icon="checkmark-circle-outline" label={`${item.confirmed_bookings || 0} bookings`} />
        {item.manager_name ? <StatChip icon="person-outline" label={item.manager_name} /> : null}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/admin/property-detail?id=${item.id}` as any)}>
          <Ionicons name="settings-outline" size={14} color={BLUE} />
          <Text style={[styles.actionText, { color: BLUE }]}>Manage</Text>
        </TouchableOpacity>
        {user?.role === 'super_admin' && (
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => {
            Alert.alert('Delete Property', `Delete "${item.name}"? This cannot be undone.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try { await api.delete(`/properties/${item.id}`); await load(); } catch {}
              }},
            ]);
          }}>
            <Ionicons name="trash-outline" size={14} color="#E53935" />
            <Text style={[styles.actionText, { color: '#E53935' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Accommodation</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>{properties.length} properties registered</Text>
      </LinearGradient>

      <FlatList
        data={properties}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        renderItem={renderProp}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bed-outline" size={56} color={theme.colors.border} />
            <Text style={styles.emptyText}>No properties yet</Text>
            <Text style={styles.emptySub}>Tap + to add a hotel, dharamshala or guesthouse</Text>
          </View>
        }
      />

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Property</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormInput label="Property Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Grand Temple Hotel" />
              <FormLabel label="Type" />
              <View style={styles.typeRow}>
                {['hotel', 'dharamshala', 'guesthouse', 'lodge'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                    onPress={() => setForm({ ...form, type: t })}
                  >
                    <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <FormLabel label="Temple (optional)" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.typeChip, !form.temple_id && styles.typeChipActive]}
                    onPress={() => setForm({ ...form, temple_id: '' })}
                  >
                    <Text style={[styles.typeChipText, !form.temple_id && styles.typeChipTextActive]}>None</Text>
                  </TouchableOpacity>
                  {temples.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.typeChip, form.temple_id === t.id && styles.typeChipActive]}
                      onPress={() => setForm({ ...form, temple_id: t.id })}
                    >
                      <Text style={[styles.typeChipText, form.temple_id === t.id && styles.typeChipTextActive]}>{t.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <FormInput label="Address *" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} placeholder="Street, Area" />
              <FormInput label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} placeholder="Tirupati" />
              <FormInput label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+91 98765 43210" />
              <FormInput label="Description *" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Describe the property..." multiline />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-in Time" value={form.check_in_time} onChangeText={(v) => setForm({ ...form, check_in_time: v })} placeholder="12:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-out Time" value={form.check_out_time} onChangeText={(v) => setForm({ ...form, check_out_time: v })} placeholder="11:00" />
                </View>
              </View>
              <FormInput label="Total Rooms" value={form.total_rooms} onChangeText={(v) => setForm({ ...form, total_rooms: v })} placeholder="50" keyboardType="numeric" />
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitText}>Create Property</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={12} color={theme.colors.textMuted} />
      <Text style={styles.statChipText}>{label}</Text>
    </View>
  );
}

function FormLabel({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>;
}

function FormInput({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholderTextColor={theme.colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 8, paddingBottom: 22, paddingHorizontal: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 11, fontWeight: '700' },
  propName: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  templeName: { fontSize: 13, color: '#E67E22', fontWeight: '600', marginBottom: 3 },
  address: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 12 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statChipText: { fontSize: 11, color: theme.colors.textMuted },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: BLUE + '12' },
  deleteBtn: { backgroundColor: '#FFEBEE' },
  actionText: { fontSize: 13, fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: theme.colors.text, fontWeight: '700', fontSize: 17, marginTop: 16 },
  emptySub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.text,
    backgroundColor: '#FAFAFA',
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.border },
  typeChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  typeChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  typeChipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
