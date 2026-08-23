import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

type Mode = 'week' | 'month' | 'year';
const DAILY_TARGET = 30;
const COMEBACK_RATE = 0.5;
const WEEKLY_ACTIVE_GOAL = 4;
const MONTH_TARGET = 80;
const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export default function HistoryScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [mode, setMode] = useState<Mode>('week');
  const [loading, setLoading] = useState(true);
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const today = useMemo(() => new Date(), []);

  useFocusEffect(useCallback(() => {
    let live = true;
    getActivityLogs().then((items) => { if (live) setLogs(items); }).catch(() => { if (live) setLogs([]); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []));

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>History</Text>
        <View style={styles.segments}>
          <Segment label="WEEK" active={mode === 'week'} onPress={() => setMode('week')} />
          <Segment label="MONTH" active={mode === 'month'} onPress={() => setMode('month')} />
          <Segment label="YEAR" active={mode === 'year'} onPress={() => setMode('year')} />
        </View>

        <View style={styles.body}>
          {loading ? <Text style={styles.muted}>Loading history…</Text> : null}
          {!loading && mode === 'week' ? <WeekView logs={logs} today={today} weekDate={weekDate} onWeek={setWeekDate} /> : null}
          {!loading && mode === 'month' ? <MonthView logs={logs} today={today} monthDate={monthDate} onMonth={setMonthDate} /> : null}
          {!loading && mode === 'year' ? <YearView logs={logs} today={today} year={year} onYear={setYear} /> : null}
        </View>
      </ScrollView>
      <BottomNav active="history" />
    </Screen>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

function PeriodRow({ label, onBack, onNext }: { label: string; onBack: () => void; onNext: () => void }) {
  return <View style={styles.periodRow}>
    <Pressable style={styles.chevronButton} onPress={onBack}><Text style={styles.chevron}>‹</Text></Pressable>
    <Text style={styles.period}>{label}</Text>
    <Pressable style={styles.chevronButton} onPress={onNext}><Text style={styles.chevron}>›</Text></Pressable>
  </View>;
}

function WeekView({ logs, today, weekDate, onWeek }: { logs: ActivityLog[]; today: Date; weekDate: Date; onWeek: (date: Date) => void }) {
  const monday = startOfWeek(weekDate);
  const sunday = addDays(monday, 6);
  const comeback = getRollingComeback(logs, today);
  return <>
    <PeriodRow label={`${dateLabel(monday)} – ${dateLabel(sunday)}`} onBack={() => onWeek(addDays(weekDate, -7))} onNext={() => onWeek(addDays(weekDate, 7))} />
    <View style={styles.weekList}>{Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const dayLogs = logsForDate(logs, date);
      const raw = normalCreditForDate(logs, date);
      const recovered = comeback.recoveredByDate[dateOnly(date)] || 0;
      const credit = Math.min(DAILY_TARGET, raw + recovered);
      const future = dateOnly(date) > dateOnly(today);
      const complete = credit >= DAILY_TARGET;
      const partial = !future && credit > 0 && !complete;
      const status = future ? '' : complete ? recovered > 0 && raw < DAILY_TARGET ? 'COMEBACK' : 'COMPLETE' : partial ? 'PARTIAL' : 'MISSED';
      return <Card key={date.toISOString()} style={[styles.dayCard, complete && styles.completeCard, partial && styles.partialCard, !future && !complete && !partial && styles.missedCard, recovered > 0 && styles.comebackCard]}>
        <View style={styles.dayTop}>
          <Text style={styles.dayDate}>{DAYS[date.getDay()]} {date.getDate()}</Text>
          <Text style={[styles.status, complete ? recovered > 0 && raw < DAILY_TARGET ? styles.purple : styles.green : partial ? styles.gold : styles.red]}>{status}</Text>
        </View>
        <Text style={[styles.dayActivity, !dayLogs.length && styles.dayActivityMuted]}>{dayLogs.length ? dayLogs.map((item) => item.activity_name).join(' • ') : future ? 'Upcoming' : recovered > 0 ? 'Recovered with comeback' : 'No training logged'}</Text>
        {recovered > 0 ? <Text style={styles.comeback}>+{Math.round(recovered)} comeback min • {Math.round(credit)} / {DAILY_TARGET}</Text> : null}
      </Card>;
    })}</View>
  </>;
}

function MonthView({ logs, today, monthDate, onMonth }: { logs: ActivityLog[]; today: Date; monthDate: Date; onMonth: (date: Date) => void }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const isCurrent = year === today.getFullYear() && month === today.getMonth();
  const inFuture = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const elapsed = inFuture ? 0 : isCurrent ? today.getDate() : days;
  const completeEquivalent = elapsed ? Array.from({ length: elapsed }, (_, i) => effectiveCreditForDate(logs, new Date(year, month, i + 1), today)).reduce((sum, c) => sum + Math.min(1, c / DAILY_TARGET), 0) : 0;
  const targetDays = Math.max(1, Math.round(Math.max(1, elapsed) * (WEEKLY_ACTIVE_GOAL / 7)));
  const score = inFuture ? 0 : Math.min(100, Math.round((completeEquivalent / targetDays) * 100));
  return <>
    <PeriodRow label={`${MONTH_NAMES[month]} ${year}`} onBack={() => onMonth(addMonths(monthDate, -1))} onNext={() => onMonth(addMonths(monthDate, 1))} />
    <Card style={styles.scoreCard}>
      <Text style={styles.scoreLabel}>MONTH SCORE</Text>
      <Text style={styles.score}>{score}%</Text>
      <Text style={styles.target}>TARGET {MONTH_TARGET}%</Text>
    </Card>
    <View style={styles.weekdays}>{['M','T','W','T','F','S','S'].map((d, i) => <Text key={`${d}-${i}`} style={styles.weekday}>{d}</Text>)}</View>
    <View style={styles.calendar}>{Array.from({ length: 42 }, (_, index) => {
      const day = index - offset + 1;
      if (day < 1 || day > days) return <View key={index} style={styles.dayCellEmpty} />;
      const date = new Date(year, month, day);
      const credit = effectiveCreditForDate(logs, date, today);
      const recovered = getRollingComeback(logs, today).recoveredByDate[dateOnly(date)] || 0;
      const future = dateOnly(date) > dateOnly(today);
      const colour = future ? colours.card2 : credit >= DAILY_TARGET ? recovered > 0 ? colours.purple : colours.green : credit > 0 ? colours.gold : dateOnly(date) === dateOnly(today) ? colours.blue : colours.red;
      return <View key={index} style={[styles.dayCell, { backgroundColor: colour }]}><Text style={styles.dayNumber}>{day}</Text></View>;
    })}</View>
  </>;
}

function YearView({ logs, today, year, onYear }: { logs: ActivityLog[]; today: Date; year: number; onYear: (year: number) => void }) {
  const values = Array.from({ length: 12 }, (_, month) => {
    const monthStart = new Date(year, month, 1);
    if (monthStart > new Date(today.getFullYear(), today.getMonth(), 1)) return null;
    const end = year === today.getFullYear() && month === today.getMonth() ? today.getDate() : new Date(year, month + 1, 0).getDate();
    const equivalent = Array.from({ length: end }, (_, i) => effectiveCreditForDate(logs, new Date(year, month, i + 1), today)).reduce((sum, c) => sum + Math.min(1, c / DAILY_TARGET), 0);
    const target = Math.max(1, Math.round(end * (WEEKLY_ACTIVE_GOAL / 7)));
    return Math.min(100, Math.round((equivalent / target) * 100));
  });
  return <>
    <PeriodRow label={`${year}`} onBack={() => onYear(year - 1)} onNext={() => onYear(year + 1)} />
    <Card style={styles.yearCard}>
      <View style={styles.yearTop}><Text style={styles.scoreLabel}>YEAR</Text><Text style={styles.target}>TARGET {MONTH_TARGET}%</Text></View>
      <View style={styles.chart}>{values.map((value, index) => {
        const height = value === null ? 8 : Math.max(10, value * 1.35);
        const colour = value === null ? colours.card2 : value >= MONTH_TARGET ? colours.green : value >= MONTH_TARGET * 0.8 ? colours.yellow : colours.red;
        return <View key={index} style={styles.barColumn}><View style={[styles.bar, { height, backgroundColor: colour }]} /><Text style={styles.monthLetter}>{MONTHS[index]}</Text></View>;
      })}</View>
    </Card>
  </>;
}

function startOfWeek(date: Date) { const copy = new Date(date); const day = copy.getDay(); copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day)); copy.setHours(12,0,0,0); return copy; }
function addDays(date: Date, amount: number) { const copy = new Date(date); copy.setDate(copy.getDate() + amount); copy.setHours(12,0,0,0); return copy; }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12); }
function dateOnly(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function dateLabel(date: Date) { return `${date.getDate()} ${date.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`; }
function logsForDate(logs: ActivityLog[], date: Date) { return logs.filter((log) => dateOnly(new Date(log.performed_at)) === dateOnly(date)); }
function dayCredit(logs: ActivityLog[], date: Date) { return logsForDate(logs, date).reduce((sum, item) => sum + Number(item.credit_minutes || item.duration_minutes || 0), 0); }
function normalCreditForDate(logs: ActivityLog[], date: Date) { return Math.min(DAILY_TARGET, dayCredit(logs, date)); }
function extraCreditForDate(logs: ActivityLog[], date: Date) { return Math.max(0, dayCredit(logs, date) - DAILY_TARGET); }
function getRollingComeback(logs: ActivityLog[], today: Date) {
  const windowStart = addDays(today, -6);
  const deficits: { key: string; remaining: number }[] = [];
  const recoveredByDate: Record<string, number> = {};
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(windowStart, index);
    const normal = normalCreditForDate(logs, date);
    const missing = Math.max(0, DAILY_TARGET - normal);
    let available = extraCreditForDate(logs, date) * COMEBACK_RATE;
    for (let deficitIndex = deficits.length - 1; deficitIndex >= 0 && available > 0; deficitIndex -= 1) {
      const deficit = deficits[deficitIndex];
      if (deficit.remaining <= 0) continue;
      const applied = Math.min(available, deficit.remaining);
      deficit.remaining -= applied;
      available -= applied;
      recoveredByDate[deficit.key] = (recoveredByDate[deficit.key] || 0) + applied;
    }
    if (missing > 0) deficits.push({ key: dateOnly(date), remaining: missing });
  }
  return { recoveredByDate };
}
function effectiveCreditForDate(logs: ActivityLog[], date: Date, today: Date) {
  const recovered = getRollingComeback(logs, today).recoveredByDate[dateOnly(date)] || 0;
  return Math.min(DAILY_TARGET, normalCreditForDate(logs, date) + recovered);
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, scroll: { flex: 1 }, content: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 29, fontWeight: '900', marginTop: 18, marginBottom: 12 },
  segments: { backgroundColor: colours.card, borderWidth: 1, borderColor: colours.border, borderRadius: 11, flexDirection: 'row', padding: 3 },
  segment: { flex: 1, minHeight: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colours.gold },
  segmentText: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, segmentTextActive: { color: colours.background },
  body: { marginTop: 9 }, muted: { color: colours.muted, fontSize: 10, marginTop: 20 },
  periodRow: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  period: { color: colours.white, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  chevronButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, chevron: { color: colours.gold, fontSize: 26, lineHeight: 27 },
  weekList: { gap: 7 }, dayCard: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 11 }, completeCard: { borderColor: colours.green }, partialCard: { borderColor: colours.gold }, missedCard: { borderColor: colours.red }, comebackCard: { borderColor: colours.purple },
  dayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, dayDate: { color: colours.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, status: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }, green: { color: colours.green }, gold: { color: colours.gold }, red: { color: colours.red }, purple: { color: colours.purple },
  dayActivity: { color: colours.white, fontSize: 11, fontWeight: '800', marginTop: 4 }, dayActivityMuted: { color: colours.muted }, comeback: { color: colours.purple, fontSize: 8, fontWeight: '900', marginTop: 3 },
  scoreCard: { alignItems: 'center', paddingVertical: 13, marginBottom: 10 }, scoreLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, score: { color: colours.white, fontSize: 32, fontWeight: '900', lineHeight: 36, marginTop: 1 }, target: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 5 }, weekday: { width: '13.2%', textAlign: 'center', color: colours.muted, fontSize: 8, fontWeight: '900' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, dayCell: { width: '12.9%', aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, dayCellEmpty: { width: '12.9%', aspectRatio: 1 }, dayNumber: { color: colours.white, fontSize: 9, fontWeight: '900' },
  yearCard: { paddingTop: 13, paddingBottom: 12 }, yearTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, chart: { height: 190, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }, barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, bar: { width: 13, borderRadius: 4, marginBottom: 7 }, monthLetter: { color: colours.muted, fontSize: 7, fontWeight: '900' },
});
