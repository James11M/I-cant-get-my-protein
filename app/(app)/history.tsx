import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setLogs(await getActivityLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <Brand />
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your saved activity logs.</Text>
        </View>
        <Pressable style={styles.add} onPress={() => router.push('/(app)/add')}>
          <Text style={styles.addText}>+ ADD</Text>
        </Pressable>
      </View>

      {loading ? <Text style={styles.message}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && logs.length === 0 ? <Text style={styles.message}>No activities logged yet.</Text> : null}

      {logs.map((log) => (
        <View key={log.id} style={styles.rowGap}>
          <Card>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{log.activity_name}</Text>
                <Text style={styles.date}>{new Date(log.performed_at).toLocaleString()}</Text>
              </View>
              <Text style={styles.minutes}>{log.duration_minutes} min</Text>
            </View>
            {log.amount !== null ? (
              <Text style={styles.measure}>{log.amount}{log.unit ? ` ${log.unit}` : ''}</Text>
            ) : null}
          </Card>
        </View>
      ))}

      <Pressable style={styles.back} onPress={() => router.replace('/(app)')}>
        <Text style={styles.backText}>TODAY</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, marginBottom: 18 },
  title: { color: colours.white, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colours.muted, marginTop: 4 },
  add: { backgroundColor: colours.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addText: { color: colours.background, fontSize: 10, fontWeight: '900' },
  message: { color: colours.muted, paddingVertical: 18 },
  error: { color: '#FF9C9C', paddingVertical: 18 },
  rowGap: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  name: { color: colours.white, fontSize: 16, fontWeight: '900' },
  date: { color: colours.muted, fontSize: 10, marginTop: 5 },
  minutes: { color: colours.gold, fontSize: 14, fontWeight: '900' },
  measure: { color: colours.white, fontSize: 12, marginTop: 10 },
  back: { alignItems: 'center', padding: 18 },
  backText: { color: colours.muted, fontSize: 9, fontWeight: '900' },
});
