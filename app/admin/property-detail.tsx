import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, type TextInputProps, Modal, RefreshControl, Platform, Image,
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
const IS_WEB = Platform.OS === 'web';

function pickMultipleImagesWeb(): Promise<string[]> {
  return new Promise((resolve) => {
    if (!IS_WEB) { resolve([]); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    // Must be in the DOM for the click to fire reliably in all browsers
    input.style.cssText = 'position:fixed;top:-200px;left:-200px;opacity:0;pointer-events:none;';
    document.body.appendChild(input);
    const cleanup = () => { try { document.body.removeChild(input); } catch {} };
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
      cleanup();
      resolve(results);
    };
    // Resolve empty if user cancels without selecting
    window.addEventListener('focus', function onFocus() {
      setTimeout(() => {
        window.removeEventListener('focus', onFocus);
        if (!input.files?.length) { cleanup(); resolve([]); }
      }, 500);
    }, { once: true });
    input.click();
  });
}

// ── Manager Dropdown ───────────────────────────────────────────────────────
function ManagerDropdown({ managers, value, onChange }: { managers: any[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = managers.find((m) => m.id === value);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>Select Manager</Text>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Ionicons name="person-outline" size={16} color={selected ? BLUE : theme.colors.textMuted} />
          <Text style={[styles.dropdownBtnText, { color: selected ? theme.colors.text : theme.colors.textMuted }]}>
            {selected ? selected.full_name : 'Choose a hotel manager…'}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          {managers.length === 0 ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>No hotel managers found. Assign hotel_manager role to a user first.</Text>
            </View>
          ) : managers.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.dropdownItem, value === m.id && styles.dropdownItemActive]}
              onPress={() => { onChange(m.id); setOpen(false); }}
            >
              <Ionicons name="person" size={16} color={value === m.id ? '#fff' : BLUE} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dropdownItemText, value === m.id && styles.dropdownItemTextActive]} numberOfLines={1}>
                  {m.full_name}
                </Text>
                {m.email ? (
                  <Text style={[styles.dropdownItemSub, value === m.id && { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={1}>
                    {m.email}
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

// ── Thumbnail with error fallback ─────────────────────────────────────────
function ThumbnailImage({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={{ width: 90, height: 90, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Ionicons name="image-outline" size={26} color="#BDBDBD" />
        <Text style={{ fontSize: 9, color: '#BDBDBD', textAlign: 'center' }}>Broken{'\n'}URL</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: 90, height: 90 }}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

// ── Image Picker Section ───────────────────────────────────────────────────
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
              <ThumbnailImage uri={img} />
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
          onPress={() => { if (urlInput.trim()) { onUrlAdd(urlInput.trim()); setUrlInput(''); } }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {images.length > 0 && (
        <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 5 }}>{images.length} photo(s) added</Text>
      )}
    </View>
  );
}

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
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [quotaForm, setQuotaForm] = useState({ from_date: '', to_date: '', quota: '10' });
  const [quotaMsg, setQuotaMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [managerId, setManagerId] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', type: 'hotel', address: '', city: '', phone: '',
    description: '', amenities: '', check_in_time: '12:00',
    check_out_time: '11:00', total_rooms: '0', upi_id: '',
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [catError, setCatError] = useState('');
  const [managerMsg, setManagerMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

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
      const p = pRes.data;
      setEditForm({
        name: p.name || '', type: p.type || 'hotel', address: p.address || '',
        city: p.city || '', phone: p.phone || '', description: p.description || '',
        amenities: p.amenities || '', check_in_time: p.check_in_time || '12:00',
        check_out_time: p.check_out_time || '11:00',
        total_rooms: String(p.total_rooms || '0'), upi_id: p.upi_id || '',
      });
      setEditImages(p.images ? p.images.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
    } catch {}
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetCatForm = () => {
    setCatForm({ name: '', description: '', price_per_night: '', capacity: '2', total_rooms: '10', amenities: '' });
    setRoomImages([]);
  };

  const handleAddCategory = async () => {
    setCatError('');
    if (!catForm.name.trim() || !catForm.price_per_night) {
      setCatError('Category name and price are required.'); return;
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
        images: roomImages.join(','),
      });
      setShowAddCat(false);
      resetCatForm();
      await load();
    } catch (e: any) {
      setCatError(e?.response?.data?.detail || 'Failed to add room category');
    }
  };

  const handleSetQuota = async () => {
    setQuotaMsg(null);
    if (!selectedCat || !quotaForm.from_date || !quotaForm.to_date) {
      setQuotaMsg({ type: 'error', text: 'Select a date range.' });
      return;
    }
    const dates: string[] = [];
    let cur = new Date(quotaForm.from_date);
    const end = new Date(quotaForm.to_date);
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    if (dates.length > 90) { setQuotaMsg({ type: 'error', text: 'Max 90 days at once.' }); return; }
    setQuotaLoading(true);
    try {
      await api.post('/quotas/set', {
        room_category_id: selectedCat.id,
        dates,
        quota: parseInt(quotaForm.quota) || 0,
      });
      setQuotaMsg({ type: 'success', text: `Quota set for ${dates.length} day(s) — ${parseInt(quotaForm.quota)} rooms/night` });
    } catch (e: any) {
      setQuotaMsg({ type: 'error', text: e?.response?.data?.detail || 'Failed to set quota' });
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleAssignManager = async () => {
    setManagerMsg(null);
    if (!managerId) return;
    try {
      await api.put(`/properties/${id}/manager`, { manager_id: managerId });
      setManagerMsg({ type: 'success', text: 'Manager assigned successfully.' });
      await load();
    } catch (e: any) {
      setManagerMsg({ type: 'error', text: e?.response?.data?.detail || 'Failed to assign manager' });
    }
  };

  const handleEditProperty = async () => {
    setEditError(''); setEditSuccess('');
    if (!editForm.name.trim() || !editForm.address.trim()) {
      setEditError('Name and address are required.'); return;
    }
    setEditLoading(true);
    try {
      await api.put(`/properties/${id}`, {
        name: editForm.name,
        type: editForm.type,
        address: editForm.address,
        city: editForm.city,
        phone: editForm.phone,
        description: editForm.description,
        amenities: editForm.amenities,
        check_in_time: editForm.check_in_time,
        check_out_time: editForm.check_out_time,
        total_rooms: parseInt(editForm.total_rooms) || 0,
        upi_id: editForm.upi_id,
        images: editImages.join(','),
      });
      setEditSuccess('Property updated successfully!');
      await load();
    } catch (e: any) {
      setEditError(e?.response?.data?.detail || 'Failed to update property.');
    } finally {
      setEditLoading(false);
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

  const coverImg = prop.images ? prop.images.split(',')[0]?.trim() : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{prop.name}</Text>
          <TouchableOpacity onPress={() => { setEditError(''); setEditSuccess(''); setShowEdit(true); }} style={styles.editHeaderBtn}>
            <Ionicons name="pencil" size={17} color="#fff" />
          </TouchableOpacity>
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
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {/* Cover image */}
        {coverImg ? (
          <Image source={{ uri: coverImg }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <View style={[styles.coverImg, styles.coverImgPlaceholder]}>
            <Ionicons name="bed-outline" size={40} color={BLUE + '50'} />
            <Text style={{ color: BLUE + '80', fontSize: 12, marginTop: 6 }}>No photos added</Text>
          </View>
        )}

        <View style={{ padding: 16 }}>
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
              <View style={styles.currentManagerRow}>
                <Ionicons name="person-circle-outline" size={20} color={prop.manager_name ? BLUE : theme.colors.textMuted} />
                <Text style={styles.currentManager}>
                  {prop.manager_name ? prop.manager_name : 'No manager assigned yet'}
                </Text>
              </View>
              <ManagerDropdown
                managers={managers}
                value={managerId}
                onChange={setManagerId}
              />
              {!!managerMsg && (
                <View style={{ backgroundColor: managerMsg.type === 'success' ? '#E8F5E9' : '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                  <Ionicons name={managerMsg.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={16} color={managerMsg.type === 'success' ? '#2E7D32' : '#C62828'} />
                  <Text style={{ color: managerMsg.type === 'success' ? '#2E7D32' : '#C62828', fontSize: 13, flex: 1 }}>{managerMsg.text}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.assignBtn} onPress={handleAssignManager}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
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
              <View style={styles.emptyBox}>
                <Ionicons name="bed-outline" size={36} color={theme.colors.border} />
                <Text style={styles.emptyLabel}>No room categories yet</Text>
                <Text style={styles.emptySub}>Add categories (Deluxe, Standard, etc.) to enable bookings</Text>
              </View>
            ) : (
              categories.map((cat) => {
                const catCover = cat.images ? cat.images.split(',')[0]?.trim() : null;
                return (
                  <View key={cat.id} style={styles.catCard}>
                    {catCover ? (
                      <Image source={{ uri: catCover }} style={styles.catCover} resizeMode="cover" />
                    ) : null}
                    <View style={styles.catBody}>
                      <View style={styles.catTop}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.catPrice}>₹{parseFloat(cat.price_per_night).toFixed(0)}/night</Text>
                      </View>
                      <Text style={styles.catMetaText}>
                        <Ionicons name="people-outline" size={12} /> {cat.capacity} guests  ·  <Ionicons name="bed-outline" size={12} /> {cat.total_rooms} rooms
                      </Text>
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
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Add Category Modal ── */}
      <Modal visible={showAddCat} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Room Category</Text>
              <TouchableOpacity onPress={() => { setShowAddCat(false); resetCatForm(); setCatError(''); }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!!catError && (
                <View style={{ backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8 }}>
                  <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
                  <Text style={{ color: '#C62828', fontSize: 13, flex: 1 }}>{catError}</Text>
                </View>
              )}
              <FormInput label="Category Name *" value={catForm.name} onChangeText={(v) => setCatForm({ ...catForm, name: v })} placeholder="Deluxe Room" />
              <FormInput label="Price per Night (₹) *" value={catForm.price_per_night} onChangeText={(v) => setCatForm({ ...catForm, price_per_night: v })} placeholder="1500" keyboardType="numeric" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Capacity (guests)" value={catForm.capacity} onChangeText={(v) => setCatForm({ ...catForm, capacity: v })} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Total Rooms" value={catForm.total_rooms} onChangeText={(v) => setCatForm({ ...catForm, total_rooms: v })} keyboardType="numeric" />
                </View>
              </View>
              <FormInput label="Description" value={catForm.description} onChangeText={(v) => setCatForm({ ...catForm, description: v })} placeholder="Spacious room with AC, TV…" multiline />
              <FormInput label="Amenities" value={catForm.amenities} onChangeText={(v) => setCatForm({ ...catForm, amenities: v })} placeholder="AC, TV, Hot Water, Parking" />

              {/* Room Photos */}
              <ImagePickerSection
                label="Room Photos"
                images={roomImages}
                onAdd={async () => {
                  const imgs = await pickMultipleImagesWeb();
                  if (imgs.length) setRoomImages((prev) => [...prev, ...imgs]);
                }}
                onRemove={(idx) => setRoomImages((prev) => prev.filter((_, i) => i !== idx))}
                onUrlAdd={(url) => setRoomImages((prev) => [...prev, url])}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>Add Room Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit Property Modal ── */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '95%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Property</Text>
                <Text style={{ fontSize: 12, color: BLUE, fontWeight: '600', marginTop: 2 }}>{prop?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!!editError && (
                <View style={{ backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8 }}>
                  <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
                  <Text style={{ color: '#C62828', fontSize: 13, flex: 1 }}>{editError}</Text>
                </View>
              )}
              {!!editSuccess && (
                <View style={{ backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8 }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#2E7D32" />
                  <Text style={{ color: '#2E7D32', fontSize: 13, flex: 1 }}>{editSuccess}</Text>
                </View>
              )}

              <FormInput label="Hotel Name *" value={editForm.name} onChangeText={(v) => setEditForm({ ...editForm, name: v })} placeholder="e.g. Grand Hotel Kashi" />

              <View style={{ marginBottom: 14 }}>
                <Text style={styles.label}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['hotel', 'dharamshala', 'guesthouse', 'lodge'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setEditForm({ ...editForm, type: t })}
                      style={[styles.typeChip, editForm.type === t && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipText, editForm.type === t && styles.typeChipTextActive]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <FormInput label="Address *" value={editForm.address} onChangeText={(v) => setEditForm({ ...editForm, address: v })} placeholder="123, Temple Road" />
              <FormInput label="City" value={editForm.city} onChangeText={(v) => setEditForm({ ...editForm, city: v })} placeholder="Varanasi" />
              <FormInput label="Phone" value={editForm.phone} onChangeText={(v) => setEditForm({ ...editForm, phone: v })} placeholder="+91 98765 43210" keyboardType="phone-pad" />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-in Time" value={editForm.check_in_time} onChangeText={(v) => setEditForm({ ...editForm, check_in_time: v })} placeholder="12:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-out Time" value={editForm.check_out_time} onChangeText={(v) => setEditForm({ ...editForm, check_out_time: v })} placeholder="11:00" />
                </View>
              </View>

              <FormInput label="Total Rooms" value={editForm.total_rooms} onChangeText={(v) => setEditForm({ ...editForm, total_rooms: v })} placeholder="50" keyboardType="numeric" />
              <FormInput label="Description" value={editForm.description} onChangeText={(v) => setEditForm({ ...editForm, description: v })} placeholder="Describe the property…" multiline />
              <FormInput label="Amenities (comma-separated)" value={editForm.amenities} onChangeText={(v) => setEditForm({ ...editForm, amenities: v })} placeholder="WiFi, Parking, AC, Restaurant" />
              <FormInput label="UPI ID (for payments)" value={editForm.upi_id} onChangeText={(v) => setEditForm({ ...editForm, upi_id: v })} placeholder="hotel@upi" />

              <ImagePickerSection
                label="Property Photos"
                images={editImages}
                onAdd={async () => {
                  const imgs = await pickMultipleImagesWeb();
                  if (imgs.length) setEditImages((prev) => [...prev, ...imgs]);
                }}
                onRemove={(idx) => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                onUrlAdd={(url) => setEditImages((prev) => [...prev, url])}
              />

              <TouchableOpacity
                style={[styles.submitBtn, editLoading && { opacity: 0.6 }]}
                onPress={handleEditProperty}
                disabled={editLoading}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>{editLoading ? 'Saving…' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Set Quota Modal ── */}
      <Modal visible={showQuota} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Set Room Quota</Text>
                <Text style={{ fontSize: 13, color: BLUE, fontWeight: '600' }}>{selectedCat?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowQuota(false); setQuotaMsg(null); }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {!!quotaMsg && (
              <View style={{
                backgroundColor: quotaMsg.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                borderRadius: 10, padding: 12, marginBottom: 14,
                flexDirection: 'row', gap: 8, alignItems: 'flex-start',
              }}>
                <Ionicons
                  name={quotaMsg.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                  size={18}
                  color={quotaMsg.type === 'success' ? '#2E7D32' : '#C62828'}
                />
                <Text style={{ color: quotaMsg.type === 'success' ? '#2E7D32' : '#C62828', fontSize: 13, flex: 1 }}>
                  {quotaMsg.text}
                </Text>
              </View>
            )}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.inputLabel}>From Date</Text>
              {IS_WEB ? (
                <input
                  type="date"
                  value={quotaForm.from_date}
                  onChange={(e) => setQuotaForm({ ...quotaForm, from_date: e.target.value })}
                  style={{ border: '1.5px solid #E0D5C5', borderRadius: 12, padding: '11px 14px', fontSize: 15, color: '#3D1C02', backgroundColor: '#FAFAFA', width: '100%', boxSizing: 'border-box' } as any}
                />
              ) : (
                <TextInput style={styles.input} value={quotaForm.from_date} onChangeText={(v) => setQuotaForm({ ...quotaForm, from_date: v })} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
              )}
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.inputLabel}>To Date</Text>
              {IS_WEB ? (
                <input
                  type="date"
                  value={quotaForm.to_date}
                  onChange={(e) => setQuotaForm({ ...quotaForm, to_date: e.target.value })}
                  style={{ border: '1.5px solid #E0D5C5', borderRadius: 12, padding: '11px 14px', fontSize: 15, color: '#3D1C02', backgroundColor: '#FAFAFA', width: '100%', boxSizing: 'border-box' } as any}
                />
              ) : (
                <TextInput style={styles.input} value={quotaForm.to_date} onChangeText={(v) => setQuotaForm({ ...quotaForm, to_date: v })} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
              )}
            </View>
            <FormInput label="Rooms Available per Night" value={quotaForm.quota} onChangeText={(v) => setQuotaForm({ ...quotaForm, quota: v })} placeholder="10" keyboardType="numeric" />
            <TouchableOpacity style={[styles.submitBtn, quotaLoading && { opacity: 0.6 }]} onPress={handleSetQuota} disabled={quotaLoading}>
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={styles.submitText}>{quotaLoading ? 'Saving...' : 'Apply Quota'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Ionicons name={icon} size={15} color={theme.colors.textMuted} />
      <Text style={{ fontSize: 13, color: theme.colors.text, flex: 1 }}>{text}</Text>
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.textMuted, fontSize: 15 },
  header: { paddingTop: 8, paddingBottom: 18, paddingHorizontal: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  coverImg: { width: '100%', height: 180 },
  coverImgPlaceholder: { backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },

  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  desc: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 20, marginTop: 8 },

  currentManagerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  currentManager: { fontSize: 13, color: theme.colors.text, fontWeight: '600' },

  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyLabel: { color: theme.colors.text, fontWeight: '700', fontSize: 14, marginTop: 10 },
  emptySub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },

  catCard: { backgroundColor: '#F8FBFF', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: `${BLUE}22`, overflow: 'hidden' },
  catCover: { width: '100%', height: 120 },
  catBody: { padding: 14 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  catPrice: { fontSize: 14, fontWeight: '800', color: BLUE },
  catMetaText: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 },
  catDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  catActions: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'space-between', alignItems: 'center' },
  quotaBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: BLUE + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  quotaBtnText: { fontSize: 13, fontWeight: '600', color: BLUE },
  deleteCatBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },

  addCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BLUE + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  addCatText: { fontSize: 13, fontWeight: '600', color: BLUE },

  label: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.text, backgroundColor: '#FAFAFA' },

  // Dropdown
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA', marginBottom: 4,
  },
  dropdownBtnText: { fontSize: 14, flex: 1 },
  dropdownList: {
    borderWidth: 1.5, borderColor: BLUE + '40', borderRadius: 12,
    backgroundColor: '#fff', marginBottom: 14, overflow: 'hidden', maxHeight: 200,
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

  editHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: '#F5F7FA' },
  typeChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  typeChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  typeChipTextActive: { color: '#fff' },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 12 },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, marginTop: 4, marginBottom: 20 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
