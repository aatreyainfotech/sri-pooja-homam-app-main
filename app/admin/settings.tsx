import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, Platform, ActivityIndicator, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

const STORAGE_KEY = 'sph_platform_settings';

const GOLD   = '#D4AF37';
const MAROON = '#7A3020';
const DARK   = '#1A0C07';
const IS_WEB = Platform.OS === 'web';

/* ── Types ─────────────────────────────────────────────────────────────── */
type Plan = {
  id: string; name: string; price: string; period: string;
  badge: string; description: string; features: string[]; popular: boolean;
};
type ShowcaseItem = { id: string; name: string; url: string; description: string };
type ServiceCard = { id: string; icon: string; title: string; desc: string };
type DestItem = { id: string; name: string; state: string; color: string; route: string; photo?: string };
type TabId = 'general' | 'branding' | 'hero' | 'sections' | 'destinations' | 'services' | 'pricing' | 'showcase' | 'contact' | 'social' | 'seo' | 'features';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'general',  label: 'General',        icon: 'settings-outline' },
  { id: 'branding', label: 'Brand Colors',   icon: 'color-palette-outline' },
  { id: 'hero',     label: 'Hero Text',      icon: 'home-outline' },
  { id: 'sections',      label: 'Home Sections',     icon: 'grid-outline' },
  { id: 'destinations',  label: 'Destinations',       icon: 'location-outline' },
  { id: 'services',      label: 'Platform Features',  icon: 'apps-outline' },
  { id: 'pricing',  label: 'Pricing Plans',  icon: 'pricetag-outline' },
  { id: 'showcase', label: 'Live Showcase',  icon: 'star-outline' },
  { id: 'contact',  label: 'Contact Info',   icon: 'call-outline' },
  { id: 'social',   label: 'Social Media',   icon: 'share-social-outline' },
  { id: 'seo',      label: 'SEO',            icon: 'search-outline' },
  { id: 'features', label: 'Feature Toggles',icon: 'toggle-outline' },
];

const DEFAULT_SETTINGS = {
  // General
  platformName: 'Sri Pooja Homam',
  tagline: 'Book Sacred Poojas & Homams Online',
  company: 'Aatreya Infotech Systems LLP',
  phone: '+91 83090 67121',
  whatsapp: '918309067121',
  supportEmail: 'support@sri.aatreya.org',
  salesEmail: 'sales@sri.aatreya.org',
  address: 'Hyderabad, Telangana, India',
  copyright: '© 2025 Sri Pooja Homam. All rights reserved.',
  // Branding
  primaryColor: '#7A3020',
  secondaryColor: '#C9922A',
  accentColor: '#D4AF37',
  bgColor: '#FFFFFF',
  // Hero
  heroTitle: 'Sri Pooja Homam',
  heroTelugu: 'శ్రీ పూజా హోమం',
  heroSubtitle: 'Book sacred poojas and homams with verified pujaris.',
  heroDesc: 'Experience the grace of ancient Vedic rituals from your home.',
  cta1Text: 'Book a Pooja Now',
  cta1Route: '/(tabs)/temples',
  cta2Text: 'Watch Live Darshan',
  cta2Route: '/(tabs)/live',
  // Pricing
  plans: [
    {
      id: 'starter', name: '1 Year Starter', price: '24999', period: '/year',
      badge: '', description: 'Perfect for small temples and pujaris just going digital.',
      features: ['1 Temple listing', 'Up to 5 poojas', 'Basic live streaming', 'Booking management'],
      popular: false,
    },
    {
      id: 'pro', name: 'Pro Plan', price: '49999', period: '/year',
      badge: 'Most Popular', description: 'For established temples with active devotee base.',
      features: ['Unlimited temple listings', 'Unlimited poojas', 'HD live streaming', 'Priority support', 'Analytics dashboard'],
      popular: true,
    },
  ] as Plan[],
  // Live Showcase
  showcase: [
    { id: '1', name: 'Tirumala Tirupati Live', url: 'https://www.tirumala.org', description: 'Live Darshan from Tirumala' },
    { id: '2', name: 'Shirdi Sai Baba', url: 'https://sai.org.in', description: 'Live aarti from Shirdi' },
  ] as ShowcaseItem[],
  // Contact
  supportPhone: '+91 83090 67121',
  emergencyPhone: '',
  officeAddress: 'Hyderabad, Telangana, India',
  businessHours: 'Mon–Sat: 9:00 AM – 6:00 PM IST',
  // Social
  facebook: 'https://facebook.com/sripoojahomam',
  instagram: 'https://instagram.com/sripoojahomam',
  youtube: 'https://youtube.com/@sripoojahomam',
  twitter: '',
  telegram: '',
  linkedin: '',
  // SEO
  metaTitle: 'Sri Pooja Homam – Book Sacred Poojas & Homams Online',
  metaDesc: 'Book temple poojas, homams, and live darshan with verified pujaris across India.',
  metaKeywords: 'pooja booking, homam online, temple darshan, pujari booking, vedic rituals',
  // Home Sections — titles & subtitles
  secDestTitle: 'Popular Destinations',
  secDestSub: 'Sacred pilgrimage cities across India',
  secLiveTitle: 'Live Darshan',
  secLiveSub: 'Sacred rituals streaming now',
  secTemplesTitle: 'Featured Temples',
  secTemplesSub: 'Sacred shrines across India',
  secPoojasTitle: 'Book a Pooja or Homam',
  secPoojasSub: 'Performed by verified Vedic pujaris',
  secFestTitle: 'Festival Highlights',
  secFestSub: 'Upcoming sacred festivals & celebrations',
  secAccTitle: 'Temple Accommodation',
  secAccSub: 'Stay near the divine — hotels & dharamshalas near temples',
  secWhyTitle: 'Why Choose Sri Pooja Homam?',
  secWhySub: 'Trusted by thousands of devotees across India',
  secPlatTitle: 'PLATFORM FEATURES',
  secPlatSub: 'Everything for Your Spiritual Journey',
  secPlatDesc: 'One platform. Every sacred service your devotion needs.',

  // Popular Destinations
  destinations: [
    { id: '1', name: 'Tirupati',   state: 'Andhra Pradesh', color: '#FF5722', route: '/destinations?state=andhra-pradesh', photo: '' },
    { id: '2', name: 'Varanasi',   state: 'Uttar Pradesh',  color: '#9C27B0', route: '/destinations?state=uttar-pradesh',  photo: '' },
    { id: '3', name: 'Rishikesh',  state: 'Uttarakhand',    color: '#00BCD4', route: '/destinations?state=uttarakhand',    photo: '' },
    { id: '4', name: 'Shirdi',     state: 'Maharashtra',    color: '#FF9800', route: '/destinations?state=maharashtra',    photo: '' },
    { id: '5', name: 'Madurai',    state: 'Tamil Nadu',     color: '#E91E63', route: '/destinations?state=tamil-nadu',     photo: '' },
    { id: '6', name: 'Udupi',      state: 'Karnataka',      color: '#4CAF50', route: '/destinations?state=karnataka',      photo: '' },
    { id: '7', name: 'Dwarka',     state: 'Gujarat',        color: '#2196F3', route: '/destinations?state=gujarat',        photo: '' },
    { id: '8', name: 'Guruvayur',  state: 'Kerala',         color: '#8BC34A', route: '/destinations?state=kerala',         photo: '' },
  ] as DestItem[],

  // Service Cards (Platform Features section)
  services: [
    { id: '1', icon: 'flower-outline',   title: 'Book Pooja',     desc: 'Perform sacred poojas at home or at the temple with verified Vedic pujaris.' },
    { id: '2', icon: 'flame-outline',    title: 'Perform Homam',  desc: 'Sacred fire rituals for prosperity, health and removal of obstacles.' },
    { id: '3', icon: 'videocam-outline', title: 'Live Darshan',   desc: 'Watch sacred rituals streaming live from temples across India.' },
    { id: '4', icon: 'home-outline',     title: 'Pujari at Home', desc: 'Invite a qualified pujari to your home for all auspicious occasions.' },
  ] as ServiceCard[],

  // Features
  enableRegistration: true,
  enableLiveStreams: true,
  enableBookings: true,
  enableAccommodation: true,
  enableBlog: true,
  enableNotifications: true,
  enableWhatsApp: true,
  maintenanceMode: false,
};

/* ── Field row helpers ─────────────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, multi, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multi?: boolean; hint?: string;
}) {
  return (
    <View style={f.row}>
      <Text style={f.label}>{label}</Text>
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
      <TextInput
        style={[f.input, multi && f.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || label}
        placeholderTextColor="#aaa"
        multiline={multi}
        numberOfLines={multi ? 4 : 1}
      />
    </View>
  );
}

function Toggle({ label, value, onChange, desc }: {
  label: string; value: boolean; onChange: (v: boolean) => void; desc?: string;
}) {
  return (
    <View style={f.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={f.toggleLabel}>{label}</Text>
        {desc ? <Text style={f.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#ccc', true: GOLD + '88' }}
        thumbColor={value ? GOLD : '#888'}
      />
    </View>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <View style={{ width: 3, height: 20, backgroundColor: GOLD, borderRadius: 2 }} />
        <Text style={f.sectionTitle}>{title}</Text>
      </View>
      {sub ? <Text style={f.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={f.colorRow}>
      <View style={[f.colorSwatch, { backgroundColor: value }]} />
      <View style={{ flex: 1 }}>
        <Text style={f.label}>{label}</Text>
        <TextInput
          style={f.colorInput}
          value={value}
          onChangeText={onChange}
          placeholder="#000000"
          placeholderTextColor="#aaa"
          maxLength={7}
        />
      </View>
    </View>
  );
}

/* ── Tab: General ──────────────────────────────────────────────────────── */
function GeneralTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Platform Identity" sub="Basic details shown across the website" />
      <Field label="Platform Name" value={s.platformName} onChange={v => set('platformName', v)} />
      <Field label="Tagline" value={s.tagline} onChange={v => set('tagline', v)} hint="Shown in announcement strip" />
      <Field label="Company / Legal Name" value={s.company} onChange={v => set('company', v)} />
      <Field label="Copyright Text" value={s.copyright} onChange={v => set('copyright', v)} />

      <View style={f.divider} />
      <SectionTitle title="Contact Details" sub="Shown in footer and contact page" />
      <Field label="Primary Phone" value={s.phone} onChange={v => set('phone', v)} placeholder="+91 XXXXX XXXXX" />
      <Field label="WhatsApp Number" value={s.whatsapp} onChange={v => set('whatsapp', v)} hint="Digits only, with country code" placeholder="91XXXXXXXXXX" />
      <Field label="Support Email" value={s.supportEmail} onChange={v => set('supportEmail', v)} />
      <Field label="Sales Email" value={s.salesEmail} onChange={v => set('salesEmail', v)} />
      <Field label="Office Address" value={s.address} onChange={v => set('address', v)} multi />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Branding ─────────────────────────────────────────────────────── */
function BrandingTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Brand Colors" sub="Enter hex codes (e.g. #C9922A)" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <ColorField label="Primary Color (Nav, Buttons)" value={s.primaryColor} onChange={v => set('primaryColor', v)} />
        <ColorField label="Secondary Color (Gold Accents)" value={s.secondaryColor} onChange={v => set('secondaryColor', v)} />
        <ColorField label="Accent / Gold" value={s.accentColor} onChange={v => set('accentColor', v)} />
        <ColorField label="Background Color" value={s.bgColor} onChange={v => set('bgColor', v)} />
      </View>

      <View style={f.divider} />
      <SectionTitle title="Color Preview" />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Primary', color: s.primaryColor },
          { label: 'Secondary', color: s.secondaryColor },
          { label: 'Accent', color: s.accentColor },
          { label: 'Background', color: s.bgColor },
        ].map(item => (
          <View key={item.label} style={{ alignItems: 'center', gap: 8 }}>
            <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: item.color, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
            <Text style={{ color: '#555', fontSize: 12 }}>{item.label}</Text>
            <Text style={{ color: '#888', fontSize: 11 }}>{item.color}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Hero Text ────────────────────────────────────────────────────── */
function HeroTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Hero Section" sub="The large banner at the top of the home page" />
      <Field label="Main Title (English)" value={s.heroTitle} onChange={v => set('heroTitle', v)} />
      <Field label="Title (Telugu)" value={s.heroTelugu} onChange={v => set('heroTelugu', v)} />
      <Field label="Subtitle Line 1" value={s.heroSubtitle} onChange={v => set('heroSubtitle', v)} />
      <Field label="Subtitle Line 2" value={s.heroDesc} onChange={v => set('heroDesc', v)} />

      <View style={f.divider} />
      <SectionTitle title="CTA Buttons" sub="The two call-to-action buttons in the hero" />
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Field label="Button 1 Text" value={s.cta1Text} onChange={v => set('cta1Text', v)} />
          <Field label="Button 1 Route" value={s.cta1Route} onChange={v => set('cta1Route', v)} hint="e.g. /(tabs)/temples" />
        </View>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Field label="Button 2 Text" value={s.cta2Text} onChange={v => set('cta2Text', v)} />
          <Field label="Button 2 Route" value={s.cta2Route} onChange={v => set('cta2Route', v)} hint="e.g. /(tabs)/live" />
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Pricing Plans ────────────────────────────────────────────────── */
function PricingTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  const plans: Plan[] = s.plans;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const updatePlan = (idx: number, key: keyof Plan, val: any) => {
    const updated = plans.map((p, i) => i === idx ? { ...p, [key]: val } : p);
    set('plans', updated);
  };

  const addFeature = (idx: number) => {
    const updated = plans.map((p, i) => i === idx ? { ...p, features: [...p.features, ''] } : p);
    set('plans', updated);
  };

  const updateFeature = (planIdx: number, featIdx: number, val: string) => {
    const updated = plans.map((p, i) => {
      if (i !== planIdx) return p;
      const feats = p.features.map((f, fi) => fi === featIdx ? val : f);
      return { ...p, features: feats };
    });
    set('plans', updated);
  };

  const removeFeature = (planIdx: number, featIdx: number) => {
    const updated = plans.map((p, i) => {
      if (i !== planIdx) return p;
      return { ...p, features: p.features.filter((_, fi) => fi !== featIdx) };
    });
    set('plans', updated);
  };

  const addPlan = () => {
    set('plans', [...plans, {
      id: Date.now().toString(), name: 'New Plan', price: '9999', period: '/year',
      badge: '', description: '', features: ['Feature 1'], popular: false,
    }]);
    setOpenIdx(plans.length);
  };

  const removePlan = (idx: number) => {
    set('plans', plans.filter((_, i) => i !== idx));
    setOpenIdx(null);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Pricing Plans" sub="Manage subscription plans shown on the website" />

      {plans.map((plan, idx) => (
        <View key={plan.id} style={f.planCard}>
          {/* Plan header (toggle) */}
          <TouchableOpacity
            style={f.planHeader}
            onPress={() => setOpenIdx(openIdx === idx ? null : idx)}
          >
            <View style={f.planHeaderLeft}>
              <View style={[f.planBadge, { backgroundColor: plan.popular ? GOLD : '#eee' }]}>
                <Text style={{ color: plan.popular ? '#1A0C07' : '#888', fontSize: 10, fontWeight: '800' }}>
                  {plan.popular ? 'POPULAR' : 'STANDARD'}
                </Text>
              </View>
              <Text style={f.planName}>{plan.name}</Text>
              <Text style={f.planPrice}>₹{plan.price}{plan.period}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={() => removePlan(idx)} style={f.deleteBtn}>
                <Ionicons name="trash-outline" size={15} color="#E53935" />
              </TouchableOpacity>
              <Ionicons name={openIdx === idx ? 'chevron-up' : 'chevron-down'} size={18} color="#666" />
            </View>
          </TouchableOpacity>

          {openIdx === idx && (
            <View style={f.planBody}>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 160 }}>
                  <Field label="Plan Name" value={plan.name} onChange={v => updatePlan(idx, 'name', v)} />
                </View>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Field label="Price (₹)" value={plan.price} onChange={v => updatePlan(idx, 'price', v)} />
                </View>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Field label="Period Label" value={plan.period} onChange={v => updatePlan(idx, 'period', v)} placeholder="/year" />
                </View>
              </View>
              <Field label="Badge (optional)" value={plan.badge} onChange={v => updatePlan(idx, 'badge', v)} placeholder="Most Popular / Best Value" />
              <Field label="Description" value={plan.description} onChange={v => updatePlan(idx, 'description', v)} multi />

              <Toggle label="Mark as Popular Plan" value={plan.popular} onChange={v => updatePlan(idx, 'popular', v)} />

              <Text style={[f.label, { marginTop: 16, marginBottom: 8 }]}>FEATURES</Text>
              {plan.features.map((feat, fi) => (
                <View key={fi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="checkmark" size={14} color={GOLD} />
                  <TextInput
                    style={[f.input, { flex: 1, marginBottom: 0 }]}
                    value={feat}
                    onChangeText={v => updateFeature(idx, fi, v)}
                    placeholder="Feature description"
                    placeholderTextColor="#aaa"
                  />
                  <TouchableOpacity onPress={() => removeFeature(idx, fi)}>
                    <Ionicons name="close-circle" size={18} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={f.addFeatureBtn} onPress={() => addFeature(idx)}>
                <Ionicons name="add" size={16} color={GOLD} />
                <Text style={{ color: GOLD, fontSize: 13, fontWeight: '700' }}>Add Feature</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={f.addPlanBtn} onPress={addPlan}>
        <Ionicons name="add-circle" size={20} color={GOLD} />
        <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Add New Plan</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Live Showcase ────────────────────────────────────────────────── */
function ShowcaseTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  const items: ShowcaseItem[] = s.showcase;

  const update = (idx: number, key: keyof ShowcaseItem, val: string) => {
    set('showcase', items.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };
  const add = () => set('showcase', [...items, { id: Date.now().toString(), name: '', url: '', description: '' }]);
  const remove = (idx: number) => set('showcase', items.filter((_, i) => i !== idx));

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Live Showcase" sub="Featured temple sites or live stream links shown on the platform" />
      {items.map((item, idx) => (
        <View key={item.id} style={f.showcaseCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: DARK, fontWeight: '800', fontSize: 14 }}>Showcase #{idx + 1}</Text>
            <TouchableOpacity onPress={() => remove(idx)}>
              <Ionicons name="trash-outline" size={16} color="#E53935" />
            </TouchableOpacity>
          </View>
          <Field label="Name" value={item.name} onChange={v => update(idx, 'name', v)} />
          <Field label="URL" value={item.url} onChange={v => update(idx, 'url', v)} placeholder="https://..." />
          <Field label="Description" value={item.description} onChange={v => update(idx, 'description', v)} multi />
        </View>
      ))}
      <TouchableOpacity style={f.addPlanBtn} onPress={add}>
        <Ionicons name="add-circle" size={20} color={GOLD} />
        <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Add Showcase Item</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Contact Info ─────────────────────────────────────────────────── */
function ContactTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Contact Information" sub="Shown on contact page and footer" />
      <Field label="Support Phone" value={s.supportPhone} onChange={v => set('supportPhone', v)} />
      <Field label="Emergency / WhatsApp" value={s.whatsapp} onChange={v => set('whatsapp', v)} hint="Digits only with country code" />
      <Field label="Support Email" value={s.supportEmail} onChange={v => set('supportEmail', v)} />
      <Field label="Office Address" value={s.officeAddress} onChange={v => set('officeAddress', v)} multi />
      <Field label="Business Hours" value={s.businessHours} onChange={v => set('businessHours', v)} placeholder="Mon–Sat: 9:00 AM – 6:00 PM" />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Social Media ─────────────────────────────────────────────────── */
function SocialTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  const socials = [
    { key: 'facebook',  label: 'Facebook',  icon: 'logo-facebook',  color: '#1877F2' },
    { key: 'instagram', label: 'Instagram', icon: 'logo-instagram',  color: '#E1306C' },
    { key: 'youtube',   label: 'YouTube',   icon: 'logo-youtube',    color: '#FF0000' },
    { key: 'twitter',   label: 'X (Twitter)',icon: 'logo-twitter',   color: '#1DA1F2' },
    { key: 'telegram',  label: 'Telegram',  icon: 'paper-plane-outline', color: '#0088CC' },
    { key: 'linkedin',  label: 'LinkedIn',  icon: 'logo-linkedin',   color: '#0A66C2' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Social Media Links" sub="Leave blank to hide icons in footer" />
      {socials.map(({ key, label, icon, color }) => (
        <View key={key} style={f.socialRow}>
          <View style={[f.socialIcon, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon as any} size={20} color={color} />
          </View>
          <TextInput
            style={[f.input, { flex: 1, marginBottom: 0 }]}
            value={(s as any)[key]}
            onChangeText={v => set(key, v)}
            placeholder={`${label} URL`}
            placeholderTextColor="#aaa"
          />
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: SEO ──────────────────────────────────────────────────────────── */
function SEOTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="SEO Settings" sub="Search engine and social sharing meta tags" />
      <Field label="Meta Title" value={s.metaTitle} onChange={v => set('metaTitle', v)} hint={`${s.metaTitle.length}/60 chars`} />
      <Field label="Meta Description" value={s.metaDesc} onChange={v => set('metaDesc', v)} multi hint={`${s.metaDesc.length}/160 chars`} />
      <Field label="Meta Keywords" value={s.metaKeywords} onChange={v => set('metaKeywords', v)} hint="Comma separated keywords" multi />

      <View style={f.divider} />
      <SectionTitle title="Character Limits" />
      <View style={{ gap: 8 }}>
        {[
          { label: 'Meta Title', value: s.metaTitle.length, max: 60 },
          { label: 'Meta Description', value: s.metaDesc.length, max: 160 },
        ].map(item => (
          <View key={item.label} style={f.progressRow}>
            <Text style={f.progressLabel}>{item.label}</Text>
            <View style={f.progressBar}>
              <View style={[f.progressFill, {
                width: `${Math.min((item.value / item.max) * 100, 100)}%` as any,
                backgroundColor: item.value > item.max ? '#E53935' : GOLD,
              }]} />
            </View>
            <Text style={[f.progressCount, { color: item.value > item.max ? '#E53935' : '#888' }]}>
              {item.value}/{item.max}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Feature Toggles ──────────────────────────────────────────────── */
/* ── Tab: Home Sections ────────────────────────────────────────────────── */
function SectionsTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  const sections = [
    { keyT: 'secDestTitle',    keyS: 'secDestSub',    label: 'Popular Destinations' },
    { keyT: 'secLiveTitle',    keyS: 'secLiveSub',    label: 'Live Darshan' },
    { keyT: 'secTemplesTitle', keyS: 'secTemplesSub', label: 'Featured Temples' },
    { keyT: 'secPoojasTitle',  keyS: 'secPoojasSub',  label: 'Book a Pooja / Homam' },
    { keyT: 'secFestTitle',    keyS: 'secFestSub',    label: 'Festival Highlights' },
    { keyT: 'secAccTitle',     keyS: 'secAccSub',     label: 'Temple Accommodation' },
    { keyT: 'secWhyTitle',     keyS: 'secWhySub',     label: 'Why Choose Us' },
    { keyT: 'secPlatTitle',    keyS: 'secPlatSub',    label: 'Platform Features (overline)' },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Home Page Section Titles" sub="Edit the heading and subtitle for each homepage section" />
      {sections.map(({ keyT, keyS, label }) => (
        <View key={keyT} style={f.sectionCard}>
          <Text style={f.sectionCardLabel}>{label}</Text>
          <Field label="Title" value={(s as any)[keyT]} onChange={v => set(keyT, v)} />
          <Field label="Subtitle" value={(s as any)[keyS]} onChange={v => set(keyS, v)} />
        </View>
      ))}
      <View style={f.divider} />
      <SectionTitle title="Platform Features Block" sub="The description text under the overline" />
      <Field label="Description Line" value={s.secPlatDesc} onChange={v => set('secPlatDesc', v)} multi />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Service Cards (Platform Features) ────────────────────────────── */
function ServicesTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  const items: ServiceCard[] = s.services;

  const update = (idx: number, key: keyof ServiceCard, val: string) => {
    set('services', items.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };
  const add = () => set('services', [...items, { id: Date.now().toString(), icon: 'star-outline', title: '', desc: '' }]);
  const remove = (idx: number) => set('services', items.filter((_, i) => i !== idx));

  const ICONS = ['flower-outline','flame-outline','videocam-outline','home-outline','star-outline','heart-outline','people-outline','book-outline','musical-notes-outline','sunny-outline'];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Platform Feature Cards" sub="The icon-grid cards shown in the 'Platform Features' section" />
      {items.map((item, idx) => (
        <View key={item.id} style={f.showcaseCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: GOLD + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={item.icon as any} size={18} color={GOLD} />
              </View>
              <Text style={{ color: DARK, fontWeight: '800', fontSize: 14 }}>Card #{idx + 1}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(idx)}>
              <Ionicons name="trash-outline" size={16} color="#E53935" />
            </TouchableOpacity>
          </View>
          <Field label="Title" value={item.title} onChange={v => update(idx, 'title', v)} />
          <Field label="Description" value={item.desc} onChange={v => update(idx, 'desc', v)} multi />
          <View style={f.row}>
            <Text style={f.label}>Icon Name</Text>
            <Text style={f.hint}>Choose from: {ICONS.join(', ')}</Text>
            <TextInput
              style={f.input}
              value={item.icon}
              onChangeText={v => update(idx, 'icon', v)}
              placeholder="e.g. flower-outline"
              placeholderTextColor="#aaa"
            />
          </View>
          {/* Icon preview row */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {ICONS.map(ic => (
              <TouchableOpacity key={ic} onPress={() => update(idx, 'icon', ic)}
                style={{ padding: 8, borderRadius: 8, borderWidth: 1.5, borderColor: item.icon === ic ? GOLD : '#DDD', backgroundColor: item.icon === ic ? GOLD + '18' : '#fff' }}>
                <Ionicons name={ic as any} size={18} color={item.icon === ic ? GOLD : '#888'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      <TouchableOpacity style={f.addPlanBtn} onPress={add}>
        <Ionicons name="add-circle" size={20} color={GOLD} />
        <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Add Feature Card</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Tab: Destinations ─────────────────────────────────────────────────── */
function DestinationsTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  const items: DestItem[] = (s as any).destinations || [];

  const update = (id: string, key: string, val: string) =>
    set('destinations', items.map(d => d.id === id ? { ...d, [key]: val } : d));

  const remove = (id: string) =>
    set('destinations', items.filter(d => d.id !== id));

  const add = () => set('destinations', [...items, {
    id: Date.now().toString(), name: 'New City', state: 'State Name',
    color: '#C9922A', route: '/destinations', photo: '',
  }]);

  const pickPhoto = (id: string) => {
    if (!IS_WEB) return;
    const input = (document as any).createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new (window as any).FileReader();
      reader.onload = (ev: any) => update(id, 'photo', ev.target.result);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Popular Destinations" sub="Cities shown in the Popular Destinations section on the homepage" />
      {items.map((item) => (
        <View key={item.id} style={f.showcaseCard}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {/* Photo upload */}
            <TouchableOpacity onPress={() => pickPhoto(item.id)} activeOpacity={0.8} style={{ position: 'relative' }}>
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={{ width: 88, height: 72, borderRadius: 10 }} resizeMode="cover" />
              ) : (
                <View style={{
                  width: 88, height: 72, borderRadius: 10,
                  backgroundColor: item.color + '22',
                  borderWidth: 1.5, borderStyle: 'dashed' as any, borderColor: item.color + '66',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <Ionicons name="camera-outline" size={22} color={item.color} />
                  <Text style={{ color: item.color, fontSize: 9, fontWeight: '800' }}>ADD PHOTO</Text>
                </View>
              )}
              <View style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="pencil" size={10} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Fields */}
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[f.label, { marginBottom: 4 }]}>City Name</Text>
                  <TextInput
                    style={[f.input, { marginBottom: 0 }]}
                    value={item.name}
                    onChangeText={v => update(item.id, 'name', v)}
                    placeholder="e.g. Tirupati"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[f.label, { marginBottom: 4 }]}>State</Text>
                  <TextInput
                    style={[f.input, { marginBottom: 0 }]}
                    value={item.state}
                    onChangeText={v => update(item.id, 'state', v)}
                    placeholder="e.g. Andhra Pradesh"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[f.label, { marginBottom: 4 }]}>Route</Text>
                  <TextInput
                    style={[f.input, { marginBottom: 0 }]}
                    value={item.route}
                    onChangeText={v => update(item.id, 'route', v)}
                    placeholder="/destinations"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <TouchableOpacity onPress={() => remove(item.id)} style={f.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Color */}
          <View style={{ marginTop: 12 }}>
            <ColorField label="Theme Color (hex)" value={item.color} onChange={v => update(item.id, 'color', v)} />
          </View>
        </View>
      ))}

      <TouchableOpacity style={f.addPlanBtn} onPress={add}>
        <Ionicons name="add-circle" size={20} color={GOLD} />
        <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Add Destination</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function FeaturesTab({ s, set }: { s: typeof DEFAULT_SETTINGS; set: (k: string, v: any) => void }) {
  const toggles = [
    { key: 'enableRegistration',  label: 'User Registration',      desc: 'Allow new users to create accounts' },
    { key: 'enableLiveStreams',    label: 'Live Darshan',            desc: 'Enable live temple streaming section' },
    { key: 'enableBookings',      label: 'Pooja Bookings',          desc: 'Allow devotees to book poojas and homams' },
    { key: 'enableAccommodation', label: 'Accommodation',           desc: 'Show hotel and dharamshala listings' },
    { key: 'enableBlog',          label: 'Blog & Articles',         desc: 'Show blog posts and news section' },
    { key: 'enableNotifications', label: 'Push Notifications',      desc: 'Send push notifications to devotees' },
    { key: 'enableWhatsApp',      label: 'WhatsApp Chat Button',    desc: 'Show floating WhatsApp button on website' },
    { key: 'maintenanceMode',     label: '🔧 Maintenance Mode',     desc: 'Show maintenance page to all visitors' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Feature Toggles" sub="Enable or disable platform features" />
      {toggles.map(({ key, label, desc }) => (
        <Toggle
          key={key} label={label} desc={desc}
          value={(s as any)[key]}
          onChange={v => set(key, v)}
        />
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function PlatformSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('general');
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load: backend first (Azure SQL), fall back to local AsyncStorage cache
  useEffect(() => {
    (async () => {
      // Try backend (Azure SQL)
      let backendOk = false;
      try {
        const { data } = await api.get('/admin/platform-settings');
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
          // Update local cache with latest from backend
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...data }));
          backendOk = true;
        }
      } catch {}

      // Fall back to local cache if backend had nothing
      if (!backendOk) {
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const set = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Save to Azure SQL backend
      await api.post('/admin/platform-settings', settings);
      // Also cache locally for offline/fast load
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      // If backend fails, at least save locally
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch {
        Alert.alert('Save Failed', 'Could not save settings. Please try again.');
      }
    }
    setSaving(false);
  };

  if (user?.role !== 'super_admin') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="lock-closed" size={40} color="#ccc" />
        <Text style={{ color: '#888', marginTop: 12, fontSize: 16 }}>Super Admin access required</Text>
      </View>
    );
  }

  const tabContent: Record<TabId, JSX.Element> = {
    general:  <GeneralTab  s={settings} set={set} />,
    branding: <BrandingTab s={settings} set={set} />,
    hero:     <HeroTab     s={settings} set={set} />,
    sections:      <SectionsTab      s={settings} set={set} />,
    destinations:  <DestinationsTab  s={settings} set={set} />,
    services:      <ServicesTab      s={settings} set={set} />,
    pricing:  <PricingTab  s={settings} set={set} />,
    showcase: <ShowcaseTab s={settings} set={set} />,
    contact:  <ContactTab  s={settings} set={set} />,
    social:   <SocialTab   s={settings} set={set} />,
    seo:      <SEOTab      s={settings} set={set} />,
    features: <FeaturesTab s={settings} set={set} />,
  };

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerLabel}>CONFIGURATION</Text>
          <Text style={s.headerTitle}>Platform Settings</Text>
          <Text style={s.headerSub}>Edit brand colors, pricing, hero text, and platform features</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={s.resetBtn}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm('Reset all settings to defaults?')) setSettings({ ...DEFAULT_SETTINGS });
              } else {
                Alert.alert('Reset', 'Reset all settings to defaults?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: () => setSettings({ ...DEFAULT_SETTINGS }) },
                ]);
              }
            }}
          >
            <Ionicons name="refresh-outline" size={15} color={MAROON} />
            <Text style={s.resetBtnText}>Reset Defaults</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#1A0C07" />
            ) : saved ? (
              <><Ionicons name="checkmark" size={15} color="#1A0C07" /><Text style={s.saveBtnText}>Saved!</Text></>
            ) : (
              <><Ionicons name="save-outline" size={15} color="#1A0C07" /><Text style={s.saveBtnText}>Save All Changes</Text></>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab Bar ── */}
      <View style={s.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar}>
          {TABS.map(t => {
            const active = t.id === tab;
            return (
              <TouchableOpacity key={t.id} style={[s.tabBtn, active && s.tabBtnActive]} onPress={() => setTab(t.id)}>
                <Ionicons name={t.icon as any} size={14} color={active ? GOLD : '#888'} />
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={{ color: '#888', marginTop: 12 }}>Loading settings…</Text>
        </View>
      ) : (
        <View style={s.content}>
          {tabContent[tab]}
        </View>
      )}
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F2EC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: 16,
    backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 24,
    borderBottomWidth: 1, borderBottomColor: '#EEE8E0',
    ...(IS_WEB ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any : {}),
  },
  headerLabel: { color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { color: DARK, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  headerSub: { color: '#888', fontSize: 13 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: MAROON, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  resetBtnText: { color: MAROON, fontSize: 13, fontWeight: '700' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GOLD, borderRadius: 8,
    paddingHorizontal: 18, paddingVertical: 9,
    ...(IS_WEB ? { boxShadow: '0 2px 8px rgba(212,175,55,0.35)' } as any : {}),
  },
  saveBtnText: { color: '#1A0C07', fontSize: 13, fontWeight: '800' },

  tabBarWrap: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE8E0',
  },
  tabBar: { flexDirection: 'row', paddingHorizontal: 24, gap: 4, paddingVertical: 6 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: GOLD + '15', borderWidth: 1, borderColor: GOLD + '40' },
  tabLabel: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: DARK, fontWeight: '800' },

  content: { flex: 1, paddingHorizontal: 32, paddingTop: 28 },
});

const f = StyleSheet.create({
  row: { marginBottom: 16 },
  label: { color: '#444', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  hint: { color: '#AAA', fontSize: 11, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#E0D8D0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff', color: '#1A0C07', fontSize: 14,
    marginBottom: 0,
    ...(IS_WEB ? { outlineStyle: 'none' } as any : {}),
  },
  inputMulti: { height: 96, textAlignVertical: 'top' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEE8E0',
  },
  toggleLabel: { color: '#1A0C07', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  toggleDesc: { color: '#888', fontSize: 12 },

  sectionTitle: { color: DARK, fontSize: 16, fontWeight: '900' },
  sectionSub: { color: '#888', fontSize: 12, marginLeft: 13 },

  divider: { height: 1, backgroundColor: '#EEE8E0', marginVertical: 24 },

  colorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE8E0', flex: 1, minWidth: 200,
  },
  colorSwatch: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  colorInput: {
    borderWidth: 1, borderColor: '#E0D8D0', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    color: '#1A0C07', fontSize: 13, fontFamily: 'monospace',
    ...(IS_WEB ? { outlineStyle: 'none' } as any : {}),
  },

  planCard: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE8E0',
    overflow: 'hidden',
    ...(IS_WEB ? { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } as any : {}),
  },
  planHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#FAF6F0',
  },
  planHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  planName: { color: DARK, fontSize: 15, fontWeight: '800', flex: 1 },
  planPrice: { color: MAROON, fontSize: 14, fontWeight: '700' },
  planBody: { padding: 18 },
  deleteBtn: {
    padding: 6, borderRadius: 6,
    backgroundColor: 'rgba(229,57,53,0.08)',
  },

  addFeatureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingVertical: 8,
  },
  addPlanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: GOLD, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 14, justifyContent: 'center',
    marginTop: 8,
  },

  showcaseCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE8E0',
  },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE8E0',
    ...(IS_WEB ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' } as any : {}),
  },
  sectionCardLabel: { color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  socialIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressLabel: { color: '#555', fontSize: 12, width: 130 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#EEE8E0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressCount: { color: '#888', fontSize: 12, width: 48, textAlign: 'right' },
});
