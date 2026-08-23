import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { theme } from '../../constants/theme';

type BadgeStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends Omit<ViewProps, 'style'> {
  label: string;
  status?: BadgeStatus;
  color?: { bg: string; text: string };
  size?: 'sm' | 'md';
  style?: ViewProps['style'];
}

export default function Badge({ label, status = 'neutral', color, size = 'md', style, ...rest }: BadgeProps) {
  const c = color ?? theme.statusColors[status];
  return (
    <View
      style={[styles.base, size === 'sm' ? styles.sm : styles.md, { backgroundColor: c.bg }, style]}
      {...rest}
    >
      <Text style={[styles.text, size === 'sm' ? styles.textSm : styles.textMd, { color: c.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.sm,
  },
  sm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 11,
  },
});
