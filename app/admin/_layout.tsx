import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !['super_admin', 'admin', 'hotel_manager'].includes(user.role)) {
    return <Redirect href="/(tabs)" />;
  }
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
