import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Modal, ScrollView, Platform, Image,
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

const BLUE = '#7A3020';   // brand maroon accent (was blue #0288D1)
const IS_WEB = Platform.OS === 'web';

function parseImages(s: string | null | undefined): string[] {
  if (!s) return [];
  if (s.includes('|||')) return s.split('|||').map(v => v.trim()).filter(Boolean);
  if (s.startsWith('data:')) return [s.trim()];
  return s.split(',').map(v => v.trim()).filter(Boolean);
}

// Resize + compress image to max 1200px at 70% JPEG quality
function compressImage(file: File, maxPx = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new (window as any).Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          const ratio = Math.min(maxPx / width, maxPx / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
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

// ── Image Picker Section ───────────────────────────────────────────────────
function ImagePickerSection({
  label, images, onAdd, onRemove, onUrlAdd,
}: {
  label: string;
  images: string[];
  onAdd: (uris: string[]) => void;
  onRemove: (idx: number) => void;
  onUrlAdd: (url: string) => void;
}) {
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = async (e: any) => {
    const files: File[] = Array.from(e.target?.files || []);
    if (!files.length) return;
    const results: string[] = [];
    for (const file of files) {
      const compressed = await compressImage(file);
      results.push(compressed);
    }
    onAdd(results);
    e.target.value = '';
  };

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
          {IS_WEB ? (
            <View style={styles.imgAddBtn}>
              {/* @ts-ignore */}
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%', height: '100%', gap: 6 }}>
                {/* @ts-ignore */}
                <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                <Ionicons name="camera-outline" size={24} color={BLUE} />
                <Text style={styles.imgAddText}>Upload</Text>
              </label>
            </View>
          ) : null}
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
  const [managerError, setManagerError] = useState('');
  const [managerSuccess, setManagerSuccess] = useState('');
  const [managerLoading, setManagerLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [mainMsg, setMainMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmActivate, setConfirmActivate] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'hotel', temple_id: '', address: '', city: '',
    phone: '', description: '', amenities: '', upi_id: '',
    check_in_time: '12:00', check_out_time: '11:00', total_rooms: '0',
  });

  const load = useCallback(async () => {
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
    setCreateError('');
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!form.name.trim() || !form.description.trim() || !form.address.trim()) {
      setCreateError('Hotel name, address and description are required.');
      return;
    }
    setCreateLoading(true);
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
      setMainMsg({ type: 'success', text: 'Property created! Open it to add room categories, then activate it.' });
    } catch (e: any) {
      setCreateError(e?.response?.data?.detail || 'Failed to create property. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateManager = async () => {
    const { full_name, mobile, email, password } = managerForm;
    setManagerError('');
    setManagerSuccess('');
    if (!full_name.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      setManagerError('All fields are required.');
      return;
    }
    setManagerLoading(true);
    try {
      await api.post('/admin/create-hotel-manager', { full_name, mobile, email, password });
      setManagerSuccess(`Account created for ${full_name} (${mobile}). They can now log in.`);
      setManagerForm({ full_name: '', mobile: '', email: '', password: '' });
    } catch (e: any) {
      setManagerError(e?.response?.data?.detail || 'Failed to create hotel manager account');
    } finally {
      setManagerLoading(false);
    }
  };

  const toggleActivate = (prop: any) => {
    if (user?.role !== 'super_admin') {
      setMainMsg({ type: 'error', text: 'Only super admins can activate or deactivate properties.' });
      return;
    }
    setConfirmActivate(prop);
  };

  const doToggleActivate = async () => {
    if (!confirmActivate) return;
    setActionLoading(true);
    const newState = !confirmActivate.is_active;
    try {
      await api.put(`/properties/${confirmActivate.id}/activate`, { is_active: newState });
      await load();
      setMainMsg({ type: 'success', text: `"${confirmActivate.name}" ${newState ? 'activated' : 'deactivated'}.` });
    } catch {
      setMainMsg({ type: 'error', text: 'Failed to update property status. Try again.' });
    } finally {
      setActionLoading(false);
      setConfirmActivate(null);
    }
  };

  const doDeleteProp = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/properties/${confirmDelete.id}`);
      await load();
      setMainMsg({ type: 'success', text: `"${confirmDelete.name}" deleted.` });
    } catch {
      setMainMsg({ type: 'error', text: 'Failed to delete property.' });
    } finally {
      setActionLoading(false);
      setConfirmDelete(null);
    }
  };

  const renderProp = ({ item }: any) => {
    const coverImg = parseImages(item.images)[0] || null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/admin/property-detail?id=${item.id}` as any)}
        activeOpacity={0.85}
      >
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
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => setConfirmDelete(item)}>
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
      <LinearGradient colors={['#3D1408', '#7A3020', '#9A4130']} style={styles.header}>
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
        <Text style={styles.headerSub}>{properties.length} properties · person+ icon adds hotel manager</Text>
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

      {/* Main screen toast */}
      {!!mainMsg && (
        <View style={[styles.toast, { backgroundColor: mainMsg.type === 'success' ? '#2E7D32' : '#C62828' }]}>
          <Ionicons name={mainMsg.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={20} color="#fff" />
          <Text style={styles.toastText}>{mainMsg.text}</Text>
          <TouchableOpacity onPress={() => setMainMsg(null)}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      )}

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
              {!!createError && (
                <View style={styles.inlineBanner}>
                  <Ionicons name="alert-circle-outline" size={18} color="#C62828" />
                  <Text style={styles.inlineBannerText}>{createError}</Text>
                </View>
              )}

              <FormInput label="Hotel Name *" value={form.name} onChangeText={(v: string) => setForm({ ...form, name: v })} placeholder="Grand Temple Hotel" />

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

              <TempleDropdown temples={temples} value={form.temple_id} onChange={(id) => setForm({ ...form, temple_id: id })} />

              <FormInput label="Address *" value={form.address} onChangeText={(v: string) => setForm({ ...form, address: v })} placeholder="123 Temple Road, Near Main Gate" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="City" value={form.city} onChangeText={(v: string) => setForm({ ...form, city: v })} placeholder="Tirupati" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Phone" value={form.phone} onChangeText={(v: string) => setForm({ ...form, phone: v })} placeholder="+91 98765 43210" />
                </View>
              </View>

              <FormInput label="Description *" value={form.description} onChangeText={(v: string) => setForm({ ...form, description: v })} placeholder="Describe the property, facilities, distance from temple…" multiline />
              <FormInput label="Amenities" value={form.amenities} onChangeText={(v: string) => setForm({ ...form, amenities: v })} placeholder="AC, WiFi, Hot Water, Parking, Restaurant…" />
              <FormInput label="UPI ID (for guest payments)" value={form.upi_id} onChangeText={(v) => setForm({ ...form, upi_id: v })} placeholder="yourname@upi or 9876543210@okaxis" keyboardType="email-address" autoCapitalize="none" />

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

              <ImagePickerSection
                label="Hotel Photos"
                images={propImages}
                onAdd={(uris) => { if (uris.length) setPropImages((prev) => [...prev, ...uris]); }}
                onRemove={(idx) => setPropImages((prev) => prev.filter((_, i) => i !== idx))}
                onUrlAdd={(url) => setPropImages((prev) => [...prev, url])}
              />

              <TouchableOpacity style={[styles.submitBtn, createLoading && { opacity: 0.6 }]} onPress={handleCreate} disabled={createLoading}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>{createLoading ? 'Creating...' : 'Create Property'}</Text>
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
                setManagerError(''); setManagerSuccess('');
              }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!!managerError && (
                <View style={styles.inlineBanner}>
                  <Ionicons name="alert-circle-outline" size={18} color="#C62828" />
                  <Text style={styles.inlineBannerText}>{managerError}</Text>
                </View>
              )}
              {!!managerSuccess && (
                <View style={[styles.inlineBanner, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" />
                  <Text style={[styles.inlineBannerText, { color: '#2E7D32' }]}>{managerSuccess}</Text>
                </View>
              )}
              <FormInput label="Full Name *" value={managerForm.full_name} onChangeText={(v) => setManagerForm({ ...managerForm, full_name: v })} placeholder="Ramesh Kumar" />
              <FormInput label="Mobile Number *" value={managerForm.mobile} onChangeText={(v) => setManagerForm({ ...managerForm, mobile: v })} placeholder="9876543210" keyboardType="phone-pad" />
              <FormInput label="Email *" value={managerForm.email} onChangeText={(v) => setManagerForm({ ...managerForm, email: v })} placeholder="manager@hotel.com" keyboardType="email-address" autoCapitalize="none" />
              <FormInput label="Password *" value={managerForm.password} onChangeText={(v) => setManagerForm({ ...managerForm, password: v })} placeholder="Set a strong password" secureTextEntry />
              <View style={styles.managerInfoBox}>
                <Ionicons name="information-circle-outline" size={18} color={BLUE} />
                <Text style={styles.managerInfoText}>
                  After creating the account, go to a Property → Assign Manager to link them to a property.
                </Text>
              </View>
              <TouchableOpacity style={[styles.submitBtn, managerLoading && { opacity: 0.6 }]} onPress={handleCreateManager} disabled={managerLoading}>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>{managerLoading ? 'Creating...' : 'Create Hotel Manager Account'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Activate / Deactivate ── */}
      <Modal visible={!!confirmActivate} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Ionicons
              name={confirmActivate?.is_active ? 'pause-circle-outline' : 'checkmark-circle-outline'}
              size={44}
              color={confirmActivate?.is_active ? '#FF9800' : '#2E7D32'}
              style={{ marginBottom: 14 }}
            />
            <Text style={styles.confirmTitle}>
              {confirmActivate?.is_active ? 'Deactivate Property?' : 'Activate Property?'}
            </Text>
            <Text style={styles.confirmSub}>
              {confirmActivate?.is_active
                ? `"${confirmActivate?.name}" will be hidden from guests.`
                : `"${confirmActivate?.name}" will become visible to guests for booking.`}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmActivate(null)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmAction, { backgroundColor: confirmActivate?.is_active ? '#FF9800' : '#2E7D32' }]}
                onPress={doToggleActivate}
                disabled={actionLoading}
              >
                <Text style={styles.confirmActionText}>{actionLoading ? 'Updating…' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Delete ── */}
      <Modal visible={!!confirmDelete} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Ionicons name="trash-outline" size={44} color="#E53935" style={{ marginBottom: 14 }} />
            <Text style={styles.confirmTitle}>Delete Property?</Text>
            <Text style={styles.confirmSub}>
              Delete "{confirmDelete?.name}"? All room categories and bookings will be removed. This cannot be undone.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmDelete(null)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmAction, { backgroundColor: '#E53935' }]} onPress={doDeleteProp} disabled={actionLoading}>
                <Text style={styles.confirmActionText}>{actionLoading ? 'Deleting…' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
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

  toast: { position: 'absolute', bottom: 24, left: 16, right: 16, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', zIndex: 999 },
  toastText: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },

  inlineBanner: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  inlineBannerText: { color: '#C62828', fontSize: 13, flex: 1 },

  label: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.text, backgroundColor: '#FAFAFA' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: '#FAFAFA' },
  typeChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  typeChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  typeChipTextActive: { color: '#fff' },

  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA', marginBottom: 4 },
  dropdownBtnText: { fontSize: 14, flex: 1 },
  dropdownList: {
    borderWidth: 1.5, borderColor: BLUE + '40', borderRadius: 12,
    backgroundColor: '#fff', marginBottom: 14, overflow: 'hidden', maxHeight: 220,
    ...(IS_WEB ? { boxShadow: '0 4px 20px rgba(122,48,32,0.15)' } as any : { shadowColor: BLUE, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 }),
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemActive: { backgroundColor: BLUE },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  dropdownItemTextActive: { color: '#fff' },
  dropdownItemSub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 1 },

  imgPreview: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: theme.colors.border },
  imgPreviewImg: { width: 90, height: 90 },
  imgRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderRadius: 10 },
  imgAddBtn: { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: BLUE + '60', alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE + '08' },
  imgAddText: { color: BLUE, fontSize: 11, fontWeight: '700' },
  urlRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  urlAddBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  imgCount: { fontSize: 11, color: theme.colors.textMuted, marginTop: 5 },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, marginTop: 8, marginBottom: 20 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  managerInfoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FBF3E6', borderRadius: 12, padding: 14, marginBottom: 16 },
  managerInfoText: { flex: 1, fontSize: 13, color: '#7A3020', lineHeight: 20 },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', maxWidth: 360, width: '100%' },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 8, textAlign: 'center' },
  confirmSub: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  confirmBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancel: { flex: 1, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  confirmCancelText: { fontSize: 15, fontWeight: '700', color: theme.colors.textMuted },
  confirmAction: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  confirmActionText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
