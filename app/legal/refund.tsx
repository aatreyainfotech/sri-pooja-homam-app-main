import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/constants/theme';

export default function RefundPolicy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Refund Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.updated}>Last updated: April 23, 2026</Text>

        <Section title="1. Subscription Refunds">
          Subscriptions purchased through Google Play Store or Apple App Store are subject
          to the respective platform's refund policies:{'\n\n'}
          • Google Play Store: You may be eligible for a refund within 48 hours of purchase.
          Visit https://play.google.com/store/account/subscriptions to cancel or request a
          refund.{'\n\n'}
          • Apple App Store: Refund requests must be submitted to Apple at
          https://reportaproblem.apple.com. Apple handles all iOS refunds per their
          guidelines.{'\n\n'}
          Aatreya Infotech does not directly process refunds for in-app purchases made
          through store platforms.
        </Section>

        <Section title="2. Pooja & Homam Booking Cancellations">
          • Cancellations made more than 48 hours before the scheduled pooja: Full refund.{'\n'}
          • Cancellations made 24–48 hours before: 50% refund.{'\n'}
          • Cancellations made less than 24 hours before or no-shows: No refund.{'\n\n'}
          To cancel a booking, go to My Bookings → select the booking → Cancel.
        </Section>

        <Section title="3. Temple-Cancelled Poojas">
          If a pooja or homam is cancelled by the temple, you will receive a full refund
          within 5–7 business days to the original payment method.
        </Section>

        <Section title="4. Live Stream Access">
          Refunds are not available for live stream access once the stream has commenced.
          If you experience a technical issue on our end preventing access, please contact
          support within 24 hours for a courtesy credit.
        </Section>

        <Section title="5. How to Request a Refund (Bookings)">
          Email: refunds@aatreya.org{'\n'}
          Include: your registered mobile number, booking ID, and reason for the refund.{'\n\n'}
          We aim to respond within 2 business days.
        </Section>

        <Section title="6. Contact Us">
          Aatreya Infotech{'\n'}
          Email: refunds@aatreya.org{'\n'}
          Support: support@aatreya.org{'\n'}
          Website: https://sri.aatreya.org
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bgPaper,
  },
  back: { marginRight: 10 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  body: { padding: 20, paddingBottom: 60 },
  updated: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 20, fontStyle: 'italic' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.primary, marginBottom: 6 },
  sectionBody: { fontSize: 14, color: theme.colors.text, lineHeight: 22 },
});
