import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
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

export default function AdminNotifications() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; total_tokens?: number; reason?: string } | null>(null);

  const send = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Enter both a title and a message.');
      return;
    }
    Alert.alert(
      'Send to all users?',
      `This will push "${title.trim()}" to every device currently registered for notifications. This can't be undone.`,
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
      });
      setResult(data);
      if (data.ok) {
        setTitle('');
        setBody('');
        setUrl('');
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
        subtitle="Broadcast a push notification to every registered device"
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, alignItems: 'center' }}>
        <ResponsiveContainer maxWidth={560}>
          <Surface elevation="sm" padding="lg" radius="lg">
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
            <Button
              testID="admin-notif-send-btn"
              title="Send to All Users"
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
                    ? `Delivered to ${result.total_tokens ?? 0} registered device(s).`
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
