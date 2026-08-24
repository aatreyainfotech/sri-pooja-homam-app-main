import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, apiError } from '../../src/services/api';
import { theme } from '../../src/constants/theme';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import Surface from '../../src/components/ui/Surface';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import Chip from '../../src/components/ui/Chip';

type Audience = 'all' | 'devotee' | 'poojari' | 'admin' | 'hotel_manager';

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'all', label: 'All Users' },
  { value: 'devotee', label: 'Devotees' },
  { value: 'poojari', label: 'Poojaris' },
  { value: 'admin', label: 'Admins' },
  { value: 'hotel_manager', label: 'Hotel Managers' },
];

export default function AdminNotifications() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; total_tokens?: number; audience?: string; reason?: string } | null>(null);

  const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label ?? 'All Users';

  const send = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Enter both a title and a message.');
      return;
    }
    if (image.trim() && !image.trim().toLowerCase().startsWith('https://')) {
      Alert.alert('Invalid Image URL', 'The image must be a public HTTPS link — a device photo or http:// link won\'t render in the notification.');
      return;
    }
    Alert.alert(
      `Send to ${audienceLabel}?`,
      `This will push "${title.trim()}" to every registered device in this group. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', style: 'destructive', onPress: doSend },
      ]
    );
  };

  const doSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const { data } = await api.post('/admin/broadcast-notification', {
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
        image: image.trim() || undefined,
        audience,
      });
      setResult(data);
      if (data.ok) {
        setTitle('');
        setBody('');
        setUrl('');
        setImage('');
      }
    } catch (e) {
      setResult({ ok: false, reason: apiError(e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader
        title="Send Notification"
        subtitle="Broadcast a push notification to devotees, poojaris, or admins"
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, alignItems: 'center' }}>
        <ResponsiveContainer maxWidth={560}>
          <Surface elevation="sm" padding="lg" radius="lg">
            <Text style={{ fontFamily: theme.font.body, fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs + 2 }}>
              Send To
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              {AUDIENCES.map((a) => (
                <Chip
                  key={a.value}
                  testID={`admin-notif-audience-${a.value}`}
                  label={a.label}
                  selected={audience === a.value}
                  onPress={() => setAudience(a.value)}
                />
              ))}
            </View>

            <Input
              label="Title"
              icon="megaphone-outline"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. New Diwali Poojas Now Open"
              maxLength={65}
            />
            <Input
              label="Message"
              icon="chatbubble-ellipses-outline"
              value={body}
              onChangeText={setBody}
              placeholder="What should devotees know?"
              multiline
              containerStyle={{ marginBottom: theme.spacing.md }}
            />
            <Input
              label="Deep link (optional)"
              icon="link-outline"
              value={url}
              onChangeText={setUrl}
              placeholder="/(tabs)/temples"
              autoCapitalize="none"
            />
            <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md }}>
              Where tapping the notification takes the user. Defaults to the home tab.
            </Text>

            <Input
              label="Image URL (optional)"
              icon="image-outline"
              value={image}
              onChangeText={setImage}
              placeholder="https://example.com/photo.jpg"
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md }}>
              Must be a public HTTPS link — a photo picked from this device won't work, since the
              notification is rendered outside the app by Apple/Google's servers. Shown as a rich
              image on supported devices.
            </Text>
            {!!image.trim() && image.trim().toLowerCase().startsWith('https://') && (
              <Image
                source={{ uri: image.trim() }}
                style={{ width: '100%', height: 140, borderRadius: theme.radius.md, marginBottom: theme.spacing.md, backgroundColor: theme.colors.bgPaper }}
                resizeMode="cover"
              />
            )}

            <Button
              testID="admin-notif-send-btn"
              title={`Send to ${audienceLabel}`}
              icon="send"
              variant="primary"
              size="lg"
              fullWidth
              loading={sending}
              onPress={send}
            />
          </Surface>

          {result && (
            <Surface
              elevation="sm"
              padding="md"
              radius="lg"
              style={{
                marginTop: theme.spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                backgroundColor: result.ok ? '#E8F5E9' : '#FFEBEE',
                borderColor: result.ok ? '#A5D6A7' : '#EF9A9A',
              }}
            >
              <Ionicons
                name={result.ok ? 'checkmark-circle' : 'close-circle'}
                size={28}
                color={result.ok ? '#2E7D32' : '#C62828'}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: result.ok ? '#1B5E20' : '#B71C1C' }}>
                  {result.ok ? 'Notification sent' : 'Send failed'}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                  {result.ok
                    ? `Delivered to ${result.total_tokens ?? 0} device(s) — ${AUDIENCES.find((a) => a.value === result.audience)?.label ?? 'All Users'}.`
                    : result.reason || 'No devices are registered for push notifications yet.'}
                </Text>
              </View>
            </Surface>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
