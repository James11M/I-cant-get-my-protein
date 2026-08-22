import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Activity, addActivityLog, calculateActivityCredit, getActivity } from '@/features/activities/activity.service';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

export default function ActivityLogScreen() {
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [amount, setAmount] = useState('');
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getActivity(id).then((item) => {
      setActivity(item);
      setAmount(String(item.measure_type === 'time' ? item.default_minutes || item.default_target || 30 : item.default_target || 0));
      setMinutes(String(item.default_minutes || 30));
    }).catch((err) => setError(err instanceof Error ? err.message : 'Could not load activity.'));
  }, [id]);

  const numericAmount = Number(amount) || 0;
  const numericMinutes = activity?.measure_type === 'time' ? numericAmount : Number(minutes) || 0;
  const credit = useMemo(() => activity ? calculateActivityCredit(activity, numericAmount, numericMinutes) : 0, [activity, numericAmount, numericMinutes]);

  async function save() {
    if (!activity || !session?.user.id || numericAmount <= 0 || numericMinutes <= 0) {
      setError('Please enter what you actually did.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await addActivityLog({ userId: session.user.id, activity, durationMinutes: numericMinutes, amount: numericAmount });
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
      <BackButton />
      <Text style={styles.hero}>{activity?.icon || '⚡'}</Text>
      <Text style={styles.title}>{activity?.name || 'Activity'}</Text>

      <Card style={styles.card}>
        {activity && activity.measure_type !== 'time' ? (
          <Field label={`AMOUNT (${activity.unit})`} value={amount} onChangeText={setAmount} />
        ) : null}
        <Field label="DURATION (MIN)" value={activity?.measure_type === 'time' ? amount : minutes} onChangeText={activity?.measure_type === 'time' ? setAmount : setMinutes} />

        <Text style={styles.creditLabel}>TRAINING CREDIT</Text>
        <Text style={styles.creditValue}>{Math.round(credit)} min</Text>
        {credit > 30 ? <Text style={styles.creditNote}>{Math.round(credit - 30)} extra minutes can contribute to Weekly Comeback at 50%.</Text> : null}
        {activity?.training_type === 'Recovery' ? <Text style={styles.creditNote}>Recovery activities are logged but do not add target credit.</Text> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.save} onPress={save} disabled={saving || !activity}><Text style={styles.saveText}>{saving ? 'SAVING…' : 'LOG ACTIVITY'}</Text></Pressable>
      </Card>
    </Screen>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return <><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType="numeric" placeholderTextColor={colours.muted} /></>;
}

const styles = StyleSheet.create({
  hero: { fontSize: 42, marginTop: 4 },
  title: { color: colours.white, fontSize: 30, fontWeight: '900', marginTop: 2, marginBottom: 14 },
  card: { paddingTop: 8 },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 10, color: colours.white, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15 },
  creditLabel: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 17 },
  creditValue: { color: colours.gold, fontSize: 25, fontWeight: '900', marginTop: 2 },
  creditNote: { color: colours.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  error: { color: colours.red, marginTop: 12, fontSize: 11 },
  save: { backgroundColor: colours.gold, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  saveText: { color: colours.background, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
});
