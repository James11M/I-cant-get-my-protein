import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { addActivityLog } from '@/features/activities/activity.service';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

export default function AddActivityScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const minutes = Number(duration);
    const measuredAmount = amount.trim() ? Number(amount) : null;

    if (!session?.user.id || !name.trim() || !Number.isFinite(minutes) || minutes <= 0) {
      setError('Enter an activity name and a valid duration.');
      return;
    }

    if (measuredAmount !== null && !Number.isFinite(measuredAmount)) {
      setError('Amount must be a number.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await addActivityLog({
        userId: session.user.id,
        name,
        durationMinutes: minutes,
        amount: measuredAmount,
        unit,
      });
      router.replace('/(app)/history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save activity.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Brand />
      <Text style={styles.title}>Add Activity</Text>
      <Text style={styles.subtitle}>Log a completed training session.</Text>

      <Card>
        <Text style={styles.label}>ACTIVITY</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Football" placeholderTextColor={colours.muted} />

        <Text style={styles.label}>DURATION (MINUTES)</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="30" placeholderTextColor={colours.muted} />

        <Text style={styles.label}>AMOUNT (OPTIONAL)</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g. 5" placeholderTextColor={colours.muted} />

        <Text style={styles.label}>UNIT (OPTIONAL)</Text>
        <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="e.g. km" placeholderTextColor={colours.muted} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} onPress={save} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? 'SAVING...' : 'SAVE ACTIVITY'}</Text>
        </Pressable>
      </Card>

      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>CANCEL</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, fontWeight: '900', marginTop: 28 },
  subtitle: { color: colours.muted, marginTop: 4, marginBottom: 18 },
  label: { color: colours.gold, fontSize: 9, fontWeight: '900', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: colours.card2, color: colours.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  error: { color: '#FF9C9C', marginTop: 14, fontSize: 12 },
  primary: { backgroundColor: colours.gold, borderRadius: 12, alignItems: 'center', padding: 15, marginTop: 18 },
  primaryText: { color: colours.background, fontSize: 11, fontWeight: '900' },
  back: { alignItems: 'center', padding: 18 },
  backText: { color: colours.muted, fontSize: 9, fontWeight: '900' },
});
