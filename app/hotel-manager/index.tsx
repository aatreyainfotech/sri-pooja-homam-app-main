import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

const BLUE = '#0288D1';

export default function HotelManagerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>({ property: null, stats: {} });
  const [refreshing, setRefreshing] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const load = useCallback(async () => {
    try {
      const res = await api.get('/hotel-manager/dashboard');
      setData(res.data);
      if (res.data.property) setEditForm(res.data.property);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleUpdateInfo = async () => {
    try {
      await api.put(`/properties/${data.property.id}`, {
        name: editForm.name, type: editForm.type || 'hotel',
        address: editForm.address, city: editForm.city,
        phone: editForm.phone, description: editForm.description,
        images: editForm.images || '', amenities: editForm.amenities || '',
        check_in_time: editForm.check_in_time, check_out_time: editForm.check_out_time,
        total_rooms: parseInt(editForm.total_rooms) || 0,
        upi_id: editForm.upi_id || '',
      });
      setShowEditInfo(false);
      await load();
      Alert.alert('Updated', 'Property information saved.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Update failed');
    }
  };

  const prop = data.property;
  const stats = data.stats || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hotel Manager</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>
          {prop ? prop.name : 'No property assigned yet'}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {!prop ? (
          <View style={styles.noProp}>
            <Ionicons name="bed-outline" size={60} color={theme.colors.border} />
            <Text style={styles.noPropTitle}>No Property Assigned</Text>
            <Text style={styles.noPropSub}>Contact your super admin to assign a property to your account.</Text>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard label="Total Bookings" value={stats.total_bookings || 0} icon="receipt" color="#E67E22" />
              <StatCard label="Confirmed" value={stats.confirmed_bookings || 0} icon="checkmark-circle" color="#2E7D32" />
              <StatCard label="Revenue" value={`₹${parseFloat(stats.revenue || 0).toFixed(0)}`} icon="cash" color={BLUE} />
              <StatCard label="Room Types" value={stats.room_categories || 0} icon="albums" color="#7B1FA2" />
            </View>

            {/* Status */}
            {!prop.is_active && (
              <View style={styles.inactiveBanner}>
                <Ionicons name="warning-outline" size={18} color="#FF9800" />
                <Text style={styles.inactiveBannerText}>
                  Property is <Text style={{ fontWeight: '800' }}>inactive</Text>. Contact super admin to activate.
                </Text>
              </View>
            )}

            {/* Property Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Property Details</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditInfo(true)}>
                  <Ionicons name="pencil-outline" size={14} color={BLUE} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <InfoRow icon="bed-outline" text={`Type: ${prop.type || 'hotel'}`} />
              <InfoRow icon="location-outline" text={`${prop.address}${prop.city ? `, ${prop.city}` : ''}`} />
              {prop.phone ? <InfoRow icon="call-outline" text={prop.phone} /> : null}
              {prop.temple_name ? <InfoRow icon="business-outline" text={`Near ${prop.temple_name}`} /> : null}
              <InfoRow icon="time-outline" text={`Check-in: ${prop.check_in_time} | Check-out: ${prop.check_out_time}`} />
            </View>

            {/* Quick Actions */}
            <Text style={styles.actionsTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <ActionTile icon="calendar-outline" label="Manage Bookings" color="#E67E22" onPress={() => router.push('/hotel-manager/bookings' as any)} />
              <ActionTile icon="albums-outline" label="Room Categories" color={BLUE} onPress={() => router.push(`/admin/property-detail?id=${prop.id}` as any)} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Info Modal */}
      <Modal visible={showEditInfo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Property</Text>
              <TouchableOpacity onPress={() => setShowEditInfo(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormInput label="Property Name" value={editForm.name || ''} onChangeText={(v: string) => setEditForm({ ...editForm, name: v })} />
              <FormInput label="Address" value={editForm.address || ''} onChangeText={(v: string) => setEditForm({ ...editForm, address: v })} />
              <FormInput label="City" value={editForm.city || ''} onChangeText={(v: string) => setEditForm({ ...editForm, city: v })} />
              <FormInput label="Phone" value={editForm.phone || ''} onChangeText={(v: string) => setEditForm({ ...editForm, phone: v })} />
              <FormInput label="Description" value={editForm.description || ''} onChangeText={(v: string) => setEditForm({ ...editForm, description: v })} multiline />
              <FormInput label="Amenities" value={editForm.amenities || ''} onChangeText={(v: string) => setEditForm({ ...editForm, amenities: v })} placeholder="WiFi, Parking, Restaurant..." />
              <FormInput label="UPI ID (for guest payments)" value={editForm.upi_id || ''} onChangeText={(v: string) => setEditForm({ ...editForm, upi_id: v })} placeholder="name@upi or 9876543210@okaxis" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><FormInput label="Check-in" value={editForm.check_in_time || ''} onChangeText={(v: string) => setEditForm({ ...editForm, check_in_time: v })} /></View>
                <View style={{ flex: 1 }}><FormInput label="Check-out" value={editForm.check_out_time || ''} onChangeText={(v: string) => setEditForm({ ...editForm, check_out_time: v })} /></View>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateInfo}>
                <Text style={styles.submitText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionTile({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.actionTile, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
}

function InfoRow({ icon, text }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Ionicons name={icon} size={14} color={theme.colors.textMuted} />
      <Text style={{ fontSize: 13, color: theme.colors.text, flex: 1 }}>{text}</Text>
    </View>
  );
}

function FormInput({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>
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
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 4 },

  noProp: { alignItems: 'center', marginTop: 80, padding: 24 },
  noPropTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginTop: 20 },
  noPropSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'flex-start' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  inactiveBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF3E0', padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#FFE0B2' },
  inactiveBannerText: { flex: 1, fontSize: 13, color: '#E65100' },

  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text, textTransform: 'uppercase', letterSpacing: 0.8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BLUE + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: BLUE },

  actionsTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  actionsGrid: { gap: 12 },
  actionTile: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, borderLeftWidth: 4 },
  actionIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },

  inputLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.text, backgroundColor: '#FAFAFA' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  submitBtn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
