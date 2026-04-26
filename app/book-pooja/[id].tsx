import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import RazorpayCheckout from '../../src/components/RazorpayCheckout';

export default function BookPooja() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const safeBack = useSafeBack();
  const { user } = useAuth();
  const [pooja, setPooja] = useState<any>(null);
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [form, setForm] = useState({
    devotee_name: user?.full_name || '',
    gotra: '',
    nakshatra: '',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/poojas/${id}`);
        setPooja(data);
      } catch {}
    })();
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const createBooking = async () => {
    if (!form.devotee_name.trim()) {
      Alert.alert('Required', 'Please enter devotee name');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/bookings', { pooja_id: id, ...form });
      setBooking(data);
      setStep('payment');
    } catch (e) {
      Alert.alert('Booking failed', apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const payNow = () => {
    setShowRazorpay(true);
  };

  const handlePaymentSuccess = async (paymentId: string, orderId: string, signature: string) => {
    setShowRazorpay(false);
    setLoading(true);
    try {
      const { data } = await api.post('/bookings/confirm-payment', {
        booking_id: booking.id,
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      });
      setBooking(data);
      setStep('success');
    } catch (e) {
      Alert.alert('Payment confirmation failed', apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = (error: string) => {
    setShowRazorpay(false);
    Alert.alert('Payment failed', error || 'Please try again');
  };

  if (!pooja) {
    return <View style={styles.loading}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
        <TouchableOpacity testID="book-back-btn" onPress={() => safeBack('/(tabs)')} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'details' ? 'Book Pooja' : step === 'payment' ? 'Payment' : 'Confirmed'}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Pooja summary card */}
          <View style={styles.summaryCard}>
            <Image source={{ uri: pooja.image }} style={styles.summaryImg} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.summaryType}>{pooja.type.toUpperCase()}</Text>
              <Text style={styles.summaryName}>{pooja.name}</Text>
              <Text style={styles.summaryDur}>⏱ {pooja.duration}</Text>
              <Text style={styles.summaryPrice}>₹{pooja.price.toFixed(0)}</Text>
            </View>
          </View>

          {step === 'details' && (
            <>
              <Text style={styles.formTitle}>Devotee Details</Text>
              <Text style={styles.formSub}>Name, Gotra & Nakshatra will be chanted during the ritual</Text>

              <Field label="Devotee Name *" icon="person-outline">
                <TextInput
                  testID="book-devotee-input"
                  value={form.devotee_name}
                  onChangeText={(v) => set('devotee_name', v)}
                  placeholder="Full name as per records"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                />
              </Field>

              <Field label="Gotra" icon="book-outline">
                <TextInput
                  testID="book-gotra-input"
                  value={form.gotra}
                  onChangeText={(v) => set('gotra', v)}
                  placeholder="e.g. Kashyapa"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                />
              </Field>

              <Field label="Nakshatra" icon="star-outline">
                <TextInput
                  testID="book-nakshatra-input"
                  value={form.nakshatra}
                  onChangeText={(v) => set('nakshatra', v)}
                  placeholder="e.g. Rohini"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                />
              </Field>

              <Field label="Special Requests (optional)" icon="chatbubble-outline">
                <TextInput
                  testID="book-notes-input"
                  value={form.notes}
                  onChangeText={(v) => set('notes', v)}
                  placeholder="Any special request for priest..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                />
              </Field>

              <TouchableOpacity testID="book-proceed-btn" style={styles.btnPrimary} onPress={createBooking} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.btnPrimaryText}>Proceed to Payment</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'payment' && booking && (
            <>
              <View style={styles.payCard}>
                <Ionicons name="card" size={40} color={theme.colors.primary} />
                <Text style={styles.payTitle}>Razorpay Secure Payment</Text>
                <Text style={styles.paySub}>Order: {booking.razorpay_order_id}</Text>

                <View style={styles.payBreakdown}>
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Pooja Amount</Text>
                    <Text style={styles.payVal}>₹{booking.amount.toFixed(0)}</Text>
                  </View>
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Platform Fee</Text>
                    <Text style={styles.payVal}>₹0</Text>
                  </View>
                  <View style={[styles.payRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, marginTop: 8 }]}>
                    <Text style={styles.payTotal}>Total</Text>
                    <Text style={styles.payTotalAmt}>₹{booking.amount.toFixed(0)}</Text>
                  </View>
                </View>

                <Text style={styles.secureNote}>🔒 Secured by Razorpay — UPI, Cards, Net Banking, Wallets</Text>
              </View>

              <TouchableOpacity testID="book-pay-btn" style={styles.btnPrimary} onPress={payNow} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Pay ₹{booking.amount.toFixed(0)} Securely</Text>
                  </>
                )}
              </TouchableOpacity>

              <RazorpayCheckout
                visible={showRazorpay}
                options={{
                  // Only pass orderId if it's a real Razorpay order (not null/undefined/fake)
                  orderId: booking.razorpay_order_id || undefined,
                  amount: booking.amount,
                  name: 'Sri Pooja Homam',
                  description: pooja?.name || 'Pooja Booking',
                  prefillName: user?.full_name,
                  prefillContact: user?.mobile,
                  prefillEmail: user?.email,
                  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
                }}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                onDismiss={() => setShowRazorpay(false)}
              />
            </>
          )}

          {step === 'success' && booking && (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#2E7D32" />
              </View>
              <Text style={styles.successTitle}>🙏 Booking Confirmed</Text>
              <Text style={styles.successSub}>Your {pooja.name} is booked successfully</Text>

              <View style={styles.receipt}>
                <ReceiptRow label="Booking ID" value={booking.id.slice(0, 12).toUpperCase()} />
                <ReceiptRow label="Payment ID" value={booking.razorpay_payment_id || 'N/A'} />
                <ReceiptRow label="Amount Paid" value={`₹${booking.amount.toFixed(0)}`} />
                <ReceiptRow label="Devotee" value={booking.devotee_name} />
                {booking.scheduled_at && (
                  <ReceiptRow label="Scheduled" value={new Date(booking.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                )}
              </View>

              <View style={styles.unlock}>
                <Ionicons name="lock-open" size={18} color={theme.colors.secondary} />
                <Text style={styles.unlockText}>Live streaming unlocked for this temple</Text>
              </View>

              <TouchableOpacity testID="book-done-btn" style={styles.btnPrimary} onPress={() => router.replace('/(tabs)/bookings')}>
                <Text style={styles.btnPrimaryText}>View My Bookings</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, children }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldWrap}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
        {children}
      </View>
    </View>
  );
}

function ReceiptRow({ label, value }: any) {
  return (
    <View style={styles.rrow}>
      <Text style={styles.rlabel}>{label}</Text>
      <Text style={styles.rval}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  summaryCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 18,
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 20,
  },
  summaryImg: { width: 84, height: 100, borderRadius: 12 },
  summaryType: { fontSize: 10, fontWeight: '800', color: theme.colors.secondaryDark, letterSpacing: 1.5 },
  summaryName: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
  summaryDur: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  summaryPrice: { fontSize: 22, fontWeight: '800', color: theme.colors.primary, marginTop: 6 },

  formTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  formSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2, marginBottom: 16 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 14, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.colors.text },

  btnPrimary: {
    backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  payCard: {
    backgroundColor: '#fff', padding: 20, borderRadius: 18,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center',
  },
  payTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 10 },
  paySub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  payBreakdown: { width: '100%', marginTop: 20 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  payLabel: { fontSize: 13, color: theme.colors.textSecondary },
  payVal: { fontSize: 13, color: theme.colors.text, fontWeight: '600' },
  payTotal: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  payTotalAmt: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  secureNote: {
    marginTop: 16, fontSize: 11, color: '#2E7D32',
    backgroundColor: 'rgba(46,125,50,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },

  successWrap: { alignItems: 'center', marginTop: 10 },
  successIcon: { marginBottom: 14 },
  successTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  successSub: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4, marginBottom: 20 },
  receipt: {
    width: '100%', backgroundColor: '#fff', padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed',
  },
  rrow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  rlabel: { fontSize: 12, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  rval: { fontSize: 13, fontWeight: '700', color: theme.colors.text, maxWidth: '60%' },
  unlock: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
    backgroundColor: 'rgba(212,175,55,0.12)', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
  },
  unlockText: { color: theme.colors.secondaryDark, fontSize: 13, fontWeight: '600' },
});
