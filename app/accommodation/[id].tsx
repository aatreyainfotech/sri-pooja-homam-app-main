import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, Modal, Platform, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const IS_WEB = Platform.OS === 'web';
const BLUE = '#0288D1';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [prop, setProp] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showBook, setShowBook] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [bookForm, setBookForm] = useState({
    check_in: '', check_out: '', guests: '2', rooms: '1',
    guest_name: '', guest_mobile: '', special_requests: '',
  });
  const [booking, setBooking] = useState<any>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/properties/${id}`);
      setProp(res.data);
      setCategories(res.data.room_categories || []);
    } catch {}
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const calcNights = () => {
    if (!bookForm.check_in || !bookForm.check_out) return 0;
    try {
      const ci = new Date(bookForm.check_in);
      const co = new Date(bookForm.check_out);
      return Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000));
    } catch { return 0; }
  };

  const calcAmount = () => {
    if (!selectedCat) return 0;
    return parseFloat(selectedCat.price_per_night) * calcNights() * (parseInt(bookForm.rooms) || 1);
  };

  const handleBook = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to book accommodation.', [
        { text: 'Login', onPress: () => router.push('/(auth)/login' as any) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (!bookForm.check_in || !bookForm.check_out || !bookForm.guest_name || !bookForm.guest_mobile) {
      Alert.alert('Missing Info', 'Fill in all required fields (dates, name, mobile).');
      return;
    }
    if (calcNights() <= 0) {
      Alert.alert('Invalid Dates', 'Check-out must be after check-in.');
      return;
    }
    try {
      const res = await api.post('/accommodation-bookings', {
        property_id: id,
        room_category_id: selectedCat.id,
        check_in: bookForm.check_in,
        check_out: bookForm.check_out,
        guests: parseInt(bookForm.guests) || 1,
        rooms: parseInt(bookForm.rooms) || 1,
        guest_name: bookForm.guest_name,
        guest_mobile: bookForm.guest_mobile,
        special_requests: bookForm.special_requests,
      });
      setBooking(res.data);
      setShowBook(false);
    } catch (e: any) {
      Alert.alert('Booking Failed', e?.response?.data?.detail || 'Could not create booking. Try again.');
    }
  };

  const handlePayment = () => {
    if (!booking) return;
    if (IS_WEB && booking.razorpay_order_id && booking.razorpay_key_id) {
      // Razorpay web checkout
      const options = {
        key: booking.razorpay_key_id,
        amount: Math.round(booking.amount * 100),
        currency: 'INR',
        name: 'Sri Pooja Homam',
        description: `Stay at ${prop?.name}`,
        order_id: booking.razorpay_order_id,
        handler: async (response: any) => {
          try {
            await api.post('/accommodation-bookings/confirm-payment', {
              booking_id: booking.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBooking(null);
            Alert.alert('Booking Confirmed! 🎉', `Your stay at ${prop?.name} is confirmed. We'll WhatsApp you the details.`);
          } catch {
            Alert.alert('Verification Error', 'Payment done but could not confirm. Please contact support.');
          }
        },
        prefill: { name: bookForm.guest_name, contact: bookForm.guest_mobile },
        theme: { color: BLUE },
      };
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Razorpay) {
        // @ts-ignore
        new window.Razorpay(options).open();
      } else {
        Alert.alert('Payment Gateway', 'Opening payment gateway…');
      }
    } else {
      // Fallback: WhatsApp payment intent
      const msg = encodeURIComponent(
        `Hi, I want to pay ₹${booking.amount} for booking at ${prop?.name}.\n` +
        `Booking ID: ${booking.id}\nDates: ${bookForm.check_in} to ${bookForm.check_out}`
      );
      Linking.openURL(`https://wa.me/918309067121?text=${msg}`);
    }
  };

  if (!prop) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View>
    </SafeAreaView>
  );

  const nights = calcNights();
  const amount = calcAmount();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{(prop.type || 'hotel').toUpperCase()}</Text>
            </View>
            <Text style={styles.heroTitle}>{prop.name}</Text>
            {prop.temple_name ? (
              <View style={styles.heroRow}>
                <Ionicons name="business-outline" size={14} color="#FFD54F" />
                <Text style={styles.heroTemple}>{prop.temple_name}</Text>
              </View>
            ) : null}
            <View style={styles.heroRow}>
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroLocation}>{prop.address}{prop.city ? `, ${prop.city}` : ''}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.body, IS_WEB && { maxWidth: 900, alignSelf: 'center', width: '100%' } as any]}>
          {/* Info section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Property</Text>
            {prop.description ? <Text style={styles.desc}>{prop.description}</Text> : null}
            <View style={styles.infoGrid}>
              <InfoItem icon="log-in-outline" label="Check-in" value={prop.check_in_time || '12:00'} />
              <InfoItem icon="log-out-outline" label="Check-out" value={prop.check_out_time || '11:00'} />
              {prop.phone ? <InfoItem icon="call-outline" label="Contact" value={prop.phone} /> : null}
              {prop.total_rooms ? <InfoItem icon="bed-outline" label="Total Rooms" value={`${prop.total_rooms}`} /> : null}
            </View>
            {prop.amenities ? (
              <View style={styles.amenitiesWrap}>
                <Text style={styles.amenitiesLabel}>Amenities</Text>
                <Text style={styles.amenitiesText}>{prop.amenities}</Text>
              </View>
            ) : null}
          </View>

          {/* Room Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Room Types</Text>
            {categories.length === 0 ? (
              <Text style={styles.noCats}>Room details coming soon. Contact property for availability.</Text>
            ) : (
              categories.map((cat) => (
                <View key={cat.id} style={[styles.catCard, selectedCat?.id === cat.id && styles.catCardSelected]}>
                  <View style={styles.catTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catMeta}>👥 {cat.capacity} guests max · 🛏 {cat.total_rooms} rooms</Text>
                      {cat.description ? <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text> : null}
                      {cat.amenities ? <Text style={styles.catAmenities} numberOfLines={1}>✓ {cat.amenities}</Text> : null}
                    </View>
                    <View style={styles.catPriceCol}>
                      <Text style={styles.catPrice}>₹{parseFloat(cat.price_per_night).toFixed(0)}</Text>
                      <Text style={styles.catPerNight}>per night</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.selectBtn, selectedCat?.id === cat.id && styles.selectBtnActive]}
                    onPress={() => {
                      setSelectedCat(cat);
                      setShowBook(true);
                    }}
                  >
                    <Text style={[styles.selectBtnText, selectedCat?.id === cat.id && styles.selectBtnTextActive]}>
                      {selectedCat?.id === cat.id ? 'Selected — Book Now' : 'Select & Book'}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={selectedCat?.id === cat.id ? '#fff' : BLUE} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Booking Sheet */}
      <Modal visible={showBook} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedCat?.name}</Text>
                <Text style={styles.modalSub}>₹{parseFloat(selectedCat?.price_per_night || 0).toFixed(0)}/night</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBook(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-in Date *" value={bookForm.check_in} onChangeText={(v: string) => setBookForm({ ...bookForm, check_in: v })} placeholder="2026-07-15" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Check-out Date *" value={bookForm.check_out} onChangeText={(v: string) => setBookForm({ ...bookForm, check_out: v })} placeholder="2026-07-18" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Guests" value={bookForm.guests} onChangeText={(v: string) => setBookForm({ ...bookForm, guests: v })} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Rooms" value={bookForm.rooms} onChangeText={(v: string) => setBookForm({ ...bookForm, rooms: v })} keyboardType="numeric" />
                </View>
              </View>
              <FormInput label="Your Name *" value={bookForm.guest_name} onChangeText={(v: string) => setBookForm({ ...bookForm, guest_name: v })} placeholder="Rama Rao" />
              <FormInput label="Mobile Number *" value={bookForm.guest_mobile} onChangeText={(v: string) => setBookForm({ ...bookForm, guest_mobile: v })} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              <FormInput label="Special Requests (optional)" value={bookForm.special_requests} onChangeText={(v: string) => setBookForm({ ...bookForm, special_requests: v })} placeholder="Vegetarian meals, ground floor..." multiline />

              {/* Price Summary */}
              {calcNights() > 0 && (
                <View style={styles.priceSummary}>
                  <View style={styles.priceLine}>
                    <Text style={styles.priceLabel}>₹{parseFloat(selectedCat?.price_per_night || 0).toFixed(0)} × {calcNights()} nights × {parseInt(bookForm.rooms) || 1} room(s)</Text>
                    <Text style={styles.priceValue}>₹{calcAmount().toFixed(0)}</Text>
                  </View>
                  <View style={[styles.priceLine, styles.priceTotal]}>
                    <Text style={styles.priceTotalLabel}>Total</Text>
                    <Text style={styles.priceTotalValue}>₹{calcAmount().toFixed(0)}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.bookBtnText}>Confirm Booking</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Confirmation Sheet */}
      {booking && (
        <Modal visible={!!booking} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <LinearGradient colors={['#E3F2FD', '#fff']} style={styles.paymentHeader}>
                <Ionicons name="checkmark-circle" size={40} color="#2E7D32" />
                <Text style={styles.paymentTitle}>Booking Created!</Text>
                <Text style={styles.paymentSub}>Complete payment to confirm your stay</Text>
              </LinearGradient>
              <View style={{ padding: 20 }}>
                <View style={styles.priceSummary}>
                  <View style={styles.priceLine}>
                    <Text style={styles.priceLabel}>Booking ID</Text>
                    <Text style={styles.priceValue}>{booking.id?.slice(0, 8).toUpperCase()}</Text>
                  </View>
                  <View style={styles.priceLine}>
                    <Text style={styles.priceLabel}>Nights</Text>
                    <Text style={styles.priceValue}>{booking.nights}</Text>
                  </View>
                  <View style={[styles.priceLine, styles.priceTotal]}>
                    <Text style={styles.priceTotalLabel}>Amount to Pay</Text>
                    <Text style={styles.priceTotalValue}>₹{parseFloat(booking.amount || 0).toFixed(0)}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.bookBtn} onPress={handlePayment}>
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={styles.bookBtnText}>Pay Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.laterBtn} onPress={() => {
                  setBooking(null);
                  router.push('/(tabs)' as any);
                }}>
                  <Text style={styles.laterBtnText}>Pay Later (via WhatsApp)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={16} color={BLUE} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function FormInput({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && { height: 72, textAlignVertical: 'top' }]}
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

  hero: { paddingBottom: IS_WEB ? 40 : 24 },
  backBtn: { margin: 16, marginBottom: 8, alignSelf: 'flex-start' },
  heroContent: { paddingHorizontal: IS_WEB ? 48 : 20, paddingBottom: IS_WEB ? 20 : 8 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  typeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: IS_WEB ? 36 : 24, fontWeight: '900', marginBottom: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  heroTemple: { color: '#FFD54F', fontSize: 13, fontWeight: '600' },
  heroLocation: { color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1 },

  body: { padding: IS_WEB ? 32 : 16 },

  section: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
  desc: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 22, marginBottom: 14 },
  noCats: { color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '45%' },
  infoLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { fontSize: 14, color: theme.colors.text, fontWeight: '600' },
  amenitiesWrap: { marginTop: 14 },
  amenitiesLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  amenitiesText: { fontSize: 13, color: theme.colors.text, lineHeight: 20 },

  catCard: { backgroundColor: '#F8FBFF', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: `${BLUE}22` },
  catCardSelected: { borderColor: BLUE, backgroundColor: '#E3F2FD' },
  catTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  catName: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  catMeta: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 },
  catDesc: { fontSize: 12, color: theme.colors.textMuted, lineHeight: 18 },
  catAmenities: { fontSize: 11, color: '#2E7D32', marginTop: 4 },
  catPriceCol: { alignItems: 'flex-end' },
  catPrice: { fontSize: 22, fontWeight: '900', color: BLUE },
  catPerNight: { fontSize: 11, color: theme.colors.textMuted },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: BLUE, borderRadius: 10, paddingVertical: 10,
  },
  selectBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
  selectBtnTextActive: { color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  modalSub: { fontSize: 13, color: BLUE, fontWeight: '600', marginTop: 2 },

  paymentHeader: { alignItems: 'center', padding: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  paymentTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginTop: 10 },
  paymentSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },

  priceSummary: { backgroundColor: '#F8FBFF', borderRadius: 12, padding: 14, marginBottom: 16 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  priceLabel: { fontSize: 13, color: theme.colors.textMuted },
  priceValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  priceTotal: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, marginTop: 4 },
  priceTotalLabel: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  priceTotalValue: { fontSize: 20, fontWeight: '900', color: BLUE },

  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, marginBottom: 10,
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  laterBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 10 },
  laterBtnText: { fontSize: 14, color: theme.colors.textMuted },

  inputLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.text, backgroundColor: '#FAFAFA',
  },
});
