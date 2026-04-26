import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator,
  Modal, Pressable, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';

export default function Profile() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const doLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive',
          onPress: confirmLogout,
        },
      ]);
    }
  };

  const pickFromLibrary = async () => {
    setShowPicker(false);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]?.base64) {
        await uploadPhoto(res.assets[0].base64);
      }
    } catch (e) {
      Alert.alert('Error', apiError(e));
    }
  };

  const takePhoto = async () => {
    setShowPicker(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]?.base64) {
        await uploadPhoto(res.assets[0].base64);
      }
    } catch (e) {
      Alert.alert('Error', apiError(e));
    }
  };

  const uploadPhoto = async (base64: string) => {
    try {
      setUploading(true);
      const photo = `data:image/jpeg;base64,${base64}`;
      const { data } = await api.put('/users/me/photo', { photo });
      setUser(data);
    } catch (e: any) {
      Alert.alert('Upload failed', apiError(e));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setShowPicker(false);
    try {
      setUploading(true);
      await api.delete('/users/me/photo');
      if (user) setUser({ ...user, photo_url: null });
    } catch (e) {
      Alert.alert('Error', apiError(e));
    } finally {
      setUploading(false);
    }
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
          <TouchableOpacity
            testID="profile-avatar-btn"
            activeOpacity={0.8}
            onPress={() => setShowPicker(true)}
            style={styles.avatarWrap}
            disabled={uploading}
          >
            {user?.photo_url ? (
              <Image source={{ uri: user.photo_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.full_name || 'D').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {uploading ? (
              <View style={styles.editBadgeLoading}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={16} color="#8B1515" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.mobile}>+91 {user?.mobile}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={12} color={theme.colors.secondary} />
            <Text style={styles.roleText}>{user?.role?.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {isAdmin && (
          <TouchableOpacity
            testID="profile-admin-btn"
            activeOpacity={0.9}
            onPress={() => router.push('/admin')}
            style={styles.adminCard}
          >
            <LinearGradient colors={['#D4AF37', '#AA8721']} style={styles.adminGrad}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.adminTitle}>Admin Panel</Text>
                <Text style={styles.adminSub}>Manage temples, poojas, users & more</Text>
              </View>
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          <InfoRow icon="home-outline" label="Address" value={user?.address} />
          <InfoRow icon="location-outline" label="City" value={`${user?.city}, ${user?.pincode}`} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <MenuItem icon="receipt-outline" label="My Bookings" onPress={() => router.push('/(tabs)/bookings')} testID="profile-bookings-btn" />
          <MenuItem icon="notifications-outline" label="Notification Settings" onPress={() => router.push('/notification-settings')} testID="profile-notif-settings-btn" />
          <MenuItem icon="business-outline" label="Browse Temples" onPress={() => router.push('/(tabs)/temples')} testID="profile-temples-btn" />
          <MenuItem icon="radio-outline" label="Live Streams" onPress={() => router.push('/(tabs)/live')} testID="profile-live-btn" />
          <MenuItem icon="calendar-outline" label="Panchangam Calendar" onPress={() => router.push('/(tabs)/calendar')} testID="profile-calendar-btn" />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => Alert.alert('Support', 'Email: support@aatreya.org')} testID="profile-help-btn" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => router.push('/legal/privacy-policy')} testID="profile-privacy-btn" />
          <MenuItem icon="shield-checkmark-outline" label="Terms of Service" onPress={() => router.push('/legal/terms')} testID="profile-terms-btn" />
          <MenuItem icon="card-outline" label="Refund Policy" onPress={() => router.push('/legal/refund')} testID="profile-refund-btn" />
        </View>

        <TouchableOpacity testID="profile-logout-btn" style={styles.logoutBtn} onPress={doLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>🙏 Sri Pooja Homam v1.0{'\n'}Developed by Aatreya Infotech</Text>
      </ScrollView>

      {/* Photo picker bottom sheet */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.sheetBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.sheetBtnText}>Take Photo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.sheetBtn} onPress={pickFromLibrary} testID="profile-photo-library">
              <Ionicons name="image-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.sheetBtnText}>Choose from Library</Text>
            </TouchableOpacity>
            {user?.photo_url && (
              <TouchableOpacity style={[styles.sheetBtn, styles.sheetBtnDanger]} onPress={removePhoto} testID="profile-photo-remove">
                <Ionicons name="trash-outline" size={22} color={theme.colors.danger} />
                <Text style={[styles.sheetBtnText, { color: theme.colors.danger }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPicker(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout confirmation modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.logoutModal} onPress={() => {}}>
            <Ionicons name="log-out-outline" size={36} color={theme.colors.danger} />
            <Text style={styles.logoutModalTitle}>Sign Out</Text>
            <Text style={styles.logoutModalMsg}>Are you sure you want to sign out?</Text>
            <View style={styles.logoutModalBtns}>
              <TouchableOpacity style={styles.logoutModalCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.logoutModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutModalConfirm} onPress={confirmLogout}>
                <Text style={styles.logoutModalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoVal}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function MenuItem({ icon, label, onPress, testID }: any) {
  return (
    <TouchableOpacity testID={testID} activeOpacity={0.7} onPress={onPress} style={styles.menuItem}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    alignItems: 'center', paddingTop: 20, paddingBottom: 30,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  avatarImg: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: '#fff', backgroundColor: '#eee',
  },
  avatarText: { color: theme.colors.primary, fontSize: 40, fontWeight: '800' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  editBadgeLoading: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 12 },
  mobile: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
    backgroundColor: 'rgba(212,175,55,0.2)', borderWidth: 1, borderColor: theme.colors.secondary,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
  },
  roleText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  adminCard: { marginHorizontal: 20, marginTop: 18, borderRadius: 20, overflow: 'hidden' },
  adminGrad: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  adminTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  adminSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },

  section: { marginTop: 22, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8,
  },
  infoLabel: { fontSize: 11, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  infoVal: { fontSize: 14, color: theme.colors.text, marginTop: 2, fontWeight: '600' },

  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8,
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text },

  logoutBtn: {
    marginTop: 24, marginHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14,
    backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2',
  },
  logoutText: { color: theme.colors.danger, fontWeight: '700', fontSize: 14 },

  footer: { textAlign: 'center', marginTop: 30, color: theme.colors.textMuted, fontSize: 12, lineHeight: 20 },

  // Photo picker sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20, paddingHorizontal: 16, paddingTop: 10 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', alignSelf: 'center', borderRadius: 2, marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12, textAlign: 'center' },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8,
  },
  sheetBtnDanger: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' },
  sheetBtnText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  sheetCancel: { marginTop: 6, paddingVertical: 12, alignItems: 'center' },
  sheetCancelText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },

  // Logout modal
  logoutModal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28, marginHorizontal: 40,
    alignItems: 'center', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  logoutModalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginTop: 12 },
  logoutModalMsg: { fontSize: 14, color: theme.colors.textMuted, marginTop: 6, textAlign: 'center' },
  logoutModalBtns: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  logoutModalCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: theme.colors.border,
  },
  logoutModalCancelText: { fontWeight: '700', fontSize: 14, color: theme.colors.text },
  logoutModalConfirm: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: theme.colors.danger,
  },
  logoutModalConfirmText: { fontWeight: '700', fontSize: 14, color: '#fff' },
});
