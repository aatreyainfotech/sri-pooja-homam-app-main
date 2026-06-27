import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, type TextInputProps, Modal, Platform, Linking, Image,
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

// ── Stepper component ──────────────────────────────────────────────────────────
function Stepper({ value, min = 1, max = 20, onChange, label }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void; label: string;
}) {
  return (
    <View style={stepStyles.wrap}>
      <Text style={stepStyles.label}>{label}</Text>
      <View style={stepStyles.row}>
        <TouchableOpacity
          style={[stepStyles.btn, value <= min && stepStyles.btnDisabled]}
          onPress={() => value > min && onChange(value - 1)}
          disabled={value <= min}
        >
          <Ionicons name="remove" size={18} color={value <= min ? '#ccc' : BLUE} />
        </TouchableOpacity>
        <Text style={stepStyles.value}>{value}</Text>
        <TouchableOpacity
          style={[stepStyles.btn, value >= max && stepStyles.btnDisabled]}
          onPress={() => value < max && onChange(value + 1)}
          disabled={value >= max}
        >
          <Ionicons name="add" size={18} color={value >= max ? '#ccc' : BLUE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const stepStyles = StyleSheet.create({
  wrap: { flex: 1, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F8FF' },
  btnDisabled: { backgroundColor: '#F5F5F5' },
  value: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: theme.colors.text },
});

// ── Date input ─────────────────────────────────────────────────────────────────
function DateInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      {IS_WEB ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          style={{ border: '1.5px solid #E0D5C5', borderRadius: 12, padding: '11px 14px', fontSize: 15, color: '#3D1C02', backgroundColor: '#FAFAFA', width: '100%', boxSizing: 'border-box' } as any}
        />
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || 'YYYY-MM-DD'}
          placeholderTextColor={theme.colors.textMuted}
        />
      )}
    </View>
  );
}

function FormInput({ label, multiline, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 72, textAlignVertical: 'top' }, style as any]}
        placeholderTextColor={theme.colors.textMuted}
        multiline={multiline}
        {...props}
      />
    </View>
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

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [prop, setProp] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showBook, setShowBook] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [bookForm, setBookForm] = useState({
    check_in: '', check_out: '', guest_name: '', guest_mobile: '', special_requests: '',
  });
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [bookError, setBookError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [bookingDone, setBookingDone] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [payMethod, setPayMethod] = useState<'razorpay' | 'upi'>('razorpay');
  const [payError, setPayError] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);

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
  const calcAmount = () => (selectedCat ? parseFloat(selectedCat.price_per_night) * calcNights() * rooms : 0);

  const handleBook = async () => {
    setBookError('');
    if (!user) {
      setBookError('Please log in to book accommodation.');
      return;
    }
    if (!bookForm.check_in || !bookForm.check_out || !bookForm.guest_name || !bookForm.guest_mobile) {
      setBookError('Fill in all required fields: dates, name, mobile.');
      return;
    }
    if (calcNights() <= 0) {
      setBookError('Check-out date must be after check-in date.');
      return;
    }
    try {
      const res = await api.post('/accommodation-bookings', {
        property_id: id,
        room_category_id: selectedCat.id,
        check_in: bookForm.check_in,
        check_out: bookForm.check_out,
        guests,
        rooms,
        guest_name: bookForm.guest_name,
        guest_mobile: bookForm.guest_mobile,
        special_requests: bookForm.special_requests,
      });
      setBooking(res.data);
      setShowBook(false);
    } catch (e: any) {
      setBookError(e?.response?.data?.detail || 'Could not create booking. Please try again.');
    }
  };

  const handleRazorpayPayment = () => {
    if (!booking) return;
    setPayError('');
    if (IS_WEB && booking.razorpay_order_id && booking.razorpay_key_id) {
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
            setBookingDone(true);
          } catch {
            setPayError('Payment was made but verification failed. Contact support with your booking ID.');
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
        setPayError('Razorpay not loaded. Please use UPI or contact via WhatsApp.');
      }
    } else {
      const msg = encodeURIComponent(
        `Hi, I want to pay ₹${booking.amount} for booking at ${prop?.name}.\n` +
        `Booking ID: ${booking.id}\nDates: ${bookForm.check_in} to ${bookForm.check_out}`
      );
      Linking.openURL(`https://wa.me/918309067121?text=${msg}`);
    }
  };

  const handleUpiPayment = async () => {
    if (!booking) return;
    setPayError('');
    const utr = utrInput.trim();
    if (!utr) { setPayError('Please enter your UPI Transaction Reference (UTR) number.'); return; }
    try {
      await api.post('/accommodation-bookings/upi-payment', { booking_id: booking.id, utr_number: utr });
      setBookingDone(true);
    } catch (e: any) {
      setPayError(e?.response?.data?.detail || 'Failed to submit payment. Try again.');
    }
  };

  if (!prop) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View>
    </SafeAreaView>
  );

  const photos = prop.images ? prop.images.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero / Photo Gallery */}
        <View style={styles.hero}>
          {photos.length > 0 ? (
            <View style={styles.photoGallery}>
              <Image source={{ uri: photos[photoIdx] }} style={styles.heroPhoto} resizeMode="cover" />
              {photos.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.photoNav, styles.photoNavLeft]}
                    onPress={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                  >
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoNav, styles.photoNavRight]}
                    onPress={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.photoDots}>
                    {photos.map((_: any, i: number) => (
                      <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
                    ))}
                  </View>
                  <View style={styles.photoCounter}>
                    <Text style={styles.photoCounterText}>{photoIdx + 1} / {photos.length}</Text>
                  </View>
                </>
              )}
              <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
                locations={[0, 0.3, 0.6, 1]}
                style={styles.heroOverlay}
              />
            </View>
          ) : (
            <LinearGradient colors={['#4A2C2A', '#0277BD', BLUE]} style={styles.heroGradient} />
          )}

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
        </View>

        <View style={[styles.body, IS_WEB && { maxWidth: 960, alignSelf: 'center', width: '100%' } as any]}>
          {/* Property Info */}
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
                <View style={styles.amenitiesChips}>
                  {prop.amenities.split(',').map((a: string, i: number) => (
                    <View key={i} style={styles.amenityChip}>
                      <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                      <Text style={styles.amenityText}>{a.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Room Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Room Types</Text>
            {categories.length === 0 ? (
              <Text style={styles.noCats}>Room details coming soon. Contact property for availability.</Text>
            ) : (
              categories.map((cat) => {
                const catPhoto = cat.images ? cat.images.split(',')[0]?.trim() : null;
                return (
                  <View key={cat.id} style={[styles.catCard, selectedCat?.id === cat.id && styles.catCardSelected]}>
                    <View style={styles.catTop}>
                      {catPhoto ? (
                        <Image source={{ uri: catPhoto }} style={styles.catPhoto} resizeMode="cover" />
                      ) : (
                        <View style={[styles.catPhoto, styles.catPhotoPlaceholder]}>
                          <Ionicons name="bed-outline" size={28} color={BLUE} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <View style={styles.catMetaRow}>
                          <View style={styles.catMetaChip}>
                            <Ionicons name="people-outline" size={12} color={theme.colors.textMuted} />
                            <Text style={styles.catMetaText}>{cat.capacity} guests</Text>
                          </View>
                          <View style={styles.catMetaChip}>
                            <Ionicons name="bed-outline" size={12} color={theme.colors.textMuted} />
                            <Text style={styles.catMetaText}>{cat.total_rooms} rooms</Text>
                          </View>
                        </View>
                        {cat.description ? <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text> : null}
                        {cat.amenities ? (
                          <Text style={styles.catAmenities} numberOfLines={1}>✓ {cat.amenities}</Text>
                        ) : null}
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
                        setBookError('');
                        setShowBook(true);
                      }}
                    >
                      <Text style={[styles.selectBtnText, selectedCat?.id === cat.id && styles.selectBtnTextActive]}>
                        {selectedCat?.id === cat.id ? '✓ Selected — Book Now' : 'Select & Book'}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color={selectedCat?.id === cat.id ? '#fff' : BLUE} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Booking Sheet ─────────────────────────────────────────── */}
      <Modal visible={showBook} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedCat?.name}</Text>
                <Text style={styles.modalSub}>₹{parseFloat(selectedCat?.price_per_night || 0).toFixed(0)}/night · {prop?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBook(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              {!!bookError && (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle-outline" size={18} color="#C62828" />
                  <Text style={styles.inlineErrorText}>{bookError}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <DateInput label="Check-in *" value={bookForm.check_in} onChange={(v) => setBookForm({ ...bookForm, check_in: v })} placeholder="2026-07-15" />
                <DateInput label="Check-out *" value={bookForm.check_out} onChange={(v) => setBookForm({ ...bookForm, check_out: v })} placeholder="2026-07-18" />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Stepper label="Guests" value={guests} min={1} max={selectedCat?.capacity || 10} onChange={setGuests} />
                <Stepper label="Rooms" value={rooms} min={1} max={selectedCat?.total_rooms || 20} onChange={setRooms} />
              </View>

              <FormInput label="Guest Name *" value={bookForm.guest_name} onChangeText={(v: string) => setBookForm({ ...bookForm, guest_name: v })} placeholder="Rama Rao" />
              <FormInput label="Mobile Number *" value={bookForm.guest_mobile} onChangeText={(v: string) => setBookForm({ ...bookForm, guest_mobile: v })} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              <FormInput label="Special Requests (optional)" value={bookForm.special_requests} onChangeText={(v: string) => setBookForm({ ...bookForm, special_requests: v })} placeholder="Vegetarian meals, ground floor, early check-in…" multiline />

              {calcNights() > 0 && (
                <View style={styles.priceSummary}>
                  <View style={styles.priceLine}>
                    <Text style={styles.priceLabel}>Room type</Text>
                    <Text style={styles.priceValue}>{selectedCat?.name}</Text>
                  </View>
                  <View style={styles.priceLine}>
                    <Text style={styles.priceLabel}>₹{parseFloat(selectedCat?.price_per_night || 0).toFixed(0)} × {calcNights()} nights × {rooms} room(s)</Text>
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

      {/* ── Payment Sheet ─────────────────────────────────────────── */}
      {booking && (
        <Modal visible={!!booking} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {bookingDone ? (
                /* Success screen */
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
                  <Text style={styles.successTitle}>Booking Confirmed!</Text>
                  <Text style={styles.successSub}>Your stay at {prop?.name} is booked. We'll WhatsApp you the details.</Text>
                  <View style={styles.priceSummary}>
                    <View style={styles.priceLine}>
                      <Text style={styles.priceLabel}>Booking ID</Text>
                      <Text style={styles.priceValue}>{booking.id?.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.priceLine}>
                      <Text style={styles.priceLabel}>Check-in</Text>
                      <Text style={styles.priceValue}>{bookForm.check_in}</Text>
                    </View>
                    <View style={styles.priceLine}>
                      <Text style={styles.priceLabel}>Check-out</Text>
                      <Text style={styles.priceValue}>{bookForm.check_out}</Text>
                    </View>
                    <View style={[styles.priceLine, styles.priceTotal]}>
                      <Text style={styles.priceTotalLabel}>Amount Paid</Text>
                      <Text style={styles.priceTotalValue}>₹{parseFloat(booking.amount || 0).toFixed(0)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.bookBtn} onPress={() => {
                    setBooking(null); setBookingDone(false); setUtrInput(''); setPayError('');
                    router.push('/(tabs)' as any);
                  }}>
                    <Text style={styles.bookBtnText}>Back to Home</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <LinearGradient colors={['#E3F2FD', '#fff']} style={styles.paymentHeader}>
                    <Ionicons name="checkmark-circle" size={40} color="#2E7D32" />
                    <Text style={styles.paymentTitle}>Booking Created!</Text>
                    <Text style={styles.paymentSub}>Booking ID: {booking.id?.slice(0, 8).toUpperCase()}</Text>
                  </LinearGradient>
                  <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.priceSummary}>
                      <View style={styles.priceLine}>
                        <Text style={styles.priceLabel}>Property</Text>
                        <Text style={[styles.priceValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>{prop?.name}</Text>
                      </View>
                      <View style={styles.priceLine}>
                        <Text style={styles.priceLabel}>Room</Text>
                        <Text style={styles.priceValue}>{selectedCat?.name}</Text>
                      </View>
                      <View style={styles.priceLine}>
                        <Text style={styles.priceLabel}>Dates</Text>
                        <Text style={styles.priceValue}>{bookForm.check_in} → {bookForm.check_out}</Text>
                      </View>
                      <View style={styles.priceLine}>
                        <Text style={styles.priceLabel}>{guests} guest(s) · {rooms} room(s)</Text>
                        <Text style={styles.priceValue}>{calcNights()} night(s)</Text>
                      </View>
                      <View style={[styles.priceLine, styles.priceTotal]}>
                        <Text style={styles.priceTotalLabel}>Amount to Pay</Text>
                        <Text style={styles.priceTotalValue}>₹{parseFloat(booking.amount || 0).toFixed(0)}</Text>
                      </View>
                    </View>

                    {!!payError && (
                      <View style={styles.inlineError}>
                        <Ionicons name="alert-circle-outline" size={18} color="#C62828" />
                        <Text style={styles.inlineErrorText}>{payError}</Text>
                      </View>
                    )}

                    <Text style={styles.payMethodLabel}>Choose Payment Method</Text>
                    <View style={styles.payMethodRow}>
                      <TouchableOpacity
                        style={[styles.payMethodBtn, payMethod === 'razorpay' && styles.payMethodBtnActive]}
                        onPress={() => setPayMethod('razorpay')}
                      >
                        <Ionicons name="card-outline" size={20} color={payMethod === 'razorpay' ? '#fff' : BLUE} />
                        <Text style={[styles.payMethodText, payMethod === 'razorpay' && styles.payMethodTextActive]}>Card / Net Banking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.payMethodBtn, payMethod === 'upi' && styles.payMethodBtnActive]}
                        onPress={() => setPayMethod('upi')}
                      >
                        <Ionicons name="phone-portrait-outline" size={20} color={payMethod === 'upi' ? '#fff' : '#5C6BC0'} />
                        <Text style={[styles.payMethodText, payMethod === 'upi' && styles.payMethodTextActive]}>UPI</Text>
                      </TouchableOpacity>
                    </View>

                    {payMethod === 'razorpay' ? (
                      <TouchableOpacity style={styles.bookBtn} onPress={handleRazorpayPayment}>
                        <Ionicons name="card-outline" size={18} color="#fff" />
                        <Text style={styles.bookBtnText}>Pay ₹{parseFloat(booking.amount || 0).toFixed(0)} via Card / Net Banking</Text>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        {prop?.upi_id ? (
                          <View style={styles.upiBox}>
                            <Ionicons name="phone-portrait-outline" size={22} color="#5C6BC0" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.upiLabel}>Pay to UPI ID</Text>
                              <Text style={styles.upiId} selectable>{prop.upi_id}</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={[styles.upiBox, { backgroundColor: '#FFF8E7' }]}>
                            <Ionicons name="information-circle-outline" size={22} color="#E67E22" />
                            <Text style={{ fontSize: 13, color: '#E67E22', flex: 1 }}>Contact property for UPI details: {prop?.phone}</Text>
                          </View>
                        )}
                        <View style={{ marginBottom: 4 }}>
                          <Text style={styles.inputLabel}>UTR / Transaction Reference *</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. 316812345678"
                            placeholderTextColor={theme.colors.textMuted}
                            value={utrInput}
                            onChangeText={setUtrInput}
                            autoCapitalize="characters"
                          />
                          <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
                            After paying via UPI app, enter the 12-digit UTR from your payment confirmation
                          </Text>
                        </View>
                        <TouchableOpacity style={[styles.bookBtn, { backgroundColor: '#5C6BC0' }]} onPress={handleUpiPayment}>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                          <Text style={styles.bookBtnText}>Submit UPI Payment</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity style={styles.laterBtn} onPress={() => {
                      setBooking(null); setBookingDone(false);
                      router.push('/(tabs)' as any);
                    }}>
                      <Text style={styles.laterBtnText}>Pay Later (contact via WhatsApp)</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.textMuted, fontSize: 15 },

  // Hero / Photos
  hero: { position: 'relative' },
  photoGallery: { height: IS_WEB ? 340 : 240 },
  heroPhoto: { width: '100%', height: '100%' },
  heroGradient: { height: IS_WEB ? 280 : 200 },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: IS_WEB ? 20 : 12, left: IS_WEB ? 24 : 12, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: IS_WEB ? 32 : 16, paddingBottom: IS_WEB ? 20 : 14 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  typeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: IS_WEB ? 34 : 22, fontWeight: '900', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  heroTemple: { color: '#FFD54F', fontSize: 13, fontWeight: '600' },
  heroLocation: { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 },
  photoNav: { position: 'absolute', top: '50%', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  photoNavLeft: { left: 12 },
  photoNavRight: { right: 12 },
  photoDots: { position: 'absolute', bottom: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  photoCounter: { position: 'absolute', top: 12, right: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  photoCounterText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  body: { padding: IS_WEB ? 32 : 16 },

  section: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
  desc: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 22, marginBottom: 14 },
  noCats: { color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '45%' },
  infoLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { fontSize: 14, color: theme.colors.text, fontWeight: '600' },
  amenitiesWrap: { marginTop: 14 },
  amenitiesLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  amenitiesChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  amenityText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },

  catCard: { backgroundColor: '#F8FBFF', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: `${BLUE}22` },
  catCardSelected: { borderColor: BLUE, backgroundColor: '#E3F2FD' },
  catTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  catPhoto: { width: 90, height: 90, borderRadius: 10 },
  catPhotoPlaceholder: { backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '800', color: theme.colors.text, marginBottom: 5 },
  catMetaRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  catMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F0F0', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  catMetaText: { fontSize: 11, color: theme.colors.textMuted },
  catDesc: { fontSize: 12, color: theme.colors.textMuted, lineHeight: 18 },
  catAmenities: { fontSize: 11, color: '#2E7D32', marginTop: 4 },
  catPriceCol: { alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 70 },
  catPrice: { fontSize: 22, fontWeight: '900', color: BLUE },
  catPerNight: { fontSize: 11, color: theme.colors.textMuted },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: BLUE, borderRadius: 10, paddingVertical: 10,
  },
  selectBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
  selectBtnTextActive: { color: '#fff' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  modalSub: { fontSize: 12, color: BLUE, fontWeight: '600', marginTop: 2 },

  inlineError: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  inlineErrorText: { color: '#C62828', fontSize: 13, flex: 1 },

  priceSummary: { backgroundColor: '#F8FBFF', borderRadius: 12, padding: 14, marginBottom: 16 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  priceLabel: { fontSize: 13, color: theme.colors.textMuted, flex: 1 },
  priceValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  priceTotal: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, marginTop: 4 },
  priceTotalLabel: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  priceTotalValue: { fontSize: 20, fontWeight: '900', color: BLUE },

  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, marginBottom: 10,
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  laterBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 16 },
  laterBtnText: { fontSize: 14, color: theme.colors.textMuted },

  inputLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.text, backgroundColor: '#FAFAFA',
  },

  paymentHeader: { alignItems: 'center', padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  paymentTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginTop: 10 },
  paymentSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },

  payMethodLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  payMethodRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  payMethodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, paddingVertical: 12, backgroundColor: '#FAFAFA',
  },
  payMethodBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  payMethodText: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted },
  payMethodTextActive: { color: '#fff' },

  upiBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EDE7F6', borderRadius: 12, padding: 14, marginBottom: 14,
  },
  upiLabel: { fontSize: 10, fontWeight: '800', color: '#5C6BC0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  upiId: { fontSize: 16, fontWeight: '800', color: '#311B92', letterSpacing: 0.5 },

  successBox: { padding: 28, alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#2E7D32', marginTop: 14, marginBottom: 6 },
  successSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
});
