import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

type Mode = 'week' | 'month' | 'year';
const DAILY_TARGET = 30;
const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export default function HistoryScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [mode, setMode] = useState<Mode>('week');
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => new Date(), []);

  useFocusEffect(useCallback(() => {
    let live = true;
    getActivityLogs().then((items) => { if (live) setLogs(items); }).catch(() => { if (live) setLogs([]); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []));

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <Brand />
      <Text style={styles.title}>History</Text>
      <View style={styles.segments}>
        <Segment label="WEEK" active={mode === 'week'} onPress={() => setMode('week')} />
        <Segment label="MONTH" active={mode === 'month'} onPress={() => setMode('month')} />
        <Segment label="YEAR" active={mode === 'year'} onPress={() => setMode('year')} />
      </View>

      <View style={styles.body}>
        {loading ? <Text style={styles.muted}>Loading history…</Text> : null}
        {!loading && mode === 'week' ? <WeekView logs={logs} today={today} /> : null}
        {!loading && mode === 'month' ? <MonthView logs={logs} today={today} /> : null}
        {!loading && mode === 'year' ? <YearView logs={logs} today={today} /> : null}
      </View>

      <BottomNav active="history" />
    </Screen>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

function WeekView({ logs, today }: { logs: ActivityLog[]; today: Date }) {
  const monday = startOfWeek(today);
  const sunday = addDays(monday, 6);
  return <>
    <View style={styles.periodRow}><Text style={styles.chevron}>‹</Text><Text style={styles.period}>{dateLabel(monday)} – {dateLabel(sunday)}</Text><Text style={styles.chevron}>›</Text></View>
    <View style={styles.weekList}>{Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const dayLogs = logsForDate(logs, date);
      const credit = dayLogs.reduce((sum, item) => sum + Number(item.credit_minutes || item.duration_minutes || 0), 0);
      const future = dateOnly(date) > dateOnly(today);
      const complete = credit >= DAILY_TARGET;
      const partial = dayLogs.length > 0 && !complete;
      const status = future ? '' : complete ? 'COMPLETE' : partial ? 'PARTIAL' : 'MISSED';
      return <Card key={date.toISOString()} style={[styles.dayCard, complete && styles.completeCard, !future && !complete && !partial && styles.missedCard]}>
        <View style={styles.dayTop}>
          <Text style={styles.dayDate}>{DAYS[date.getDay()]} {date.getDate()}</Text>
          <Text style={[styles.status, complete ? styles.green : partial ? styles.gold : styles.red]}>{status}</Text>
        </View>
        <Text style={styles.dayActivity}>{dayLogs.length ? dayLogs.map((item) => item.activity_name).join(' • ') : future ? 'Upcoming' : 'No training logged'}</Text>
        {!future && !complete && !partial ? <Text style={styles.comeback}>5 comeback min</Text> : null}
      </Card>;
    })}</View>
  </>;
}

function MonthView({ logs, today }: { logs: ActivityLog[]; today: Date }) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const elapsed = today.getDate();
  const completeEquivalent = Array.from({ length: elapsed }, (_, i) => dayCredit(logs, new Date(year, month, i + 1))).reduce((sum, c) => sum + Math.min(1, c / DAILY_TARGET), 0);
  const targetDays = Math.max(1, Math.round(elapsed * (4 / 7)));
  const score = Math.min(100, Math.round((completeEquivalent / targetDays) * 100));
  return <>
    <View style={styles.periodRow}><Text style={styles.chevron}>‹</Text><Text style={styles.period}>{MONTH_NAMES[month]} {year}</Text><Text style={styles.chevron}>›</Text></View>
    <Card style={styles.scoreCard}><Text style={styles.scoreLabel}>MONTH SCORE</Text><Text style={styles.score}>{score}%</Text><Text style={styles.target}>TARGET 80%</Text></Card>
    <View style={styles.weekdays}>{['M','T','W','T','F','S','S'].map((d, i) => <Text key={`${d}-${i}`} style={styles.weekday}>{d}</Text>)}</View>
    <View style={styles.calendar}>{Array.from({ length: 42 }, (_, index) => {
      const day = index - offset + 1;
      if (day < 1 || day > days) return <View key={index} style={styles.dayCellEmpty} />;
      const date = new Date(year, month, day);
      const credit = dayCredit(logs, date);
      const future = day > today.getDate();
      const colour = future ? colours.card2 : credit >= 30 ? colours.green : credit > 0 ? colours.gold : dateOnly(date) === dateOnly(today) ? '#4092D0' : colours.red;
      return <View key={index} style={[styles.dayCell, { backgroundColor: colour }]}><Text style={styles.dayNumber}>{day}</Text></View>;
    })}</View>
  </>;
}

function YearView({ logs, today }: { logs: ActivityLog[]; today: Date }) {
  const year = today.getFullYear();
  const values = Array.from({ length: 12 }, (_, month) => {
    if (month > today.getMonth()) return null;
    const end = month === today.getMonth() ? today.getDate() : new Date(year, month + 1, 0).getDate();
    const equivalent = Array.from({ length: end }, (_, i) => dayCredit(logs, new Date(year, month, i + 1))).reduce((sum, c) => sum + Math.min(1, c / DAILY_TARGET), 0);
    const target = Math.max(1, Math.round(end * (4 / 7)));
    return Math.min(100, Math.round((equivalent / target) * 100));
  });
  return <>
    <View style={styles.periodRow}><Text style={styles.chevron}>‹</Text><Text style={styles.period}>{year}</Text><Text style={styles.chevron}>›</Text></View>
    <Card style={styles.yearCard}>
      <View style={styles.yearTop}><Text style={styles.scoreLabel}>YEAR</Text><Text style={styles.target}>TARGET 80%</Text></View>
      <View style={styles.chart}>{values.map((value, index) => {
        const height = value === null ? 8 : Math.max(10, value * 1.25);
        const colour = value === null ? colours.card2 : value >= 80 ? colours.green : value >= 64 ? '#F1C54C' : colours.red;
        return <View key={index} style={styles.barColumn}><View style={[styles.bar, { height, backgroundColor: colour }]} /><Text style={styles.monthLetter}>{MONTHS[index]}</Text></View>;
      })}</View>
    </Card>
  </>;
}

function startOfWeek(date: Date) { const copy = new Date(date); const day = copy.getDay(); copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day)); copy.setHours(12,0,0,0); return copy; }
function addDays(date: Date, amount: number) { const copy = new Date(date); copy.setDate(copy.getDate() + amount); return copy; }
function dateOnly(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function dateLabel(date: Date) { return `${date.getDate()} ${date.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`; }
function logsForDate(logs: ActivityLog[], date: Date) { return logs.filter((log) => dateOnly(new Date(log.performed_at)) === dateOnly(date)); }
function dayCredit(logs: ActivityLog[], date: Date) { return logsForDate(logs, date).reduce((sum, item) => sum + Number(item.credit_minutes || item.duration_minutes || 0), 0); }

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 },
  title: { color: colours.white, fontSize: 31, fontWeight: '900', marginTop: 20, marginBottom: 12 },
  segments: { backgroundColor: colours.card, borderWidth: 1, borderColor: colours.border, borderRadius: 12, flexDirection: 'row', padding: 3 },
  segment: { flex: 1, minHeight: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colours.gold },
  segmentText: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  segmentTextActive: { color: colours.background },
  body: { flex: 1, marginTop: 8 }, muted: { color: colours.muted, marginTop: 20 },
  periodRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  period: { color: colours.white, fontSize: 12, fontWeight: '900', letterSpacing: 0.6 }, chevron: { color: colours.gold, fontSize: 24, fontWeight: '400' },
  weekList: { gap: 6 }, dayCard: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 11 }, completeCard: { borderColor: colours.green }, missedCard: { borderColor: colours.red },
  dayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, dayDate: { color: colours.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  status: { fontSize: 7, fontWeight: '900', letterSpacing: 0.8 }, green: { color: colours.green }, gold: { color: colours.gold }, red: { color: colours.red },
  dayActivity: { color: colours.white, fontSize: 11, fontWeight: '800', marginTop: 3 }, comeback: { color: '#9A72E8', fontSize: 8, fontWeight: '800', marginTop: 2 },
  scoreCard: { alignItems: 'center', paddingVertical: 10, marginBottom: 7 }, scoreLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, score: { color: colours.white, fontSize: 29, fontWeight: '900', lineHeight: 33 }, target: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 }, weekday: { width: '13.2%', textAlign: 'center', color: colours.muted, fontSize: 7, fontWeight: '900' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, dayCell: { width: '12.9%', aspectRatio: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, dayCellEmpty: { width: '12.9%', aspectRatio: 1 }, dayNumber: { color: colours.white, fontSize: 9, fontWeight: '900' },
  yearCard: { paddingTop: 11, paddingBottom: 11 }, yearTop: { flexDirection: 'row', justifyContent: 'space-between' }, chart: { height: 172, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 9 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, bar: { width: 13, borderRadius: 4, marginBottom: 6 }, monthLetter: { color: colours.muted, fontSize: 7, fontWeight: '900' },
});
