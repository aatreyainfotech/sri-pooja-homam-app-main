import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

type Btn = { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };
type AlertOpts = { title: string; message?: string; buttons?: Btn[] };

let setAlertState: ((v: AlertOpts | null) => void) | null = null;

export const appAlert = (title: string, message?: string, buttons?: Btn[]) => {
  if (setAlertState) {
    setAlertState({ title, message, buttons });
  } else {
    // Fallback to console if host not mounted yet
    console.warn('[AppAlert]', title, message);
  }
};

// Monkey-patch React Native's Alert.alert so all existing callsites use the modal
try {
  (Alert as any).alert = (title: string, message?: string, buttons?: Btn[]) => {
    appAlert(title, message, buttons);
  };
} catch {}

const iconFor = (title: string) => {
  const t = (title || '').toLowerCase();
  if (t.includes('success') || t.includes('done') || t.includes('confirmed') || t.includes('reset!')) return { name: 'checkmark-circle', color: '#2E7D32' };
  if (t.includes('fail') || t.includes('error') || t.includes('invalid')) return { name: 'close-circle', color: '#C62828' };
  if (t.includes('required') || t.includes('warn')) return { name: 'warning', color: '#E65100' };
  if (t.includes('sign out') || t.includes('end ') || t.includes('delete')) return { name: 'help-circle', color: theme.colors.primary };
  return { name: 'information-circle', color: theme.colors.primary };
};

export function AppAlertHost() {
  const [s, setS] = useState<AlertOpts | null>(null);
  useEffect(() => { setAlertState = setS; return () => { setAlertState = null; }; }, []);

  const close = () => setS(null);
  const press = (b: Btn) => { close(); setTimeout(() => b.onPress?.(), 0); };

  const buttons: Btn[] = s?.buttons && s.buttons.length > 0 ? s.buttons : [{ text: 'OK', style: 'default' }];
  const icon = s ? iconFor(s.title) : null;

  return (
    <Modal visible={!!s} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: icon.color + '15' }]}>
              <Ionicons name={icon.name as any} size={36} color={icon.color} />
            </View>
          ) : null}
          <Text style={styles.title}>{s?.title}</Text>
          {s?.message ? <Text style={styles.msg}>{s.message}</Text> : null}
          <View style={[styles.actions, buttons.length > 2 && { flexDirection: 'column' }]}>
            {buttons.map((b, i) => {
              const isDest = b.style === 'destructive';
              const isCancel = b.style === 'cancel';
              const isPrimary = !isDest && !isCancel;
              return (
                <TouchableOpacity
                  key={`${b.text}-${i}`}
                  onPress={() => press(b)}
                  style={[
                    styles.btn,
                    isPrimary && styles.btnPrimary,
                    isCancel && styles.btnCancel,
                    isDest && styles.btnDest,
                  ]}
                >
                  <Text style={[
                    styles.btnText,
                    isPrimary && styles.btnTextPrimary,
                    isCancel && styles.btnTextCancel,
                    isDest && styles.btnTextDest,
                  ]}>{b.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 28 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 22, alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  msg: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnCancel: { backgroundColor: '#F0F0F0' },
  btnDest: { backgroundColor: '#C62828' },
  btnText: { fontWeight: '700', fontSize: 14 },
  btnTextPrimary: { color: '#fff' },
  btnTextCancel: { color: theme.colors.textSecondary },
  btnTextDest: { color: '#fff' },
});
