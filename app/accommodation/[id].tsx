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
import WebFooter from '../../src/components/WebFooter';

const IS_WEB = Platform.OS === 'web';
const BLUE = '#0288D1';
const DARK_BLUE = '#01579B';

function parseImages(s: string | null | undefined): string[] {
  if (!s) return [];
  if (s.includes('|||')) return s.split('|||').map(v => v.trim()).filter(Boolean);
  if (s.startsWith('data:')) return [s.trim()];
  return s.split(',').map(v => v.trim()).filter(Boolean);
}

// ── Date input ─────────────────────────────────────────────────────────────────
function DateInput({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={di.header}>
        <Ionicons name={(icon || 'calendar-outline') as any} size={13} color={BLUE} />
        <Text style={di.label}>{label}</Text>
      </View>
      {IS_WEB ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 16, fontWeight: '700', color: value ? '#1A1A1A' : '#999',
            width: '100%', padding: 0, cursor: 'pointer',
          } as any}
        />
      ) : (
        <TextInput
          style={di.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || 'Select date'}
          placeholderTextColor="#B0BEC5"
        />
      )}
      {value ? <Text style={di.sub}>{new Date(value).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</Text> : null}
    </View>
  );
}
const di = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  label: { fontSize: 10, fontWeight: '800', color: BLUE, textTransform: 'uppercase', letterSpacing: 1 },
  input: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', padding: 0 },
  sub: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
});

// ── Counter stepper ────────────────────────────────────────────────────────────
function Counter({ value, min = 1, max = 20, onChange, label, icon }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void; label: string; icon?: string;
}) {
  return (
    <View style={cs.wrap}>
      <View style={cs.header}>
        <Ionicons name={(icon || 'person-outline') as any} size={13} color="#546E7A" />
        <Text style={cs.label}>{label}</Text>
      </View>
      <View style={cs.row}>
        <TouchableOpacity
          style={[cs.btn, value <= min && cs.btnOff]}
          onPress={() => value > min && onChange(value - 1)}
          disabled={value <= min}
        >
          <Ionicons name="remove" size={16} color={value <= min ? '#CFD8DC' : BLUE} />
        </TouchableOpacity>
        <Text style={cs.val}>{value}</Text>
        <TouchableOpacity
          style={[cs.btn, value >= max && cs.btnOff]}
          onPress={() => value < max && onChange(value + 1)}
          disabled={value >= max}
        >
          <Ionicons name="add" size={16} color={value >= max ? '#CFD8DC' : BLUE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const cs = StyleSheet.create({
  wrap: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  label: { fontSize: 10, fontWeight: '800', color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0F7FF', borderRadius: 12, overflow: 'hidden' },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2FD' },
  btnOff: { backgroundColor: '#F5F5F5' },
  val: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', flex: 1, textAlign: 'center' },
});

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

function GuestField({ label, icon, ...props }: TextInputProps & { label: string; icon?: string }) {
  return (
    <View style={gf.wrap}>
      <View style={gf.row}>
        <View style={gf.iconBox}>
          <Ionicons name={(icon || 'person-outline') as any} size={16} color={BLUE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={gf.label}>{label}</Text>
          <TextInput style={gf.input} placeholderTextColor="#B0BEC5" {...props} />
        </View>
      </View>
    </View>
  );
}
const gf = StyleSheet.create({
  wrap: { marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#ECEFF1', paddingVertical: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '800', color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  input: { fontSize: 15, color: '#1A1A1A', fontWeight: '500', padding: 0 },
});

function CatPhoto({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  const s = { width: 88, height: 88, borderRadius: 12 } as const;
  if (!uri || failed) {
    return (
      <LinearGradient colors={['#E3F2FD', '#B3E5FC']} style={[s, { alignItems: 'center', justifyContent: 'center' } as any]}>
        <Ionicons name="bed-outline" size={28} color={BLUE} />
      </LinearGradient>
    );
  }
  return <Image source={{ uri }} style={s} resizeMode="cover" onError={() => setFailed(true)} />;
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [prop, setProp] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showBook, setShowBook] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [bookForm, setBookForm] = useState({ check_in: '', check_out: '', guest_name: '', guest_mobile: '', special_requests: '' });
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [bookError, setBookError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [bookingDone, setBookingDone] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [payMethod, setPayMethod] = useState<'razorpay' | 'upi'>('razorpay');
  const [payError, setPayError] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoErrors, setPhotoErrors] = useState<Set<number>>(new Set());

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
    if (!user) { setBookError('Please log in to book accommodation.'); return; }
    if (!bookForm.check_in || !bookForm.check_out || !bookForm.guest_name || !bookForm.guest_mobile) {
      setBookError('Fill in all required fields: dates, name, and mobile.'); return;
    }
    if (calcNights() <= 0) { setBookError('Check-out must be after check-in.'); return; }
    try {
      const res = await api.post('/accommodation-bookings', {
        property_id: id, room_category_id: selectedCat.id,
        check_in: bookForm.check_in, check_out: bookForm.check_out,
        guests, rooms,
        guest_name: bookForm.guest_name, guest_mobile: bookForm.guest_mobile,
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
            setPayError('Payment done but verification failed. Contact support with Booking ID.');
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
        setPayError('Razorpay not loaded. Use UPI or contact via WhatsApp.');
      }
    } else {
      const msg = encodeURIComponent(
        `Hi, I want to pay ₹${booking.amount} for booking at ${prop?.name}.\nBooking ID: ${booking.id}\nDates: ${bookForm.check_in} to ${bookForm.check_out}`
      );
      Linking.openURL(`https://wa.me/918309067121?text=${msg}`);
    }
  };

  const handleUpiPayment = async () => {
    if (!booking) return;
    setPayError('');
    const utr = utrInput.trim();
    if (!utr) { setPayError('Enter your UPI Transaction Reference (UTR) number.'); return; }
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

  const photos = parseImages(prop.images);
  const nights = calcNights();
  const amount = calcAmount();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Hero / Photo Gallery ─────────────────────────────── */}
        <View style={styles.hero}>
          {photos.length > 0 && !photoErrors.has(photoIdx) ? (
            <View style={styles.photoGallery}>
              <Image
                source={{ uri: photos[photoIdx] }}
                style={styles.heroPhoto}
                resizeMode="cover"
                onError={() => setPhotoErrors((prev) => new Set([...prev, photoIdx]))}
              />
              {photos.length > 1 && (
                <>
                  <TouchableOpacity style={[styles.photoNav, styles.photoNavLeft]} onPress={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.photoNav, styles.photoNavRight]} onPress={() => setPhotoIdx((i) => (i + 1) % photos.length)}>
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
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']} locations={[0, 0.25, 0.65, 1]} style={styles.heroOverlay} />
            </View>
          ) : (
            <LinearGradient colors={['#1A237E', '#0277BD', '#0288D1']} style={styles.heroGradient}>
              <Ionicons name="bed" size={60} color="rgba(255,255,255,0.15)" />
            </LinearGradient>
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
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroLocation}>{prop.address}{prop.city ? `, ${prop.city}` : ''}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.body, IS_WEB && { maxWidth: 1100, alignSelf: 'center', width: '100%' } as any]}>
          {/* ── Quick Info Strip ─────────────────────────────── */}
          <View style={styles.quickStrip}>
            <View style={styles.quickItem}>
              <Ionicons name="log-in-outline" size={16} color={BLUE} />
              <View>
                <Text style={styles.quickLabel}>Check-in</Text>
                <Text style={styles.quickVal}>{prop.check_in_time || '12:00'}</Text>
              </View>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickItem}>
              <Ionicons name="log-out-outline" size={16} color={BLUE} />
              <View>
                <Text style={styles.quickLabel}>Check-out</Text>
                <Text style={styles.quickVal}>{prop.check_out_time || '11:00'}</Text>
              </View>
            </View>
            {prop.phone ? (
              <>
                <View style={styles.quickDivider} />
                <View style={styles.quickItem}>
                  <Ionicons name="call-outline" size={16} color={BLUE} />
                  <View>
                    <Text style={styles.quickLabel}>Contact</Text>
                    <Text style={styles.quickVal}>{prop.phone}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>

          {/* ── About ─────────────────────────────────────────── */}
          {(prop.description || prop.amenities) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this Property</Text>
              {prop.description ? <Text style={styles.desc}>{prop.description}</Text> : null}
              {prop.amenities ? (
                <View style={styles.amenitiesChips}>
                  {prop.amenities.split(',').map((a: string, i: number) => (
                    <View key={i} style={styles.amenityChip}>
                      <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                      <Text style={styles.amenityText}>{a.trim()}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* ── Room Types ────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Room Types</Text>
            {categories.length === 0 ? (
              <Text style={styles.noCats}>Room details coming soon. Contact property for availability.</Text>
            ) : (
              categories.map((cat) => {
                const catPhoto = parseImages(cat.images)[0] || null;
                const isSelected = selectedCat?.id === cat.id;
                return (
                  <View key={cat.id} style={[styles.catCard, isSelected && styles.catCardSelected]}>
                    <View style={styles.catTop}>
                      <CatPhoto uri={catPhoto} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <View style={styles.catMetaRow}>
                          <View style={styles.catMetaChip}>
                            <Ionicons name="people-outline" size={11} color={theme.colors.textMuted} />
                            <Text style={styles.catMetaText}>{cat.capacity} guests</Text>
                          </View>
                          <View style={styles.catMetaChip}>
                            <Ionicons name="bed-outline" size={11} color={theme.colors.textMuted} />
                            <Text style={styles.catMetaText}>{cat.total_rooms} rooms</Text>
                          </View>
                        </View>
                        {cat.description ? <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text> : null}
                        {cat.amenities ? <Text style={styles.catAmenities} numberOfLines={1}>✓ {cat.amenities}</Text> : null}
                      </View>
                      <View style={styles.catPriceCol}>
                        <Text style={styles.catPrice}>₹{parseFloat(cat.price_per_night).toFixed(0)}</Text>
                        <Text style={styles.catPerNight}>/night</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
                      onPress={() => { setSelectedCat(cat); setBookError(''); setShowBook(true); }}
                    >
                      <Ionicons name={isSelected ? 'checkmark-circle' : 'calendar-outline'} size={16} color={isSelected ? '#fff' : BLUE} />
                      <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                        {isSelected ? 'Selected — Book Now' : 'Select & Book'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </View>
        {IS_WEB && <WebFooter />}
      </ScrollView>

      {/* ══════════════════ BOOKING MODAL ══════════════════════ */}
      <Modal visible={showBook} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <LinearGradient colors={[DARK_BLUE, BLUE]} style={styles.bookHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookHeaderRoom}>{selectedCat?.name}</Text>
                <Text style={styles.bookHeaderProp}>{prop?.name}</Text>
              </View>
              <View style={styles.bookHeaderPrice}>
                <Text style={styles.bookHeaderPriceVal}>₹{parseFloat(selectedCat?.price_per_night || 0).toFixed(0)}</Text>
                <Text style={styles.bookHeaderPriceSub}>/night</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBook(false)} style={styles.bookCloseBtn}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.bookBody}>
                {/* Error banner */}
                {!!bookError && (
                  <View style={styles.inlineError}>
                    <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
                    <Text style={styles.inlineErrorText}>{bookError}</Text>
                  </View>
                )}

                {/* ── Date range card ── */}
                <View style={styles.dateCard}>
                  <DateInput label="Check-in" value={bookForm.check_in} onChange={(v) => setBookForm({ ...bookForm, check_in: v })} icon="log-in-outline" />
                  <View style={styles.dateDivider}>
                    {nights > 0 ? (
                      <View style={styles.nightsBadge}>
                        <Text style={styles.nightsNum}>{nights}</Text>
                        <Text style={styles.nightsLabel}>night{nights !== 1 ? 's' : ''}</Text>
                      </View>
                    ) : (
                      <View style={styles.dateSep}>
                        <Ionicons name="arrow-forward" size={16} color="#CFD8DC" />
                      </View>
                    )}
                  </View>
                  <DateInput label="Check-out" value={bookForm.check_out} onChange={(v) => setBookForm({ ...bookForm, check_out: v })} icon="log-out-outline" />
                </View>

                {/* ── Guests & Rooms ── */}
                <View style={styles.counterRow}>
                  <Counter label="Guests" value={guests} min={1} max={selectedCat?.capacity || 10} onChange={setGuests} icon="people-outline" />
                  <View style={{ width: 16 }} />
                  <Counter label="Rooms" value={rooms} min={1} max={selectedCat?.total_rooms || 20} onChange={setRooms} icon="bed-outline" />
                </View>

                {/* ── Guest Details ── */}
                <View style={styles.guestSection}>
                  <Text style={styles.sectionHead}>Guest Details</Text>
                  <GuestField label="Full Name *" value={bookForm.guest_name} onChangeText={(v: string) => setBookForm({ ...bookForm, guest_name: v })} placeholder="Rama Rao" icon="person-outline" />
                  <GuestField label="Mobile Number *" value={bookForm.guest_mobile} onChangeText={(v: string) => setBookForm({ ...bookForm, guest_mobile: v })} placeholder="+91 98765 43210" keyboardType="phone-pad" icon="call-outline" />
                  <GuestField label="Special Requests" value={bookForm.special_requests} onChangeText={(v: string) => setBookForm({ ...bookForm, special_requests: v })} placeholder="Vegetarian meals, early check-in…" icon="chatbubble-ellipses-outline" multiline />
                </View>

                {/* ── Price Summary ── */}
                {nights > 0 && (
                  <View style={styles.priceSummary}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>₹{parseFloat(selectedCat?.price_per_night || 0).toFixed(0)} × {nights} nights × {rooms} room(s)</Text>
                      <Text style={styles.priceVal}>₹{amount.toFixed(0)}</Text>
                    </View>
                    <View style={styles.priceTotal}>
                      <Text style={styles.priceTotalLabel}>Total Amount</Text>
                      <Text style={styles.priceTotalVal}>₹{amount.toFixed(0)}</Text>
                    </View>
                  </View>
                )}

                {/* ── CTA ── */}
                <TouchableOpacity style={styles.bookCta} onPress={handleBook} activeOpacity={0.88}>
                  <LinearGradient colors={[DARK_BLUE, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookCtaGrad}>
                    <Ionicons name="calendar-check-outline" size={20} color="#fff" />
                    <Text style={styles.bookCtaText}>
                      {nights > 0 ? `Confirm Booking — ₹${amount.toFixed(0)}` : 'Confirm Booking'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════ PAYMENT MODAL ══════════════════════ */}
      {booking && (
        <Modal visible={!!booking} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {bookingDone ? (
                <View style={styles.successBox}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                  </View>
                  <Text style={styles.successTitle}>Booking Confirmed!</Text>
                  <Text style={styles.successSub}>Your stay at {prop?.name} is booked. We'll WhatsApp the details to you.</Text>
                  <View style={styles.successCard}>
                    <View style={styles.successRow}><Text style={styles.successKey}>Booking ID</Text><Text style={styles.successVal}>{booking.id?.slice(0, 8).toUpperCase()}</Text></View>
                    <View style={styles.successRow}><Text style={styles.successKey}>Room</Text><Text style={styles.successVal}>{selectedCat?.name}</Text></View>
                    <View style={styles.successRow}><Text style={styles.successKey}>Check-in</Text><Text style={styles.successVal}>{bookForm.check_in}</Text></View>
                    <View style={styles.successRow}><Text style={styles.successKey}>Check-out</Text><Text style={styles.successVal}>{bookForm.check_out}</Text></View>
                    <View style={[styles.successRow, { borderTopWidth: 1, borderTopColor: '#ECEFF1', paddingTop: 10, marginTop: 4 }]}>
                      <Text style={[styles.successKey, { fontWeight: '800', color: '#1A1A1A' }]}>Total Paid</Text>
                      <Text style={[styles.successVal, { fontSize: 20, color: BLUE, fontWeight: '900' }]}>₹{parseFloat(booking.amount || 0).toFixed(0)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.bookCta} onPress={() => { setBooking(null); setBookingDone(false); setUtrInput(''); setPayError(''); router.push('/(tabs)' as any); }}>
                    <LinearGradient colors={[DARK_BLUE, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookCtaGrad}>
                      <Ionicons name="home-outline" size={20} color="#fff" />
                      <Text style={styles.bookCtaText}>Back to Home</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Payment header */}
                  <LinearGradient colors={[DARK_BLUE, BLUE]} style={styles.payHeader}>
                    <View style={styles.payCheckIcon}>
                      <Ionicons name="checkmark" size={22} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payHeaderTitle}>Booking Created!</Text>
                      <Text style={styles.payHeaderSub}>ID: {booking.id?.slice(0, 8).toUpperCase()} · ₹{parseFloat(booking.amount || 0).toFixed(0)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setBooking(null); router.push('/(tabs)' as any); }}>
                      <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </LinearGradient>

                  <ScrollView style={styles.bookBody} showsVerticalScrollIndicator={false}>
                    {/* Booking summary */}
                    <View style={styles.payBookingSummary}>
                      <View style={styles.successRow}><Text style={styles.successKey}>Property</Text><Text style={[styles.successVal, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>{prop?.name}</Text></View>
                      <View style={styles.successRow}><Text style={styles.successKey}>Room</Text><Text style={styles.successVal}>{selectedCat?.name}</Text></View>
                      <View style={styles.successRow}><Text style={styles.successKey}>Dates</Text><Text style={styles.successVal}>{bookForm.check_in} → {bookForm.check_out} ({nights}N)</Text></View>
                      <View style={[styles.successRow, { borderTopWidth: 1, borderTopColor: '#ECEFF1', marginTop: 6, paddingTop: 10 }]}>
                        <Text style={[styles.successKey, { fontWeight: '800', color: '#1A1A1A' }]}>Amount Due</Text>
                        <Text style={[styles.successVal, { fontSize: 20, color: BLUE, fontWeight: '900' }]}>₹{parseFloat(booking.amount || 0).toFixed(0)}</Text>
                      </View>
                    </View>

                    {!!payError && (
                      <View style={styles.inlineError}>
                        <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
                        <Text style={styles.inlineErrorText}>{payError}</Text>
                      </View>
                    )}

                    {/* Payment method tabs */}
                    <Text style={styles.sectionHead}>Payment Method</Text>
                    <View style={styles.payTabs}>
                      <TouchableOpacity style={[styles.payTab, payMethod === 'razorpay' && styles.payTabActive]} onPress={() => setPayMethod('razorpay')}>
                        <Ionicons name="card-outline" size={18} color={payMethod === 'razorpay' ? '#fff' : BLUE} />
                        <Text style={[styles.payTabText, payMethod === 'razorpay' && styles.payTabTextActive]}>Card / Net Banking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.payTab, payMethod === 'upi' && styles.payTabActive]} onPress={() => setPayMethod('upi')}>
                        <Ionicons name="phone-portrait-outline" size={18} color={payMethod === 'upi' ? '#fff' : '#5C6BC0'} />
                        <Text style={[styles.payTabText, payMethod === 'upi' && styles.payTabTextActive]}>UPI Transfer</Text>
                      </TouchableOpacity>
                    </View>

                    {payMethod === 'razorpay' ? (
                      <TouchableOpacity style={styles.bookCta} onPress={handleRazorpayPayment} activeOpacity={0.88}>
                        <LinearGradient colors={[DARK_BLUE, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookCtaGrad}>
                          <Ionicons name="card-outline" size={20} color="#fff" />
                          <Text style={styles.bookCtaText}>Pay ₹{parseFloat(booking.amount || 0).toFixed(0)} Securely</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        {prop?.upi_id ? (
                          <View style={styles.upiCard}>
                            <LinearGradient colors={['#4527A0', '#5C6BC0']} style={styles.upiCardGrad}>
                              <Ionicons name="phone-portrait-outline" size={24} color="rgba(255,255,255,0.7)" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.upiCardLabel}>Pay to UPI ID</Text>
                                <Text style={styles.upiCardId} selectable>{prop.upi_id}</Text>
                              </View>
                            </LinearGradient>
                          </View>
                        ) : (
                          <View style={styles.inlineWarn}>
                            <Ionicons name="information-circle-outline" size={18} color="#E65100" />
                            <Text style={styles.inlineWarnText}>Contact property for UPI: {prop?.phone}</Text>
                          </View>
                        )}
                        <View style={styles.utrSection}>
                          <Text style={styles.sectionHead}>Enter UTR Reference</Text>
                          <TextInput
                            style={styles.utrInput}
                            placeholder="e.g. 316812345678"
                            placeholderTextColor="#B0BEC5"
                            value={utrInput}
                            onChangeText={setUtrInput}
                            autoCapitalize="characters"
                          />
                          <Text style={styles.utrHint}>12-digit UTR from your UPI payment confirmation</Text>
                        </View>
                        <TouchableOpacity style={styles.bookCta} onPress={handleUpiPayment} activeOpacity={0.88}>
                          <LinearGradient colors={['#4527A0', '#5C6BC0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookCtaGrad}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.bookCtaText}>Submit UPI Payment</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity style={styles.laterBtn} onPress={() => { setBooking(null); router.push('/(tabs)' as any); }}>
                      <Text style={styles.laterBtnText}>Pay Later · Contact via WhatsApp</Text>
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.textMuted, fontSize: 15 },

  // Hero
  hero: { position: 'relative' },
  photoGallery: { height: IS_WEB ? 360 : 260 },
  heroPhoto: { width: '100%', height: '100%' },
  heroGradient: { height: IS_WEB ? 280 : 200, alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: IS_WEB ? 20 : 14, left: IS_WEB ? 24 : 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: IS_WEB ? 32 : 16, paddingBottom: IS_WEB ? 24 : 16 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  typeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: IS_WEB ? 36 : 24, fontWeight: '900', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  heroTemple: { color: '#FFD54F', fontSize: 13, fontWeight: '600' },
  heroLocation: { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 },
  photoNav: { position: 'absolute', top: '50%', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  photoNavLeft: { left: 12 },
  photoNavRight: { right: 12 },
  photoDots: { position: 'absolute', bottom: 64, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#fff', width: 20, borderRadius: 3 },
  photoCounter: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  photoCounterText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  body: { padding: IS_WEB ? 28 : 14 },

  // Quick strip
  quickStrip: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E8EEF4' },
  quickItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickLabel: { fontSize: 10, fontWeight: '700', color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.8 },
  quickVal: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginTop: 2 },
  quickDivider: { width: 1, backgroundColor: '#ECEFF1', marginHorizontal: 12 },

  section: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E8EEF4' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#546E7A', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },
  desc: { fontSize: 14, color: '#546E7A', lineHeight: 22, marginBottom: 12 },
  noCats: { color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  amenitiesChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  amenityText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },

  // Room cards
  catCard: { backgroundColor: '#F8FBFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#E3EFF8' },
  catCardSelected: { borderColor: BLUE, backgroundColor: '#EBF5FF' },
  catTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  catPhoto: { width: 88, height: 88, borderRadius: 12 },
  catName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  catMetaRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  catMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2F5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  catMetaText: { fontSize: 11, color: '#607D8B' },
  catDesc: { fontSize: 12, color: '#78909C', lineHeight: 17 },
  catAmenities: { fontSize: 11, color: '#2E7D32', marginTop: 4 },
  catPriceCol: { alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 70 },
  catPrice: { fontSize: 22, fontWeight: '900', color: BLUE },
  catPerNight: { fontSize: 11, color: '#90A4AE' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: BLUE, borderRadius: 12, paddingVertical: 11 },
  selectBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
  selectBtnTextActive: { color: '#fff' },

  // Modal shell
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    ...(IS_WEB
      ? { justifyContent: 'center', alignItems: 'center', padding: 24 }
      : { justifyContent: 'flex-end' }
    ),
  } as any,
  modalCard: {
    backgroundColor: '#fff', overflow: 'hidden',
    ...(IS_WEB
      ? { borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90%' }
      : { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '94%' }
    ),
  } as any,

  // Booking modal
  bookHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 24, gap: 12 },
  bookHeaderRoom: { color: '#fff', fontSize: 18, fontWeight: '900' },
  bookHeaderProp: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  bookHeaderPrice: { alignItems: 'flex-end' },
  bookHeaderPriceVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  bookHeaderPriceSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  bookCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  bookBody: { padding: 20 },

  inlineError: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12, marginBottom: 16 },
  inlineErrorText: { color: '#C62828', fontSize: 13, flex: 1, lineHeight: 18 },
  inlineWarn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 12, padding: 12, marginBottom: 14 },
  inlineWarnText: { color: '#E65100', fontSize: 13, flex: 1 },

  // Date card
  dateCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0F7FF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BBDEFB' },
  dateDivider: { alignItems: 'center', justifyContent: 'center', paddingTop: 18, paddingHorizontal: 8 },
  nightsBadge: { backgroundColor: BLUE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  nightsNum: { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  nightsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dateSep: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },

  counterRow: { flexDirection: 'row', marginBottom: 16 },

  guestSection: { backgroundColor: '#F8FBFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E3EFF8' },
  sectionHead: { fontSize: 11, fontWeight: '800', color: '#78909C', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },

  priceSummary: { backgroundColor: '#E3F2FD', borderRadius: 14, padding: 14, marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 13, color: '#546E7A', flex: 1 },
  priceVal: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  priceTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#90CAF9', paddingTop: 10 },
  priceTotalLabel: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  priceTotalVal: { fontSize: 22, fontWeight: '900', color: BLUE },

  bookCta: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  bookCtaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  bookCtaText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Payment modal
  payHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 24 },
  payCheckIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  payHeaderTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  payHeaderSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  payBookingSummary: { backgroundColor: '#F0F7FF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#BBDEFB' },

  payTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  payTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#CFD8DC', borderRadius: 14, paddingVertical: 13, backgroundColor: '#F5F7FA' },
  payTabActive: { backgroundColor: BLUE, borderColor: BLUE },
  payTabText: { fontSize: 13, fontWeight: '700', color: '#607D8B' },
  payTabTextActive: { color: '#fff' },

  upiCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  upiCardGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  upiCardLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  upiCardId: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  utrSection: { marginBottom: 16 },
  utrInput: { borderWidth: 1.5, borderColor: '#CFD8DC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '700', color: '#1A1A1A', backgroundColor: '#F8FBFF', marginBottom: 6 },
  utrHint: { fontSize: 11, color: '#90A4AE' },

  laterBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  laterBtnText: { fontSize: 13, color: '#90A4AE', fontWeight: '500' },

  // Success
  successBox: { padding: 28, alignItems: 'center' },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 6 },
  successSub: { fontSize: 14, color: '#78909C', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  successCard: { width: '100%', backgroundColor: '#F0F7FF', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#BBDEFB' },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  successKey: { fontSize: 13, color: '#78909C', fontWeight: '500' },
  successVal: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '45%' },
  infoLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { fontSize: 14, color: theme.colors.text, fontWeight: '600' },
});
