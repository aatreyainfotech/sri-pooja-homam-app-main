import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../constants/theme';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  padding?: keyof typeof theme.spacing;
  radius?: keyof typeof theme.radius;
  children: React.ReactNode;
}

export default function GlassCard({
  intensity = 40,
  tint = 'dark',
  padding = 'lg',
  radius = 'lg',
  style,
  children,
  ...rest
}: GlassCardProps) {
  const shape = { borderRadius: theme.radius[radius], padding: theme.spacing[padding] };

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.base, shape, style]}
      {...rest}
    >
      <View style={styles.tintOverlay} pointerEvents="none" />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: Platform.OS === 'web' ? 'rgba(20,3,3,0.55)' : 'transparent',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,3,3,0.25)',
  },
});
