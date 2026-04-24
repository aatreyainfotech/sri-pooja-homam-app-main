import { useRouter } from 'expo-router';

/**
 * Safely go back. If no history (direct URL load, web refresh), fallback to a default route.
 */
export function useSafeBack() {
  const router = useRouter();
  return (fallback: string = '/(tabs)') => {
    try {
      if (router.canGoBack && router.canGoBack()) {
        router.back();
      } else {
        router.replace(fallback as any);
      }
    } catch {
      router.replace(fallback as any);
    }
  };
}
