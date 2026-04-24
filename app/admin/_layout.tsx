import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    return <Redirect href="/(tabs)" />;
  }
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
