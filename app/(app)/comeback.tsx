import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

const DAILY_TARGET = 30;
const COMEBACK_RATE = 0.5;
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function ComebackScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const today = useMemo(() => new Date(), []);

  useFocusEffect(useCallback(() => {
    let live = true;
    getActivityLogs().then((items) => { if (live) setLogs(items); }).catch(() => { if (live) setLogs([]); });
    return () => { live = false; };
  }, []));

  const comeback = getRollingComeback(logs, today);
  const comebackMinutes = comeback.totalExtra * COMEBACK_RATE;
  const rollingDays = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Weekly Comeback</Text>
      <Text style={styles.subtitle}>Extra training can repair missed minutes inside your rolling 7-day window.</Text>

      <Card style={styles.explainCard}>
        <Text style={styles.purpleLabel}>HOW IT WORKS</Text>
        <Text style={styles.body}>Your first {DAILY_TARGET} credit minutes cover today. Anything above that becomes comeback credit at {Math.round(COMEBACK_RATE * 100)}% and is applied backwards, starting with yesterday. Once a day falls outside the last 7 days it locks and cannot be repaired.</Text>
        <Text style={styles.formula}>POC example: 260 excess min × 50% = 130 comeback min</Text>
      </Card>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>EXCESS • LAST 7D</Text>
          <Text style={styles.summaryValue}>{Math.round(comeback.totalExtra)}</Text>
          <Text style={styles.summaryUnit}>raw min</Text>
        </Card>
        <Card style={[styles.summaryCard, styles.purpleBorder]}>
          <Text style={styles.summaryLabel}>COMEBACK RATE</Text>
          <Text style={styles.summaryValue}>{Math.round(COMEBACK_RATE * 100)}%</Text>
          <Text style={styles.summaryUnit}>setting</Text>
        </Card>
        <Card style={[styles.summaryCard, styles.purpleBorder]}>
          <Text style={styles.summaryLabel}>COMEBACK MIN</Text>
          <Text style={[styles.summaryValue, styles.purple]}>{Math.round(comebackMinutes)}</Text>
          <Text style={styles.summaryUnit}>generated</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>LAST 7 DAYS</Text>
      <View style={styles.dayList}>
        {rollingDays.map((date) => {
          const key = dateKey(date);
          const normal = normalCreditForDate(logs, date);
          const recovered = comeback.recoveredByDate[key] || 0;
          const effective = Math.min(DAILY_TARGET, normal + recovered);
          const doneNormally = normal >= DAILY_TARGET;
          const doneWithComeback = !doneNormally && effective >= DAILY_TARGET && recovered > 0;
          const partialComeback = recovered > 0 && effective < DAILY_TARGET;
          const isToday = sameDate(date, today);

          return (
            <Card
              key={key}
              style={[
                styles.dayCard,
                doneNormally && styles.normalDone,
                (doneWithComeback || partialComeback) && styles.comebackDay,
                isToday && styles.todayCard,
              ]}
            >
              <View style={styles.dayHeading}>
                <View>
                  <Text style={styles.dayName}>{DAYS[date.getDay()]} {date.getDate()}</Text>
                  <Text style={styles.dayMeta}>{Math.round(normal)} normal{recovered > 0 ? ` + ${Math.round(recovered)} comeback` : ''} min</Text>
                </View>
                <View style={styles.fireArea}>
                  <Text style={[styles.fire, !(doneNormally || doneWithComeback) && styles.fireOff]}>🔥</Text>
                  <Text style={styles.dayTotal}>{Math.round(effective)} / {DAILY_TARGET}</Text>
                </View>
              </View>
              {partialComeback ? <Text style={styles.partial}>+{Math.round(recovered)} comeback min applied — not enough to light the fire yet.</Text> : null}
              {doneWithComeback ? <Text style={styles.repaired}>Completed using comeback minutes.</Text> : null}
            </Card>
          );
        })}
      </View>

      <Card style={styles.ruleCard}>
        <Text style={styles.purpleLabel}>CONSISTENCY</Text>
        <Text style={styles.body}>A repaired day counts as complete for your fire score from today forward. Comeback never awards XP retroactively. Anything older than 7 days is locked and cannot be repaired, no matter how much extra training you do later.</Text>
      </Card>
    </Screen>
  );
}

function sameDate(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function addDays(date: Date, amount: number) { const copy = new Date(date); copy.setDate(copy.getDate() + amount); copy.setHours(12, 0, 0, 0); return copy; }
function rawCreditForDate(logs: ActivityLog[], date: Date) { return logs.filter((log) => sameDate(new Date(log.performed_at), date)).reduce((sum, log) => sum + Number(log.credit_minutes || 0), 0); }
function normalCreditForDate(logs: ActivityLog[], date: Date) { return Math.min(DAILY_TARGET, rawCreditForDate(logs, date)); }
function extraCreditForDate(logs: ActivityLog[], date: Date) { return Math.max(0, rawCreditForDate(logs, date) - DAILY_TARGET); }

function getRollingComeback(logs: ActivityLog[], today: Date) {
  const windowStart = addDays(today, -6);
  const deficits: { key: string; remaining: number }[] = [];
  const recoveredByDate: Record<string, number> = {};
  let totalExtra = 0;
  let recovered = 0;

  for (let index = 0; index < 7; index += 1) {
    const date = addDays(windowStart, index);
    const normal = normalCreditForDate(logs, date);
    const missing = Math.max(0, DAILY_TARGET - normal);
    const extra = extraCreditForDate(logs, date);
    totalExtra += extra;
    let available = extra * COMEBACK_RATE;

    for (let deficitIndex = deficits.length - 1; deficitIndex >= 0 && available > 0; deficitIndex -= 1) {
      const deficit = deficits[deficitIndex];
      if (deficit.remaining <= 0) continue;
      const applied = Math.min(available, deficit.remaining);
      deficit.remaining -= applied;
      available -= applied;
      recovered += applied;
      recoveredByDate[deficit.key] = (recoveredByDate[deficit.key] || 0) + applied;
    }

    if (missing > 0) deficits.push({ key: dateKey(date), remaining: missing });
  }

  return {
    recoveredByDate,
    totalExtra,
    recovered,
    missing: deficits.reduce((sum, item) => sum + item.remaining, 0),
  };
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 14 },
  explainCard: { borderColor: colours.purple, marginBottom: 10 },
  purpleLabel: { color: colours.purple, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  body: { color: colours.white, fontSize: 10, lineHeight: 15, marginTop: 6 },
  formula: { color: colours.purple, fontSize: 9, lineHeight: 14, fontWeight: '900', marginTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 7, marginBottom: 15 },
  summaryCard: { flex: 1, padding: 9, minHeight: 88, justifyContent: 'center' },
  purpleBorder: { borderColor: colours.purple },
  summaryLabel: { color: colours.muted, fontSize: 7, lineHeight: 10, fontWeight: '900', letterSpacing: 0.6 },
  summaryValue: { color: colours.white, fontSize: 22, fontWeight: '900', marginTop: 4 },
  summaryUnit: { color: colours.muted, fontSize: 7, fontWeight: '800', marginTop: 1 },
  purple: { color: colours.purple },
  sectionTitle: { color: colours.white, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8 },
  dayList: { gap: 7 },
  dayCard: { paddingVertical: 10, paddingHorizontal: 12 },
  normalDone: { borderColor: colours.green },
  comebackDay: { borderColor: colours.purple },
  todayCard: { borderWidth: 2 },
  dayHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { color: colours.white, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  dayMeta: { color: colours.muted, fontSize: 8, marginTop: 3 },
  fireArea: { alignItems: 'center', minWidth: 54 },
  fire: { fontSize: 24 },
  fireOff: { opacity: 0.18 },
  dayTotal: { color: colours.muted, fontSize: 7, fontWeight: '900', marginTop: 1 },
  partial: { color: colours.purple, fontSize: 8, fontWeight: '800', marginTop: 6 },
  repaired: { color: colours.purple, fontSize: 8, fontWeight: '900', marginTop: 6 },
  ruleCard: { borderColor: colours.purple, marginTop: 12, marginBottom: 10 },
});