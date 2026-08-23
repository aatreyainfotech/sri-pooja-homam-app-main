import { Platform, useWindowDimensions } from 'react-native';
import { theme } from '../constants/theme';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = width < theme.breakpoints.tablet;
  const isTablet = width >= theme.breakpoints.tablet && width < theme.breakpoints.desktop;
  const isDesktop = width >= theme.breakpoints.desktop;

  return { width, height, isWeb, isMobile, isTablet, isDesktop };
}
