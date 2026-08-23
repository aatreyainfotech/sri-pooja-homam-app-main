import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface ChipProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  style?: TouchableOpacityProps['style'];
}

export default function Chip({
  label,
  selected = false,
  icon,
  accentColor = theme.colors.primary,
  disabled,
  style,
  ...rest
}: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.base,
        selected ? { backgroundColor: accentColor, borderColor: accentColor } : styles.unselected,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {icon && (
        <Ionicons name={icon} size={14} color={selected ? theme.colors.white : theme.colors.textMuted} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: selected ? theme.colors.white : theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  unselected: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
