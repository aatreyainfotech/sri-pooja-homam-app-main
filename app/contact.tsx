import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  Linking, useWindowDimensions, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import WebFooter from '../src/components/WebFooter';

const GOLD = '#C9922A';
const SAFFRON = '#8B3520';
const IS_WEB = Platform.OS === 'web';

const CONTACTS = [
  {
    icon: 'call-outline', label: 'Phone', value: '+91 86442 97366',
    action: () => Linking.openURL('tel:+918644297366'), color: '#7A3020',
  },
  {
    icon: 'logo-whatsapp', label: 'WhatsApp', value: '+91 83090 67121',
    action: () => Linking.openURL('https://wa.me/918309067121?text=Namaste%2C%20I%20need%20help%20with%20Sri%20Pooja%20Homam'), color: '#25D366',
  },
  {
    icon: 'mail-outline', label: 'Email', value: 'info@sripoojahomam.com',
    action: () => Linking.openURL('mailto:info@sripoojahomam.com'), color: '#A67A1E',
  },
  {
    icon: 'time-outline', label: 'Support Hours', value: 'Mon–Sat, 9 AM – 7 PM IST',
    action: undefined, color: '#C9922A',
  },
];

const SOCIAL = [
  { icon: 'logo-whatsapp', label: 'WhatsApp', color: '#25D366', url: 'https://wa.me/918309067121' },
  { icon: 'logo-youtube', label: 'YouTube', color: '#FF0000', url: 'https://youtube.com' },
  { icon: 'logo-instagram', label: 'Instagram', color: '#E91E63', url: 'https://instagram.com' },
  { icon: 'logo-facebook', label: 'Facebook', color: '#1877F2', url: 'https://facebook.com' },
];

const FAQS = [
  { q: 'How do I book a pooja?', a: 'Sign in, go to Temples, select a temple, choose a pooja/homam, and follow the booking steps.' },
  { q: 'Can I watch the pooja live?', a: 'Yes! After booking, you receive a live stream link. You can also watch all temple live streams from the Live Darshan section.' },
  { q: 'How do I get my ticket / prasadam?', a: 'After booking, a digital ticket is sent to your registered email. Prasadam is couriered to your address.' },
  { q: 'What is the refund policy?', a: 'Cancellations made 48+ hours before are eligible for full refund. See our Refund Policy page for details.' },
  { q: 'How do I become a hotel manager?', a: 'Contact us via WhatsApp or email — our team will verify your property and assign you a hotel manager account.' },
];

export default function ContactPage() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const innerW = Math.min(W, 1280);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!name || !message) return;
    Linking.openURL(`https://wa.me/918309067121?text=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage: ${message}`)}`);
    setSent(true);
  };

  if (IS_WEB) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8E7', ...(Platform.OS === 'web' ? { overflowY: 'auto' } as any : {}) }}>
        <LinearGradient colors={['#1A0C07', '#3D1408', '#7A3020']} style={s.hero}>
          <Text style={s.heroOm}>ॐ</Text>
          <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={s.heroTitle}>Contact Us</Text>
            <Text style={s.heroSub}>We're here to help with your spiritual journey — reach us on WhatsApp, phone, or email.</Text>
          </View>
        </LinearGradient>

        <View style={{ maxWidth: innerW, alignSelf: 'center', width: '100%', padding: 40 }}>
          <View style={{ flexDirection: 'row', gap: 40, flexWrap: 'wrap' }}>
            {/* Left: contact info + social */}
            <View style={{ flex: 1, minWidth: 280 }}>
              <Text style={s.sectionTitle}>Get in Touch</Text>
              <View style={{ marginTop: 24, gap: 16 }}>
                {CONTACTS.map((c) => (
                  <TouchableOpacity
                    key={c.label}
                    onPress={c.action}
                    disabled={!c.action}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 16,
                      backgroundColor: '#fff', borderRadius: 16, padding: 20,
                      borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
                      ...(Platform.OS === 'web' ? { boxShadow: '0 4px 18px rgba(74,44,42,0.08)' } as any : {}),
                    } as any}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={c.icon as any} size={24} color={c.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#7A6A5A', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>{c.label}</Text>
                      <Text style={{ color: '#4A2C2A', fontSize: 16, fontWeight: '700', marginTop: 2 }}>{c.value}</Text>
                    </View>
                    {c.action && <Ionicons name="arrow-forward" size={18} color={c.color} />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.sectionTitle, { marginTop: 36, fontSize: 20 }]}>Follow Us</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                {SOCIAL.map((soc) => (
                  <TouchableOpacity
                    key={soc.label}
                    onPress={() => Linking.openURL(soc.url)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: soc.color + '15',
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
                      borderWidth: 1, borderColor: soc.color + '35',
                    }}
                  >
                    <Ionicons name={soc.icon as any} size={18} color={soc.color} />
                    <Text style={{ color: soc.color, fontSize: 13, fontWeight: '700' }}>{soc.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Right: form + FAQs */}
            <View style={{ flex: 1.3, minWidth: 320 }}>
              <Text style={s.sectionTitle}>Send a Message</Text>
              <View style={{
                backgroundColor: '#fff', borderRadius: 20, padding: 28, marginTop: 24,
                borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)',
                ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(74,44,42,0.1)' } as any : {}),
              } as any}>
                {sent ? (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
                    <Text style={{ color: '#4A2C2A', fontSize: 20, fontWeight: '800', marginTop: 14 }}>Message Sent!</Text>
                    <Text style={{ color: '#7A6A5A', marginTop: 8, textAlign: 'center' }}>We'll get back to you on WhatsApp within a few hours.</Text>
                    <TouchableOpacity style={{ marginTop: 20, backgroundColor: SAFFRON, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }} onPress={() => setSent(false)}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Send Another</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={{ marginBottom: 16 }}>
                      <Text style={s.label}>Your Name *</Text>
                      <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} placeholderTextColor="#bbb" />
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <Text style={s.label}>Email Address</Text>
                      <TextInput style={s.input} placeholder="you@email.com" value={email} onChangeText={setEmail} placeholderTextColor="#bbb" keyboardType="email-address" />
                    </View>
                    <View style={{ marginBottom: 20 }}>
                      <Text style={s.label}>Message *</Text>
                      <TextInput
                        style={[s.input, { height: 110, textAlignVertical: 'top', paddingTop: 12 }]}
                        placeholder="How can we help you?"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        placeholderTextColor="#bbb"
                      />
                    </View>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 14 }}
                      onPress={handleSend}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Send via WhatsApp</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <Text style={[s.sectionTitle, { marginTop: 40, fontSize: 22 }]}>Frequently Asked Questions</Text>
              <View style={{ marginTop: 20, gap: 12 }}>
                {FAQS.map((faq) => (
                  <View key={faq.q} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(230,126,34,0.12)' }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Ionicons name="help-circle-outline" size={18} color={SAFFRON} style={{ marginTop: 1 }} />
                      <Text style={{ color: '#4A2C2A', fontSize: 14, fontWeight: '800', flex: 1 }}>{faq.q}</Text>
                    </View>
                    <Text style={{ color: '#7A6A5A', fontSize: 13, lineHeight: 20, marginTop: 8, paddingLeft: 28 }}>{faq.a}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
        <WebFooter />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8E7' }} edges={['top']}>
      <LinearGradient colors={['#1A0C07', '#3D1408', '#7A3020']} style={{ paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 }}>Contact Us</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {CONTACTS.map((c) => (
          <TouchableOpacity
            key={c.label}
            onPress={c.action}
            disabled={!c.action}
            style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: 'rgba(230,126,34,0.15)' }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.color + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={c.icon as any} size={22} color={c.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#aaa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>{c.label}</Text>
              <Text style={{ color: '#4A2C2A', fontSize: 15, fontWeight: '700', marginTop: 2 }}>{c.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={{ color: '#4A2C2A', fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 12 }}>FAQs</Text>
        {FAQS.map((faq) => (
          <View key={faq.q} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(230,126,34,0.12)' }}>
            <Text style={{ color: '#4A2C2A', fontSize: 14, fontWeight: '700', marginBottom: 6 }}>{faq.q}</Text>
            <Text style={{ color: '#7A6A5A', fontSize: 13, lineHeight: 19 }}>{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { paddingVertical: 56, paddingHorizontal: 24, overflow: 'hidden' },
  heroOm: { position: 'absolute', right: 0, top: -20, fontSize: 260, color: 'rgba(255,255,255,0.04)', fontWeight: '400' } as any,
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  heroTitle: { color: '#fff', fontSize: 48, fontWeight: '900', lineHeight: 56 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 17, marginTop: 10, maxWidth: 520, lineHeight: 27 },
  sectionTitle: { color: '#4A2C2A', fontSize: 26, fontWeight: '900', borderLeftWidth: 4, borderLeftColor: SAFFRON, paddingLeft: 14 },
  label: { fontSize: 11, fontWeight: '700', color: '#7A6A5A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderWidth: 1.5, borderColor: 'rgba(230,126,34,0.25)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#4A2C2A', backgroundColor: '#FAFAF5',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  } as any,
});
