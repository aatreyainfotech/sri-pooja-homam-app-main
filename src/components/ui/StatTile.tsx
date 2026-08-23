import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  variant?: 'card' | 'mini';
}

export default function StatTile({ label, value, icon, color = theme.colors.primary, variant = 'card' }: StatTileProps) {
  if (variant === 'mini') {
    return (
      <View style={styles.mini}>
        <Text style={[styles.miniValue, { color }]} numberOfLines={1}>{value}</Text>
        <Text style={styles.miniLabel} numberOfLines={1}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      )}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md - 2,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: theme.radius.sm + 4,
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm + 2,
  },
  label: {
    fontSize: 11, color: theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  value: {
    fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 2,
  },
  mini: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.bgPaper,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  miniValue: {
    fontSize: 18, fontWeight: '800',
  },
  miniLabel: {
    fontSize: 10, color: theme.colors.textMuted, marginTop: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
});
