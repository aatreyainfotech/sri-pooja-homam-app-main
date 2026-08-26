import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '../../src/hooks/useSafeBack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiError } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import RazorpayCheckout from '../../src/components/RazorpayCheckout';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Button from '../../src/components/ui/Button';
import { useScreenCaptureProtection, useScreenshotWarning } from '../../src/hooks/useScreenCaptureProtection';

export default function BookPooja() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const safeBack = useSafeBack();
  const { user } = useAuth();
  const [pooja, setPooja] = useState<any>(null);
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');

  useScreenCaptureProtection(step === 'payment' || step === 'success');
  useScreenshotWarning("Screenshots of payment details aren't recommended.");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [form, setForm] = useState({
    devotee_name: user?.full_name || '',
    gotra: '',
    nakshatra: '',
    notes: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const dateOptions = useMemo(() => {
    if (!pooja || pooja.scheduled_at) return [];

    const fromRaw = pooja.release_from ? new Date(pooja.release_from) : null;
    const toRaw = pooja.release_to ? new Date(pooja.release_to) : null;
    if (!fromRaw || !toRaw || Number.isNaN(fromRaw.getTime()) || Number.isNaN(toRaw.getTime())) return [];

    const from = new Date(fromRaw);
    const to = new Date(toRaw);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    if (from > to) return [];

    const days: Date[] = [];
    const d = new Date(from);
    while (d <= to && days.length <= 120) {
      days.push(d);
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [pooja]);

  const timeSlots = [
    '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
  ];

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/poojas/${id}`);
        setPooja(data);
      } catch {}
    })();
  }, [id]);

  useEffect(() => {
    if (!selectedDate) return;
    const stillValid = dateOptions.some((d) => d.toDateString() === selectedDate.toDateString());
    if (!stillValid) setSelectedDate(null);
  }, [dateOptions, selectedDate]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const buildScheduledAt = (): string | null => {
    if (!selectedDate || !selectedTime) return null;
    const [timePart, meridiem] = selectedTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}:00`;
  };

  const createBooking = async () => {
    if (!form.devotee_name.trim()) {
      Alert.alert('Required', 'Please enter devotee name');
      return;
    }
    if (!fixedScheduledAt) {
      if (dateOptions.length === 0) {
        Alert.alert('Not released', 'Super Admin has not released booking dates for this pooja yet.');
        return;
      }
      if (!selectedDate) {
        Alert.alert('Required', 'Please select a date for the pooja');
        return;
      }
      const isReleasedDate = dateOptions.some((d) => d.toDateString() === selectedDate.toDateString());
      if (!isReleasedDate) {
        Alert.alert('Invalid date', 'Please choose only from released dates.');
        return;
      }
      if (!selectedTime) {
        Alert.alert('Required', 'Please select a time slot for the pooja');
        return;
      }
    }
    setLoading(true);
    try {
      const { data } = await api.post('/bookings', {
        pooja_id: id, ...form, scheduled_at: fixedScheduledAt || buildScheduledAt(),
      });
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

  const fixedScheduledAt: string | null = pooja.scheduled_at || null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={step === 'details' ? 'Book Pooja' : step === 'payment' ? 'Payment' : 'Confirmed'}
        onBack={() => safeBack('/(tabs)')}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
        <ResponsiveContainer maxWidth={640}>
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
              <Surface elevation="sm" padding="md" radius="lg" style={{ marginBottom: theme.spacing.lg }}>
                <Text style={styles.formTitle}>Schedule Pooja</Text>

                {fixedScheduledAt ? (
                  <>
                    <Text style={styles.formSub}>This pooja is performed at a fixed date and time set by the temple</Text>
                    <View style={styles.fixedScheduleCard}>
                      <View style={styles.fixedScheduleRow}>
                        <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                        <Text style={styles.fixedScheduleText}>
                          {new Date(fixedScheduledAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.fixedScheduleRow}>
                        <Ionicons name="time" size={20} color={theme.colors.primary} />
                        <Text style={styles.fixedScheduleText}>
                          {new Date(fixedScheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.formSub}>
                      {dateOptions.length > 0
                        ? 'Choose the date and time for your pooja'
                        : 'No dates released by Super Admin yet for this pooja'}
                    </Text>

                    {/* Date picker */}
                    <Text style={styles.fieldLabel}>Select Date *</Text>
                    {dateOptions.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 18 }}
                        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                      >
                        {dateOptions.map((item, i) => {
                          const isSel = selectedDate?.toDateString() === item.toDateString();
                          const day = item.toLocaleDateString('en-IN', { weekday: 'short' });
                          const date = item.getDate();
                          const month = item.toLocaleDateString('en-IN', { month: 'short' });
                          return (
                            <TouchableOpacity
                              key={i}
                              onPress={() => setSelectedDate(item)}
                              style={[styles.dateChip, isSel && styles.dateChipSel]}
                            >
                              <Text style={[styles.dateChipDay, isSel && styles.dateChipTextSel]}>{day}</Text>
                              <Text style={[styles.dateChipNum, isSel && styles.dateChipTextSel]}>{date}</Text>
                              <Text style={[styles.dateChipMonth, isSel && styles.dateChipTextSel]}>{month}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <Text style={{ color: theme.colors.textMuted, marginBottom: 18 }}>No released dates available.</Text>
                    )}

                    {/* Time slot picker */}
                    <Text style={styles.fieldLabel}>Select Time *</Text>
                    <View style={styles.timeGrid}>
                      {timeSlots.map((slot) => {
                        const isSel = selectedTime === slot;
                        return (
                          <Button
                            key={slot}
                            title={slot}
                            variant={isSel ? 'secondary' : 'outline'}
                            onPress={() => setSelectedTime(slot)}
                            style={styles.timeChip}
                          />
                        );
                      })}
                    </View>
                  </>
                )}
              </Surface>

              <Surface elevation="sm" padding="md" radius="lg" style={{ marginBottom: theme.spacing.lg }}>
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
              </Surface>

              <Button
                testID="book-proceed-btn"
                title="Proceed to Payment"
                icon="arrow-forward"
                iconPosition="right"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={createBooking}
              />
            </>
          )}

          {step === 'payment' && booking && (
            <>
              <Surface elevation="sm" padding="lg" radius="lg" style={{ alignItems: 'center' }}>
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
              </Surface>

              <Button
                testID="book-pay-btn"
                title={`Pay ₹${booking.amount.toFixed(0)} Securely`}
                icon="lock-closed"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={payNow}
                style={{ marginTop: theme.spacing.md }}
              />

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
                  <ReceiptRow
                    label="Scheduled"
                    value={new Date(booking.scheduled_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  />
                )}
              </View>

              <View style={styles.unlock}>
                <Ionicons name="lock-open" size={18} color={theme.colors.secondary} />
                <Text style={styles.unlockText}>Live streaming unlocked for this temple</Text>
              </View>

              <Button
                testID="book-done-btn"
                title="View My Bookings"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.replace('/(tabs)/bookings')}
              />
            </View>
          )}
        </ResponsiveContainer>
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

  dateChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border,
    backgroundColor: '#fff', minWidth: 58,
  },
  dateChipSel: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dateChipDay: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase' },
  dateChipNum: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginVertical: 2 },
  dateChipMonth: { fontSize: 10, fontWeight: '600', color: theme.colors.textMuted },
  dateChipTextSel: { color: '#fff' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  timeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },

  fixedScheduleCard: {
    backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
    borderRadius: 14, padding: 14, gap: 10,
  },
  fixedScheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fixedScheduleText: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
});
