import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/constants/theme';

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.updated}>Last updated: April 23, 2026</Text>

        <Section title="1. Introduction">
          Sri Pooja Homam ("the App") is developed and operated by Aatreya Infotech. We
          respect your privacy and are committed to protecting your personal data. This
          Privacy Policy explains how we collect, use, and safeguard your information when
          you use our application at https://sri.aatreya.org.
        </Section>

        <Section title="2. Information We Collect">
          We collect the following information when you register and use the App:{'\n'}
          • Full name, mobile number, email address, city, pincode and address{'\n'}
          • Profile photo (if uploaded){'\n'}
          • Booking history and pooja preferences{'\n'}
          • Device push notification token{'\n'}
          • Usage data (screens visited, features used)
        </Section>

        <Section title="3. How We Use Your Information">
          Your information is used to:{'\n'}
          • Verify your identity via WhatsApp OTP{'\n'}
          • Process pooja and homam bookings{'\n'}
          • Send important service notifications{'\n'}
          • Provide live-stream access for paid devotees{'\n'}
          • Improve the App and personalise your experience
        </Section>

        <Section title="4. Payment Data">
          Payments are processed through Google Play Store (Android) and Apple App Store
          (iOS) in-app purchase systems. We do not store your card or payment credentials.
          Subscription status is managed by the respective store platform.
        </Section>

        <Section title="5. Data Sharing">
          We do not sell or rent your personal data. We may share data with:{'\n'}
          • Temple administrators (limited to booking details){'\n'}
          • Service providers strictly for app functionality (e.g., push notifications,
          live-streaming){'\n'}
          • Authorities if required by law
        </Section>

        <Section title="6. Data Retention">
          Your data is retained as long as your account is active. You may request deletion
          by contacting us at privacy@aatreya.org.
        </Section>

        <Section title="7. Security">
          We use industry-standard encryption (HTTPS / TLS) and secure Azure SQL Database
          storage. Passwords are hashed with bcrypt and never stored in plain text.
        </Section>

        <Section title="8. Children's Privacy">
          This App is not directed to children under 13. We do not knowingly collect data
          from children.
        </Section>

        <Section title="9. Contact Us">
          Aatreya Infotech{'\n'}
          Email: privacy@aatreya.org{'\n'}
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
