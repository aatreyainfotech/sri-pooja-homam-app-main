import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ScrollView, Platform, Image,
  type TextInputProps,
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
const IS_WEB = Platform.OS === 'web';

// ── Web file picker helper ─────────────────────────────────────────────────
function pickMultipleImagesWeb(): Promise<string[]> {
  return new Promise((resolve) => {
    if (!IS_WEB) { resolve([]); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files: File[] = Array.from(e.target?.files || []);
      const results: string[] = [];
      for (const file of files) {
        await new Promise<void>((res) => {
          const reader = new FileReader();
          reader.onload = () => { results.push(reader.result as string); res(); };
          reader.readAsDataURL(file);
        });
      }
      resolve(results);
    };
    input.click();
  });
}

// ── Temple Dropdown ────────────────────────────────────────────────────────
function TempleDropdown({ temples, value, onChange }: { temples: any[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = temples.find((t) => t.id === value);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>Temple (Optional)</Text>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Ionicons name="business-outline" size={16} color={selected ? '#E67E22' : theme.colors.textMuted} />
          <Text style={[styles.dropdownBtnText, { color: selected ? theme.colors.text : theme.colors.textMuted }]}>
            {selected ? selected.name : 'Select a temple (optional)'}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          <TouchableOpacity
            style={[styles.dropdownItem, !value && styles.dropdownItemActive]}
            onPress={() => { onChange(''); setOpen(false); }}
          >
            <Ionicons name="close-circle-outline" size={16} color={theme.colors.textMuted} />
            <Text style={[styles.dropdownItemText, !value && styles.dropdownItemTextActive]}>None</Text>
          </TouchableOpacity>
          {temples.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.dropdownItem, value === t.id && styles.dropdownItemActive]}
              onPress={() => { onChange(t.id); setOpen(false); }}
            >
              <Ionicons name="business" size={16} color={value === t.id ? '#fff' : '#E67E22'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dropdownItemText, value === t.id && styles.dropdownItemTextActive]} numberOfLines={1}>
                  {t.name}
                </Text>
                {t.location ? (
                  <Text style={[styles.dropdownItemSub, value === t.id && { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={1}>
                    {t.location}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Image Picker Row ───────────────────────────────────────────────────────
function ImagePickerSection({
  label, images, onAdd, onRemove, onUrlAdd,
}: {
  label: string;
  images: string[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUrlAdd: (url: string) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imgPreview}>
              <Image source={{ uri: img }} style={styles.imgPreviewImg} resizeMode="cover" />
              <TouchableOpacity style={styles.imgRemoveBtn} onPress={() => onRemove(idx)}>
                <Ionicons name="close-circle" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))}
          {IS_WEB && (
            <TouchableOpacity style={styles.imgAddBtn} onPress={onAdd}>
              <Ionicons name="camera-outline" size={24} color={BLUE} />
              <Text style={styles.imgAddText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {/* URL input as alternative */}
      <View style={styles.urlRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Or paste image URL…"
          placeholderTextColor={theme.colors.textMuted}
          value={urlInput}
          onChangeText={setUrlInput}
        />
        <TouchableOpacity
          style={styles.urlAddBtn}
          onPress={() => {
            if (urlInput.trim()) { onUrlAdd(urlInput.trim()); setUrlInput(''); }
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {images.length > 0 && (
        <Text style={styles.imgCount}>{images.length} photo(s) added</Text>
      )}
    </View>
  );
}

export default function AdminProperties() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [temples, setTemples] = useState<any[]>([]);
  const [propImages, setPropImages] = useState<string[]>([]);
  const [managerForm, setManagerForm] = useState({ full_name: '', mobile: '', email: '', password: '' });
  const [form, setForm] = useState({
    name: '', type: 'hotel', temple_id: '', address: '', city: '',
    phone: '', description: '', amenities: '', upi_id: '',
    check_in_time: '12:00', check_out_time: '11:00',
    total_rooms: '0',
  });

  const load = useCallback(async () => {
    // Split calls so temple loading doesn't depend on properties success
    try {
      const pRes = await api.get('/admin/properties');
      setProperties(pRes.data);
    } catch {}
    try {
      const tRes = await api.get('/temples');
      setTemples(tRes.data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => {
    setForm({ name: '', type: 'hotel', temple_id: '', address: '', city: '', phone: '', description: '', amenities: '', upi_id: '', check_in_time: '12:00', check_out_time: '11:00', total_rooms: '0' });
    setPropImages([]);
  };

  const addPropImages = async () => {
    const imgs = await pickMultipleImagesWeb();
    if (imgs.length) setPropImages((prev) => [...prev, ...imgs]);
  };

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
        images: propImages.join(','),
      });
      setShowCreate(false);
      resetForm();
      await load();
      Alert.alert('Created', 'Property created. Go to property detail to add room categories, then activate it.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create property');
    }
  };

  const handleCreateManager = async () => {
    const { full_name, mobile, email, password } = managerForm;
    if (!full_name.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'All fields are required.');
      return;
    }
    try {
      await api.post('/admin/create-hotel-manager', { full_name, mobile, email, password });
      setShowAddManager(false);
      setManagerForm({ full_name: '', mobile: '', email: '', password: '' });
      Alert.alert('Hotel Manager Created', `Account created for ${full_name}.\nMobile: ${mobile}\nThey can now log in and be assigned to a property.`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create hotel manager account');
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

  const renderProp = ({ item }: any) => {
    const coverImg = item.images ? item.images.split(',')[0]?.trim() : null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/admin/property-detail?id=${item.id}` as any)}
        activeOpacity={0.85}
      >
        {/* Cover image */}
        {coverImg ? (
          <Image source={{ uri: coverImg }} style={styles.cardCover} resizeMode="cover" />
        ) : (
          <View style={[styles.cardCover, styles.cardCoverPlaceholder]}>
            <Ionicons name="bed-outline" size={32} color={BLUE + '60'} />
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.typeBadge, { backgroundColor: BLUE + '15' }]}>
              <Ionicons name="bed" size={12} color={BLUE} />
              <Text style={[styles.typeText, { color: BLUE }]}>{(item.type || 'hotel').toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              style={[styles.activeBadge, { backgroundColor: item.is_active ? '#E8F5E9' : '#FFF3E0' }]}
              onPress={() => toggleActivate(item)}
            >
              <View style={[styles.activeDot, { backgroundColor: item.is_active ? '#4CAF50' : '#FF9800' }]} />
              <Text style={[styles.activeText, { color: item.is_active ? '#2E7D32' : '#E65100' }]}>
                {item.is_active ? 'Active' : 'Tap to Activate'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.propName}>{item.name}</Text>
          {item.temple_name ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <Ionicons name="business-outline" size={12} color="#E67E22" />
              <Text style={styles.templeName}>{item.temple_name}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 }}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textMuted} />
            <Text style={styles.address} numberOfLines={1}>{item.address}{item.city ? `, ${item.city}` : ''}</Text>
          </View>

          <View style={styles.statsRow}>
            <StatChip icon="albums-outline" label={`${item.room_category_count || 0} room types`} />
            <StatChip icon="checkmark-circle-outline" label={`${item.confirmed_bookings || 0} bookings`} />
            {item.manager_name ? <StatChip icon="person-outline" label={item.manager_name} /> : null}
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/admin/property-detail?id=${item.id}` as any)}>
              <Ionicons name="settings-outline" size={14} color={BLUE} />
              <Text style={[styles.actionText, { color: BLUE }]}>Manage Rooms & Quotas</Text>
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
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Accommodation</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddManager(true)}>
              <Ionicons name="person-add-outline" size={19} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSub}>{properties.length} properties · tap 👤+ to add hotel manager</Text>
      </LinearGradient>

      <FlatList
        data={properties}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
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

      {/* ── Create Property Modal ── */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Property</Text>
              <TouchableOpacity onPress={() => { setShowCreate(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Property Name */}
              <FormInput
                label="Property Name *"
                value={form.name}
                onChangeText={(v: string) => setForm({ ...form, name: v })}
                placeholder="Grand Temple Hotel"
              />

              {/* Type chips */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {[
                  { val: 'hotel', icon: 'bed', label: 'Hotel' },
                  { val: 'dharamshala', icon: 'home', label: 'Dharamshala' },
                  { val: 'guesthouse', icon: 'business', label: 'Guesthouse' },
                  { val: 'lodge', icon: 'storefront', label: 'Lodge' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.val}
                    style={[styles.typeChip, form.type === t.val && styles.typeChipActive]}
                    onPress={() => setForm({ ...form, type: t.val })}
                  >
                    <Ionicons name={t.icon as any} size={14} color={form.type === t.val ? '#fff' : theme.colors.textMuted} />
                    <Text style={[styles.typeChipText, form.type === t.val && styles.typeChipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Temple Dropdown */}
              <TempleDropdown
                temples={temples}
                value={form.temple_id}
                onChange={(id) => setForm({ ...form, temple_id: id })}
              />

              {/* Address & City */}
              <FormInput
                label="Address *"
                value={form.address}
                onChangeText={(v: string) => setForm({ ...form, address: v })}
                placeholder="123 Temple Road, Near Main Gate"
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="City" value={form.city} onChangeText={(v: string) => setForm({ ...form, city: v })} placeholder="Tirupati" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Phone" value={form.phone} onChangeText={(v: string) => setForm({ ...form, phone: v })} placeholder="+91 98765 43210" />
                </View>
              </View>

              {/* Description */}
              <FormInput
                label="Description *"
                value={form.description}
                onChangeText={(v: string) => setForm({ ...form, description: v })}
                placeholder="Describe the property, facilities, distance from temple…"
                multiline
              />

              {/* Amenities */}
              <FormInput
                label="Amenities"
                value={form.amenities}
                onChangeText={(v: string) => setForm({ ...form, amenities: v })}
                placeholder="AC, WiFi, Hot Water, Parking, Restaurant, Laundry…"
              />

              {/* UPI ID */}
              <FormInput
                label="UPI ID (for guest payments)"
                value={form.upi_id}
                onChangeText={(v) => setForm({ ...form, upi_id: v })}
                placeholder="yourname@upi or 9876543210@okaxis"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Check-in / Check-out / Total Rooms */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-in Time" value={form.check_in_time} onChangeText={(v: string) => setForm({ ...form, check_in_time: v })} placeholder="12:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-out Time" value={form.check_out_time} onChangeText={(v: string) => setForm({ ...form, check_out_time: v })} placeholder="11:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Total Rooms" value={form.total_rooms} onChangeText={(v: string) => setForm({ ...form, total_rooms: v })} keyboardType="numeric" />
                </View>
              </View>

              {/* Property Photos */}
              <ImagePickerSection
                label="Property Photos"
                images={propImages}
                onAdd={addPropImages}
                onRemove={(idx) => setPropImages((prev) => prev.filter((_, i) => i !== idx))}
                onUrlAdd={(url) => setPropImages((prev) => [...prev, url])}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>Create Property</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Add Hotel Manager Modal ── */}
      <Modal visible={showAddManager} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Hotel Manager</Text>
                <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                  Creates a login account with hotel_manager role
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowAddManager(false);
                setManagerForm({ full_name: '', mobile: '', email: '', password: '' });
              }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <FormInput
                label="Full Name *"
                value={managerForm.full_name}
                onChangeText={(v) => setManagerForm({ ...managerForm, full_name: v })}
                placeholder="Ramesh Kumar"
              />
              <FormInput
                label="Mobile Number *"
                value={managerForm.mobile}
                onChangeText={(v) => setManagerForm({ ...managerForm, mobile: v })}
                placeholder="9876543210"
                keyboardType="phone-pad"
              />
              <FormInput
                label="Email *"
                value={managerForm.email}
                onChangeText={(v) => setManagerForm({ ...managerForm, email: v })}
                placeholder="manager@hotel.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormInput
                label="Password *"
                value={managerForm.password}
                onChangeText={(v) => setManagerForm({ ...managerForm, password: v })}
                placeholder="Set a strong password"
                secureTextEntry
              />
              <View style={styles.managerInfoBox}>
                <Ionicons name="information-circle-outline" size={18} color={BLUE} />
                <Text style={styles.managerInfoText}>
                  After creating the account, go to a Property → Assign Manager to link them to a property.
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateManager}>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>Create Hotel Manager Account</Text>
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
      <Ionicons name={icon} size={11} color={theme.colors.textMuted} />
      <Text style={styles.statChipText}>{label}</Text>
    </View>
  );
}

function FormInput({ label, multiline, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }, style as any]}
        placeholderTextColor={theme.colors.textMuted}
        multiline={multiline}
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

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  cardCover: { width: '100%', height: 140 },
  cardCoverPlaceholder: { backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 11, fontWeight: '700' },
  propName: { fontSize: 17, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  templeName: { fontSize: 13, color: '#E67E22', fontWeight: '600' },
  address: { fontSize: 12, color: theme.colors.textMuted, flex: 1 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statChipText: { fontSize: 11, color: theme.colors.textMuted },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, alignItems: 'center' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: BLUE + '12' },
  deleteBtn: { flex: 0, backgroundColor: '#FFEBEE', paddingHorizontal: 10 },
  actionText: { fontSize: 13, fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: theme.colors.text, fontWeight: '700', fontSize: 17, marginTop: 16 },
  emptySub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },

  // Form
  label: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.text,
    backgroundColor: '#FAFAFA',
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: '#FAFAFA' },
  typeChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  typeChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  typeChipTextActive: { color: '#fff' },

  // Temple dropdown
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  dropdownBtnText: { fontSize: 14, flex: 1 },
  dropdownList: {
    borderWidth: 1.5, borderColor: BLUE + '40', borderRadius: 12,
    backgroundColor: '#fff', marginBottom: 14, overflow: 'hidden',
    maxHeight: 220,
    ...(IS_WEB ? { boxShadow: '0 4px 20px rgba(2,136,209,0.15)' } as any : {
      shadowColor: BLUE, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
    }),
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: { backgroundColor: BLUE },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  dropdownItemTextActive: { color: '#fff' },
  dropdownItemSub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 1 },

  // Images
  imgPreview: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: theme.colors.border },
  imgPreviewImg: { width: 90, height: 90 },
  imgRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderRadius: 10 },
  imgAddBtn: {
    width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: BLUE + '60',
    alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE + '08', gap: 4,
  },
  imgAddText: { color: BLUE, fontSize: 11, fontWeight: '700' },
  urlRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  urlAddBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  imgCount: { fontSize: 11, color: theme.colors.textMuted, marginTop: 5 },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, marginTop: 8, marginBottom: 20 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  managerInfoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  managerInfoText: { flex: 1, fontSize: 13, color: '#0277BD', lineHeight: 20 },
});
