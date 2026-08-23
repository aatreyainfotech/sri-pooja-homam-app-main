import { forwardRef, useState } from 'react';
import {
  Platform, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

type Tone = 'onLight' | 'onDark';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  tone?: Tone;
  secureTextEntry?: boolean;
  containerStyle?: any;
}

const Input = forwardRef<TextInput, InputProps>(function Input({
  label,
  icon,
  error,
  tone = 'onLight',
  secureTextEntry,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}, ref) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dark = tone === 'onDark';
  const multiline = !!rest.multiline;

  const iconColor = focused ? theme.colors.secondary : dark ? 'rgba(255,255,255,0.55)' : '#9CA3AF';
  const labelColor = dark ? 'rgba(255,255,255,0.85)' : theme.colors.text;
  const placeholderColor = dark ? 'rgba(255,255,255,0.45)' : '#9CA3AF';
  const textColor = dark ? theme.colors.white : theme.colors.text;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          dark ? styles.inputWrapDark : styles.inputWrapLight,
          focused && (dark ? styles.inputWrapFocusedDark : styles.inputWrapFocusedLight),
          !!error && styles.inputWrapError,
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={iconColor} style={[styles.icon, multiline && { marginTop: 2 }]} />}
        <TextInput
          {...rest}
          ref={ref}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={placeholderColor}
          textAlignVertical={multiline ? 'top' : undefined}
          style={[styles.input, multiline && styles.inputMultiline, { color: textColor }]}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.font.body,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: theme.spacing.xs + 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.md,
    height: 50,
    overflow: 'hidden',
  },
  inputWrapMultiline: {
    alignItems: 'flex-start',
    height: undefined,
    minHeight: 100,
    paddingVertical: theme.spacing.sm + 2,
  },
  inputWrapLight: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
  },
  inputWrapDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(212,175,55,0.35)',
  },
  inputWrapFocusedLight: {
    borderColor: theme.colors.secondary,
  },
  inputWrapFocusedDark: {
    borderColor: theme.colors.secondary,
  },
  inputWrapError: {
    borderColor: theme.colors.danger,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: theme.font.body,
    fontSize: 15,
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  inputMultiline: {
    height: undefined,
    minHeight: 84,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.danger,
  },
});
