import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../../constants/theme';

interface SurfaceProps extends ViewProps {
  elevation?: 'sm' | 'md' | 'lg';
  padding?: keyof typeof theme.spacing;
  radius?: keyof typeof theme.radius;
  children: React.ReactNode;
}

export default function Surface({
  elevation = 'sm',
  padding = 'md',
  radius = 'lg',
  style,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <View
      style={[
        styles.base,
        theme.shadow[elevation],
        { padding: theme.spacing[padding], borderRadius: theme.radius[radius] },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
});
