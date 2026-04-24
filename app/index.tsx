import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/constants/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace('/(tabs)');
      else router.replace('/(auth)/login');
    }, 900);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <LinearGradient colors={['#8B1515', '#630B0B', '#2D1B19']} style={styles.container}>
      <View style={styles.logoWrap} testID="splash-logo">
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
        />
      </View>
      <Text style={styles.brand}>శ్రీ పూజా హోమం</Text>
      <Text style={styles.tagline}>Sri Pooja Homam</Text>
      <Text style={styles.sub}>Divine devotion at your fingertips</Text>
      <ActivityIndicator size="small" color={theme.colors.secondary} style={{ marginTop: 40 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoWrap: {
    width: 160, height: 160, borderRadius: 28, overflow: 'hidden',
    borderWidth: 2, borderColor: theme.colors.secondary,
    shadowColor: theme.colors.secondary, shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    marginBottom: 24,
  },
  logo: { width: '100%', height: '100%' },
  brand: { fontSize: 32, fontWeight: '700', color: theme.colors.secondary, letterSpacing: 1 },
  tagline: { fontSize: 18, color: '#FDFBF7', marginTop: 8, letterSpacing: 4, textTransform: 'uppercase' },
  sub: { fontSize: 13, color: 'rgba(253,251,247,0.6)', marginTop: 12, fontStyle: 'italic' },
});
