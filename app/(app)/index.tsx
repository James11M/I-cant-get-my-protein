import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

export default function HomeScreen() {
  const { session, signOut } = useAuth();

  return (
    <Screen>
      <Brand />
      <Text style={styles.title}>Today</Text>
      <Text style={styles.subtitle}>Log training and keep your history in sync.</Text>

      <Card>
        <Text style={styles.label}>SIGNED IN AS</Text>
        <Text style={styles.value}>{session?.user.email}</Text>
      </Card>

      <View style={styles.spacer} />

      <Pressable onPress={() => router.push('/(app)/add')}>
        <Card>
          <Text style={styles.section}>+ ADD ACTIVITY</Text>
          <Text style={styles.body}>Save a completed training session to Supabase.</Text>
        </Card>
      </Pressable>

      <View style={styles.spacer} />

      <Pressable onPress={() => router.push('/(app)/history')}>
        <Card>
          <Text style={styles.section}>HISTORY</Text>
          <Text style={styles.body}>View your saved activity logs.</Text>
        </Card>
      </Pressable>

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>LOG OUT</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, fontWeight: '900', marginTop: 28 },
  subtitle: { color: colours.muted, marginTop: 4, marginBottom: 18 },
  label: { color: colours.muted, fontSize: 8, fontWeight: '900' },
  value: { color: colours.white, fontSize: 16, fontWeight: '800', marginTop: 5 },
  section: { color: colours.gold, fontSize: 11, fontWeight: '900' },
  body: { color: colours.white, fontSize: 12, lineHeight: 18, marginTop: 6 },
  spacer: { height: 12 },
  signOut: { alignItems: 'center', padding: 18 },
  signOutText: { color: colours.muted, fontSize: 9, fontWeight: '900' },
});
