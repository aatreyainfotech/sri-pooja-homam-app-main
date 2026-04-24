import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/constants/theme';

export default function TermsOfService() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.updated}>Last updated: April 23, 2026</Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using the Sri Pooja Homam App operated by
          Aatreya Infotech, you agree to be bound by these Terms of Service. If you do
          not agree, please uninstall the App and stop using it.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 18 years old (or have parental/guardian consent) to use
          this App and subscribe to our services.
        </Section>

        <Section title="3. Subscription & Payments">
          • Sri Pooja Homam offers subscription plans for live pooja and homam access.{'\n'}
          • Subscriptions are billed through Google Play Store (Android) or Apple App
          Store (iOS) according to the plan you select.{'\n'}
          • Prices and billing cycles are displayed at the time of purchase.{'\n'}
          • Subscriptions auto-renew unless cancelled at least 24 hours before the end of
          the current period.{'\n'}
          • To cancel, manage your subscription through your Google Play or Apple ID account.
        </Section>

        <Section title="4. Booking of Poojas & Homams">
          • Bookings are confirmed subject to temple availability.{'\n'}
          • You must provide accurate details (name, gotra, nakshatra) at the time of booking.{'\n'}
          • Aatreya Infotech acts as a facilitator between devotees and temples; we are not
          responsible for individual temple scheduling changes.
        </Section>

        <Section title="5. Live Streams">
          • Live streams are available to subscribed devotees only.{'\n'}
          • Recording, screenshotting, or redistribution of live content is strictly prohibited.{'\n'}
          • Stream quality depends on internet connectivity and is not guaranteed.
        </Section>

        <Section title="6. Prohibited Conduct">
          You agree not to:{'\n'}
          • Misuse or disrupt the App or its servers{'\n'}
          • Share your account credentials with others{'\n'}
          • Use the App for any unlawful purpose{'\n'}
          • Upload offensive, false, or misleading content
        </Section>

        <Section title="7. Intellectual Property">
          All content in this App (text, images, rituals, video streams) belongs to
          Aatreya Infotech or the respective temples. You may not reproduce or distribute
          any content without prior written permission.
        </Section>

        <Section title="8. Limitation of Liability">
          To the maximum extent permitted by law, Aatreya Infotech is not liable for any
          indirect or consequential loss arising from your use of the App.
        </Section>

        <Section title="9. Changes to Terms">
          We may update these Terms at any time. Continued use of the App after changes
          constitutes your acceptance of the new Terms.
        </Section>

        <Section title="10. Governing Law">
          These Terms are governed by the laws of India. Disputes shall be subject to the
          jurisdiction of courts in Hyderabad, Telangana.
        </Section>

        <Section title="11. Contact Us">
          Aatreya Infotech{'\n'}
          Email: legal@aatreya.org{'\n'}
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
