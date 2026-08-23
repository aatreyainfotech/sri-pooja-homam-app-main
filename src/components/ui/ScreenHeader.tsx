import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  gradientColors?: readonly [string, string, ...string[]];
  onBack?: () => void;
  rightAction?: ReactNode;
  children?: ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  gradientColors = theme.gradients.headerPrimary,
  onBack,
  rightAction,
  children,
}: ScreenHeaderProps) {
  return (
    <LinearGradient colors={gradientColors} style={styles.header}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.font.heading,
    fontSize: 24,
    color: theme.colors.white,
    marginTop: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.font.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: theme.spacing.xs,
  },
});
