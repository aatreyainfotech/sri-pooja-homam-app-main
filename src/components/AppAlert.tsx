import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

type Btn = { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };
type AlertOpts = { title: string; message?: string; buttons?: Btn[] };
type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastItem = { id: number; title: string; message?: string; type: ToastType };

let setAlertState: ((v: AlertOpts | null) => void) | null = null;
let pushToastFn: ((t: Omit<ToastItem, 'id'>) => void) | null = null;

const toastTypeFor = (title: string): ToastType => {
  const t = (title || '').toLowerCase();
  if (t.includes('success') || t.includes('done') || t.includes('confirmed') || t.includes('saved') || t.includes('reset!') || t.includes('created') || t.includes('assigned') || t.includes('marked') || t.includes('✅')) return 'success';
  if (t.includes('fail') || t.includes('error')) return 'error';
  if (t.includes('required') || t.includes('invalid') || t.includes('warn') || t.includes('weak') || t.includes('permission')) return 'warning';
  return 'info';
};

// A dialog needs the modal (user must choose). Anything else → lightweight toast.
const needsDialog = (buttons?: Btn[]): boolean => {
  if (!buttons || buttons.length === 0) return false;
  if (buttons.length > 1) return true;
  const b = buttons[0];
  return b.style === 'cancel' || b.style === 'destructive';
};

export const appAlert = (title: string, message?: string, buttons?: Btn[]) => {
  if (needsDialog(buttons)) {
    if (setAlertState) { setAlertState({ title, message, buttons }); return; }
  }
  // Informational → toast. Fire a single button's action immediately (e.g. navigate).
  if (buttons && buttons.length === 1 && buttons[0].onPress) {
    setTimeout(() => buttons[0].onPress?.(), 0);
  }
  if (pushToastFn) { pushToastFn({ title, message, type: toastTypeFor(title) }); return; }
  // Fallback if hosts not mounted yet
  if (setAlertState) { setAlertState({ title, message, buttons }); return; }
  console.warn('[AppAlert]', title, message);
};

// Public toast helper for direct use if needed
export const appToast = (title: string, message?: string, type: ToastType = 'info') => {
  if (pushToastFn) pushToastFn({ title, message, type });
};

// Monkey-patch React Native's Alert.alert so all existing callsites use this system
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

const TOAST_STYLE: Record<ToastType, { color: string; icon: string }> = {
  success: { color: '#2E7D32', icon: 'checkmark-circle' },
  error: { color: '#C62828', icon: 'close-circle' },
  warning: { color: '#E65100', icon: 'warning' },
  info: { color: theme.colors.primary, icon: 'information-circle' },
};

function ToastCard({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const s = TOAST_STYLE[item.type];

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', bounciness: 6, speed: 14 }).start();
    const timer = setTimeout(() => dismiss(), 3400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start(() => onDone(item.id));
  };

  return (
    <Animated.View
      style={[
        toast.card,
        { borderLeftColor: s.color },
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}
    >
      <View style={[toast.iconWrap, { backgroundColor: s.color + '18' }]}>
        <Ionicons name={s.icon as any} size={22} color={s.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={toast.title} numberOfLines={2}>{item.title}</Text>
        {item.message ? <Text style={toast.msg} numberOfLines={3}>{item.message}</Text> : null}
      </View>
      <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  useEffect(() => {
    pushToastFn = (t) => {
      const id = idRef.current++;
      setItems((prev) => [...prev.slice(-2), { ...t, id }]);
    };
    return () => { pushToastFn = null; };
  }, []);

  const remove = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  if (items.length === 0) return null;

  const Wrapper: any = View;
  return (
    <Wrapper
      pointerEvents="box-none"
      style={Platform.OS === 'web' ? (toast.hostWeb as any) : toast.host}
    >
      {items.map((it) => (
        <ToastCard key={it.id} item={it} onDone={remove} />
      ))}
    </Wrapper>
  );
}

export function AppAlertHost() {
  const [s, setS] = useState<AlertOpts | null>(null);
  useEffect(() => { setAlertState = setS; return () => { setAlertState = null; }; }, []);

  const close = () => setS(null);
  const press = (b: Btn) => { close(); setTimeout(() => b.onPress?.(), 0); };

  const buttons: Btn[] = s?.buttons && s.buttons.length > 0 ? s.buttons : [{ text: 'OK', style: 'default' }];
  const icon = s ? iconFor(s.title) : null;

  return (
    <>
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
      <ToastHost />
    </>
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

const toast = StyleSheet.create({
  host: {
    position: 'absolute', top: 48, left: 0, right: 0,
    alignItems: 'center', paddingHorizontal: 12, zIndex: 9999,
  },
  hostWeb: {
    position: 'fixed' as any, top: 20, left: 0, right: 0,
    alignItems: 'center', paddingHorizontal: 12, zIndex: 99999,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 10, width: '100%', maxWidth: 440,
    borderLeftWidth: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14.5, fontWeight: '800', color: theme.colors.text },
  msg: { fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 2, lineHeight: 17 },
});
