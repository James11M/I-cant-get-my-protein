import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { addActivityLog } from '@/features/activities/activity.service';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

export default function ActivityEntryScreen() {
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
      await addActivityLog({ userId: session.user.id, name, durationMinutes: minutes, amount: measuredAmount, unit });
      router.replace('/(app)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save activity.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Brand />
      <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹  CHANGE TRAINING TYPE</Text></Pressable>
      <Text style={styles.title}>Sport / Activity</Text>
      <Text style={styles.subtitle}>Log sport, cardio, recovery or another activity.</Text>
      <Card style={styles.card}>
        <Field label="ACTIVITY" value={name} onChangeText={setName} placeholder="e.g. Football" />
        <Field label="DURATION • MIN" value={duration} onChangeText={setDuration} placeholder="30" numeric />
        <Field label="AMOUNT • OPTIONAL" value={amount} onChangeText={setAmount} placeholder="e.g. 5" numeric />
        <Field label="UNIT • OPTIONAL" value={unit} onChangeText={setUnit} placeholder="e.g. km" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.save} onPress={save} disabled={saving}><Text style={styles.saveText}>{saving ? 'SAVING...' : 'SAVE'}</Text></Pressable>
      </Card>
    </Screen>
  );
}

function Field({ label, value, onChangeText, placeholder, numeric = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; numeric?: boolean }) {
  return <><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'numeric' : 'default'} placeholder={placeholder} placeholderTextColor={colours.muted} /></>;
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', marginTop: 20, marginBottom: 10 },
  backText: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: colours.white, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 16 },
  card: { paddingTop: 8 },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 10, color: colours.white, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14 },
  error: { color: colours.red, marginTop: 12, fontSize: 11 },
  save: { backgroundColor: colours.gold, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  saveText: { color: colours.background, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
});
