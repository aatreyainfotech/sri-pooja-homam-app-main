import { useRef } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { theme } from '../../constants/theme';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (next: string[]) => void;
  variant?: 'solid' | 'glass';
  testIDPrefix?: string;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  variant = 'glass',
  testIDPrefix = 'otp-input',
}: OtpInputProps) {
  const refs = useRef<(TextInput | null)[]>([]);
  const glass = variant === 'glass';

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    const next = [...value];
    next[i] = d;
    onChange(next);
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <View style={styles.row}>
      {value.map((d, i) => (
        <TextInput
          key={i}
          testID={`${testIDPrefix}-${i}`}
          ref={(r) => { refs.current[i] = r; }}
          value={d}
          onChangeText={(v) => setDigit(i, v)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
          }}
          keyboardType="number-pad"
          maxLength={1}
          style={[
            styles.box,
            glass ? styles.boxGlass : styles.boxSolid,
            glass && d ? styles.boxGlassFilled : null,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  boxSolid: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.white,
    color: theme.colors.primary,
  },
  boxGlass: {
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFF8F0',
  },
  boxGlassFilled: {
    borderColor: 'rgba(212,175,55,0.7)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
});
