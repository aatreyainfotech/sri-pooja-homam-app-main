import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import StatTile from '../../src/components/ui/StatTile';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

const BLUE = '#0288D1';
const HOTEL_GRADIENT: [string, string, string] = ['#4A2C2A', '#0277BD', BLUE];

export default function HotelManagerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>({ property: null, stats: {} });
  const [refreshing, setRefreshing] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    setUpdateMsg(null);
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
      setUpdateMsg({ type: 'success', text: 'Property information saved successfully.' });
    } catch (e: any) {
      setUpdateMsg({ type: 'error', text: e?.response?.data?.detail || 'Update failed. Please try again.' });
    }
  };

  const prop = data.property;
  const stats = data.stats || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Hotel Manager"
        subtitle={prop ? prop.name : 'No property assigned yet'}
        gradientColors={HOTEL_GRADIENT}
        onBack={() => router.push('/(tabs)/profile' as any)}
      />

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40, alignItems: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        <ResponsiveContainer maxWidth={900}>
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
                <StatTile label="Total Bookings" value={stats.total_bookings || 0} icon="receipt" color="#E67E22" />
                <StatTile label="Confirmed" value={stats.confirmed_bookings || 0} icon="checkmark-circle" color={theme.statusColors.success.text} />
                <StatTile label="Revenue" value={`₹${parseFloat(stats.revenue || 0).toFixed(0)}`} icon="cash" color={BLUE} />
                <StatTile label="Room Types" value={stats.room_categories || 0} icon="albums" color="#7B1FA2" />
              </View>

              {/* Status */}
              {!prop.is_active && (
                <View style={styles.inactiveBanner}>
                  <Ionicons name="warning-outline" size={18} color={theme.statusColors.warning.text} />
                  <Text style={styles.inactiveBannerText}>
                    Property is <Text style={{ fontWeight: '800' }}>inactive</Text>. Contact super admin to activate.
                  </Text>
                </View>
              )}

              {/* Property Info */}
              <Surface elevation="sm" padding="md" radius="lg" style={{ marginBottom: theme.spacing.sm + 4 }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Hotel Info</Text>
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
              </Surface>

              {/* Quick Actions */}
              <Text style={styles.actionsTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <ActionTile icon="calendar-outline" label="Manage Bookings" color="#E67E22" onPress={() => router.push('/hotel-manager/bookings' as any)} />
                <ActionTile icon="today-outline" label="Set Room Quota" color={theme.colors.primary} onPress={() => router.push('/hotel-manager/quota' as any)} />
              </View>
            </>
          )}
        </ResponsiveContainer>
      </ScrollView>

      {/* Success toast on main screen */}
      {!!updateMsg && updateMsg.type === 'success' && !showEditInfo && (
        <View style={[styles.toast, { backgroundColor: theme.statusColors.success.text }]}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.toastText}>{updateMsg.text}</Text>
          <TouchableOpacity onPress={() => setUpdateMsg(null)}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Info Modal */}
      <Modal visible={showEditInfo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Hotel Info</Text>
              <TouchableOpacity onPress={() => { setShowEditInfo(false); setUpdateMsg(null); }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {!!updateMsg && updateMsg.type === 'error' && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
                  <Text style={{ color: theme.colors.danger, fontSize: 13, flex: 1 }}>{updateMsg.text}</Text>
                </View>
              )}
              <Input label="Hotel Name" value={editForm.name || ''} onChangeText={(v: string) => setEditForm({ ...editForm, name: v })} />
              <Input label="Address" value={editForm.address || ''} onChangeText={(v: string) => setEditForm({ ...editForm, address: v })} />
              <Input label="City" value={editForm.city || ''} onChangeText={(v: string) => setEditForm({ ...editForm, city: v })} />
              <Input label="Phone" value={editForm.phone || ''} onChangeText={(v: string) => setEditForm({ ...editForm, phone: v })} />
              <Input label="Description" value={editForm.description || ''} onChangeText={(v: string) => setEditForm({ ...editForm, description: v })} multiline />
              <Input label="Amenities" value={editForm.amenities || ''} onChangeText={(v: string) => setEditForm({ ...editForm, amenities: v })} placeholder="WiFi, Parking, Restaurant..." />
              <Input label="UPI ID (for guest payments)" value={editForm.upi_id || ''} onChangeText={(v: string) => setEditForm({ ...editForm, upi_id: v })} placeholder="name@upi or 9876543210@okaxis" />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm + 4 }}>
                <View style={{ flex: 1 }}><Input label="Check-in" value={editForm.check_in_time || ''} onChangeText={(v: string) => setEditForm({ ...editForm, check_in_time: v })} /></View>
                <View style={{ flex: 1 }}><Input label="Check-out" value={editForm.check_out_time || ''} onChangeText={(v: string) => setEditForm({ ...editForm, check_out_time: v })} /></View>
              </View>
              <Button title="Save Changes" variant="secondary" size="lg" fullWidth onPress={handleUpdateInfo} style={{ backgroundColor: BLUE, marginBottom: theme.spacing.lg }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ActionTile({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Surface elevation="sm" padding="md" radius="lg" style={[styles.actionTile, { borderLeftColor: color }]}>
        <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </Surface>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  noProp: { alignItems: 'center', marginTop: 80, padding: 24 },
  noPropTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginTop: 20 },
  noPropSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm + 4, marginBottom: theme.spacing.md },

  inactiveBanner: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 2, backgroundColor: theme.statusColors.warning.bg, padding: theme.spacing.sm + 6, borderRadius: theme.radius.md, marginBottom: theme.spacing.sm + 4, borderWidth: 1, borderColor: '#FFE0B2' },
  inactiveBannerText: { flex: 1, fontSize: 13, color: theme.statusColors.warning.text },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm + 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text, textTransform: 'uppercase', letterSpacing: 0.8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BLUE + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.full },
  editBtnText: { fontSize: 12, fontWeight: '600', color: BLUE },

  actionsTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: theme.spacing.sm + 2, marginTop: 4 },
  actionsGrid: { gap: theme.spacing.sm + 4 },
  actionTile: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md - 2, borderLeftWidth: 4 },
  actionIcon: { width: 46, height: 46, borderRadius: theme.radius.sm + 6, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },

  errorBox: { backgroundColor: theme.statusColors.danger.bg, borderRadius: theme.radius.sm + 4, padding: theme.spacing.sm + 4, marginBottom: theme.spacing.sm + 6, flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },

  toast: { position: 'absolute', bottom: 24, left: 16, right: 16, borderRadius: theme.radius.sm + 8, padding: theme.spacing.sm + 6, flexDirection: 'row', gap: theme.spacing.sm + 2, alignItems: 'center', zIndex: 999 },
  toastText: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.colors.white, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, padding: theme.spacing.lg, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg - 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
});
