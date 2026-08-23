import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../../constants/theme';

interface ResponsiveContainerProps extends ViewProps {
  maxWidth?: number;
  children: React.ReactNode;
}

export default function ResponsiveContainer({
  maxWidth = theme.breakpoints.maxContentWidth,
  style,
  children,
  ...rest
}: ResponsiveContainerProps) {
  return (
    <View style={[styles.container, { maxWidth }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
});
