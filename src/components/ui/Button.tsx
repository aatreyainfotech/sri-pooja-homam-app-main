import { useCallback } from 'react';
import {
  ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: TouchableOpacityProps['style'];
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = useCallback((e: any) => {
    if (isDisabled) return;
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.(e);
  }, [isDisabled, onPress]);

  const sizeStyle = size === 'lg' ? styles.sizeLg : styles.sizeMd;
  const textSizeStyle = size === 'lg' ? styles.textLg : styles.textMd;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.white} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={textColorFor(variant)} style={styles.iconLeft} />
          )}
          <Text style={[styles.textBase, textSizeStyle, { color: textColorFor(variant) }]} numberOfLines={1}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={textColorFor(variant)} style={styles.iconRight} />
          )}
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
        {...rest}
      >
        <LinearGradient
          colors={theme.gradients.goldCta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, sizeStyle, theme.shadow.sm]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyle,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {content}
    </TouchableOpacity>
  );
}

function textColorFor(variant: Variant) {
  if (variant === 'outline' || variant === 'ghost') return theme.colors.primary;
  return theme.colors.white;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeMd: {
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
  },
  sizeLg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  secondary: {
    backgroundColor: theme.colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
  textBase: {
    fontFamily: theme.font.body,
    fontWeight: '700',
  },
  textMd: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 17,
  },
});
