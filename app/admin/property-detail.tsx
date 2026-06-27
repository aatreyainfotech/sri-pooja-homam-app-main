import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, Modal, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const BLUE = '#0288D1';

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [prop, setProp] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showQuota, setShowQuota] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', price_per_night: '', capacity: '2', total_rooms: '10', amenities: '' });
  const [quotaForm, setQuotaForm] = useState({ from_date: '', to_date: '', quota: '10' });
  const [managerId, setManagerId] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [pRes, mRes] = await Promise.all([
        api.get(`/properties/${id}`),
        api.get('/admin/hotel-managers'),
      ]);
      setProp(pRes.data);
      setCategories(pRes.data.room_categories || []);
      setManagers(mRes.data);
      setManagerId(pRes.data.manager_id || '');
    } catch {}
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleAddCategory = async () => {
    if (!catForm.name.trim() || !catForm.price_per_night) {
      Alert.alert('Missing Fields', 'Name and price are required.');
      return;
    }
    try {
      await api.post('/room-categories', {
        property_id: id,
        name: catForm.name,
        description: catForm.description,
        price_per_night: parseFloat(catForm.price_per_night) || 0,
        capacity: parseInt(catForm.capacity) || 2,
        total_rooms: parseInt(catForm.total_rooms) || 10,
        amenities: catForm.amenities,
      });
      setShowAddCat(false);
      setCatForm({ name: '', description: '', price_per_night: '', capacity: '2', total_rooms: '10', amenities: '' });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to add room category');
    }
  };

  const handleSetQuota = async () => {
    if (!selectedCat || !quotaForm.from_date || !quotaForm.to_date) {
      Alert.alert('Missing Fields', 'Select a date range.');
      return;
    }
    // Build date list
    const dates: string[] = [];
    let cur = new Date(quotaForm.from_date);
    const end = new Date(quotaForm.to_date);
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    if (dates.length > 90) { Alert.alert('Too many dates', 'Max 90 days at once.'); return; }
    try {
      await api.post('/quotas/set', {
        room_category_id: selectedCat.id,
        dates,
        quota: parseInt(quotaForm.quota) || 0,
      });
      Alert.alert('Done', `Quota set for ${dates.length} days`);
      setShowQuota(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to set quota');
    }
  };

  const handleAssignManager = async () => {
    if (!managerId) return;
    try {
      await api.put(`/properties/${id}/manager`, { manager_id: managerId });
      Alert.alert('Done', 'Manager assigned');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to assign manager');
    }
  };

  const deleteCategory = (cat: any) => {
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/room-categories/${cat.id}`); await load(); } catch {}
      }},
    ]);
  };

  if (!prop) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{prop.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <View style={[styles.statusBadge, { backgroundColor: prop.is_active ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>{prop.is_active ? 'ACTIVE' : 'INACTIVE'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.statusText}>{(prop.type || 'hotel').toUpperCase()}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Info</Text>
          <InfoRow icon="location-outline" text={`${prop.address}${prop.city ? `, ${prop.city}` : ''}`} />
          {prop.phone ? <InfoRow icon="call-outline" text={prop.phone} /> : null}
          {prop.temple_name ? <InfoRow icon="business-outline" text={`Near ${prop.temple_name}`} /> : null}
          <InfoRow icon="time-outline" text={`Check-in: ${prop.check_in_time} | Check-out: ${prop.check_out_time}`} />
          {prop.description ? <Text style={styles.desc}>{prop.description}</Text> : null}
        </View>

        {/* Assign Manager */}
        {user?.role === 'super_admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Manager</Text>
            <Text style={styles.currentManager}>
              Current: {prop.manager_name || 'None assigned'}
            </Text>
            <Text style={styles.label}>Assign Manager</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {managers.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.typeChip, managerId === m.id && styles.typeChipActive]}
                    onPress={() => setManagerId(m.id)}
                  >
                    <Text style={[styles.typeChipText, managerId === m.id && styles.typeChipTextActive]}>
                      {m.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.assignBtn} onPress={handleAssignManager}>
              <Text style={styles.assignBtnText}>Assign Manager</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Room Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Room Categories</Text>
            <TouchableOpacity style={styles.addCatBtn} onPress={() => setShowAddCat(true)}>
              <Ionicons name="add" size={18} color={BLUE} />
              <Text style={styles.addCatText}>Add</Text>
            </TouchableOpacity>
          </View>

          {categories.length === 0 ? (
            <Text style={styles.emptyLabel}>No room categories yet. Add one to allow bookings.</Text>
          ) : (
            categories.map((cat) => (
              <View key={cat.id} style={styles.catCard}>
                <View style={styles.catTop}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catPrice}>₹{parseFloat(cat.price_per_night).toFixed(0)}/night</Text>
                </View>
                <View style={styles.catMeta}>
                  <Text style={styles.catMetaText}>👥 {cat.capacity} guests · 🛏 {cat.total_rooms} rooms</Text>
                </View>
                {cat.description ? <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text> : null}
                <View style={styles.catActions}>
                  <TouchableOpacity
                    style={styles.quotaBtn}
                    onPress={() => { setSelectedCat(cat); setShowQuota(true); }}
                  >
                    <Ionicons name="calendar-outline" size={14} color={BLUE} />
                    <Text style={styles.quotaBtnText}>Set Quota</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteCatBtn} onPress={() => deleteCategory(cat)}>
                    <Ionicons name="trash-outline" size={14} color="#E53935" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showAddCat} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Room Category</Text>
              <TouchableOpacity onPress={() => setShowAddCat(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <FormInput label="Category Name *" value={catForm.name} onChangeText={(v: string) => setCatForm({ ...catForm, name: v })} placeholder="Deluxe Room" />
              <FormInput label="Price per Night (₹) *" value={catForm.price_per_night} onChangeText={(v: string) => setCatForm({ ...catForm, price_per_night: v })} placeholder="1500" keyboardType="numeric" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><FormInput label="Capacity (guests)" value={catForm.capacity} onChangeText={(v: string) => setCatForm({ ...catForm, capacity: v })} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><FormInput label="Total Rooms" value={catForm.total_rooms} onChangeText={(v: string) => setCatForm({ ...catForm, total_rooms: v })} keyboardType="numeric" /></View>
              </View>
              <FormInput label="Description" value={catForm.description} onChangeText={(v: string) => setCatForm({ ...catForm, description: v })} placeholder="Spacious room with AC..." multiline />
              <FormInput label="Amenities" value={catForm.amenities} onChangeText={(v: string) => setCatForm({ ...catForm, amenities: v })} placeholder="AC, TV, Hot Water, Parking" />
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory}>
                <Text style={styles.submitText}>Add Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Set Quota Modal */}
      <Modal visible={showQuota} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Quota — {selectedCat?.name}</Text>
              <TouchableOpacity onPress={() => setShowQuota(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FormInput label="From Date (YYYY-MM-DD)" value={quotaForm.from_date} onChangeText={(v: string) => setQuotaForm({ ...quotaForm, from_date: v })} placeholder="2026-07-01" />
            <FormInput label="To Date (YYYY-MM-DD)" value={quotaForm.to_date} onChangeText={(v: string) => setQuotaForm({ ...quotaForm, to_date: v })} placeholder="2026-07-31" />
            <FormInput label="Rooms Available" value={quotaForm.quota} onChangeText={(v: string) => setQuotaForm({ ...quotaForm, quota: v })} placeholder="10" keyboardType="numeric" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSetQuota}>
              <Text style={styles.submitText}>Set Quota</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, text }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Ionicons name={icon} size={15} color={theme.colors.textMuted} />
      <Text style={{ fontSize: 13, color: theme.colors.text, flex: 1 }}>{text}</Text>
    </View>
  );
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.textMuted, fontSize: 15 },
  header: { paddingTop: 8, paddingBottom: 18, paddingHorizontal: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  desc: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 20, marginTop: 8 },
  currentManager: { fontSize: 13, color: theme.colors.text, marginBottom: 10 },
  emptyLabel: { color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  catCard: { backgroundColor: '#F8FBFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: `${BLUE}22` },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  catPrice: { fontSize: 14, fontWeight: '800', color: BLUE },
  catMeta: { marginBottom: 4 },
  catMetaText: { fontSize: 12, color: theme.colors.textMuted },
  catDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  catActions: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'space-between', alignItems: 'center' },
  quotaBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: BLUE + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  quotaBtnText: { fontSize: 13, fontWeight: '600', color: BLUE },
  deleteCatBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },

  addCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BLUE + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  addCatText: { fontSize: 13, fontWeight: '600', color: BLUE },

  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.text, backgroundColor: '#FAFAFA' },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.border },
  typeChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  typeChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  typeChipTextActive: { color: '#fff' },
  assignBtn: { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  submitBtn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
