import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { supabase } from '@/lib/supabase';
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
  const [openedAt, setOpenedAt] = useState<Date | null>(null);
  const today = useMemo(() => atNoon(new Date()), []);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      const items = await getActivityLogs().catch(() => [] as ActivityLog[]);
      if (!live) return;
      setLogs(items);
      let accountDate: Date | null = null;
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data } = await supabase.from('profiles').select('created_at').eq('id', userData.user.id).single();
          if (data?.created_at) accountDate = atNoon(new Date(data.created_at));
        }
      }
      if (!accountDate && items.length) accountDate = items.map((item) => atNoon(new Date(item.performed_at))).sort((a, b) => a.getTime() - b.getTime())[0];
      if (!live) return;
      setOpenedAt(accountDate || today);
      setLoading(false);
    }
    load().catch(() => { if (live) { setOpenedAt(today); setLoading(false); } });
    return () => { live = false; };
  }, [today]));

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
          {!loading && openedAt && mode === 'week' ? <WeekView logs={logs} today={today} openedAt={openedAt} weekDate={weekDate} onWeek={setWeekDate} /> : null}
          {!loading && openedAt && mode === 'month' ? <MonthView logs={logs} today={today} openedAt={openedAt} monthDate={monthDate} onMonth={setMonthDate} /> : null}
          {!loading && openedAt && mode === 'year' ? <YearView logs={logs} today={today} openedAt={openedAt} year={year} onYear={setYear} /> : null}
        </View>
      </ScrollView>
      <BottomNav active="history" />
    </Screen>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

function PeriodRow({ label, onBack, onNext, backDisabled = false, nextDisabled = false }: { label: string; onBack: () => void; onNext: () => void; backDisabled?: boolean; nextDisabled?: boolean }) {
  return <View style={styles.periodRow}>
    <Pressable style={[styles.chevronButton, backDisabled && styles.chevronDisabled]} onPress={onBack} disabled={backDisabled}><Text style={[styles.chevron, backDisabled && styles.chevronTextDisabled]}>‹</Text></Pressable>
    <Text style={styles.period}>{label}</Text>
    <Pressable style={[styles.chevronButton, nextDisabled && styles.chevronDisabled]} onPress={onNext} disabled={nextDisabled}><Text style={[styles.chevron, nextDisabled && styles.chevronTextDisabled]}>›</Text></Pressable>
  </View>;
}

function WeekView({ logs, today, openedAt, weekDate, onWeek }: { logs: ActivityLog[]; today: Date; openedAt: Date; weekDate: Date; onWeek: (date: Date) => void }) {
  const monday = startOfWeek(weekDate);
  const sunday = addDays(monday, 6);
  const firstWeek = startOfWeek(openedAt);
  const currentWeek = startOfWeek(today);
  const backDisabled = dateOnly(monday) <= dateOnly(firstWeek);
  const nextDisabled = dateOnly(monday) >= dateOnly(currentWeek);
  const comeback = getRollingComeback(logs, today, openedAt);

  return <>
    <PeriodRow label={`${dateLabel(monday)} – ${dateLabel(sunday)}`} backDisabled={backDisabled} nextDisabled={nextDisabled} onBack={() => { if (!backDisabled) onWeek(addDays(weekDate, -7)); }} onNext={() => { if (!nextDisabled) onWeek(addDays(weekDate, 7)); }} />
    <View style={styles.weekList}>{Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const beforeAccount = dateOnly(date) < dateOnly(openedAt);
      const dayLogs = beforeAccount ? [] : logsForDate(logs, date);
      const raw = beforeAccount ? 0 : normalCreditForDate(logs, date);
      const recovered = beforeAccount ? 0 : comeback.recoveredByDate[dateOnly(date)] || 0;
      const credit = Math.min(DAILY_TARGET, raw + recovered);
      const future = dateOnly(date) > dateOnly(today);
      const isToday = dateOnly(date) === dateOnly(today);
      const complete = !beforeAccount && credit >= DAILY_TARGET;
      const partial = !beforeAccount && !future && credit > 0 && !complete;
      const comebackComplete = complete && recovered > 0 && raw < DAILY_TARGET;
      const status = beforeAccount || future ? '' : isToday && !complete ? 'INCOMPLETE' : complete ? comebackComplete ? 'COMEBACK' : 'COMPLETE' : partial ? 'PARTIAL' : 'MISSED';
      return <Card key={date.toISOString()} style={[
        styles.dayCard,
        beforeAccount && styles.beforeAccountCard,
        !isToday && complete && styles.completeCard,
        !isToday && partial && styles.partialCard,
        !future && !beforeAccount && !isToday && !complete && !partial && styles.missedCard,
        !isToday && recovered > 0 && styles.comebackCard,
        isToday && !complete && styles.todayIncompleteCard,
        isToday && complete && styles.todayCompleteCard,
      ]}>
        <View style={styles.dayTop}><Text style={[styles.dayDate, beforeAccount && styles.beforeAccountText]}>{DAYS[date.getDay()]} {date.getDate()}</Text><Text style={[styles.status, isToday ? styles.todayText : complete ? comebackComplete ? styles.purple : styles.green : partial ? styles.gold : styles.red]}>{status}</Text></View>
        <Text style={[styles.dayActivity, (!dayLogs.length && !isToday) && styles.dayActivityMuted, beforeAccount && styles.beforeAccountText, isToday && styles.todayText]}>{beforeAccount ? 'Before account opened' : dayLogs.length ? dayLogs.map((item) => item.activity_name).join(' • ') : future ? 'Upcoming' : recovered > 0 ? 'Recovered with comeback' : 'No training logged'}</Text>
        {recovered > 0 ? <Text style={[styles.comeback, isToday && styles.todayText]}>+{Math.round(recovered)} comeback min • {Math.round(credit)} / {DAILY_TARGET}</Text> : null}
        {isToday ? <Text style={styles.todayMarker}>★ TODAY</Text> : null}
      </Card>;
    })}</View>
  </>;
}

function MonthView({ logs, today, openedAt, monthDate, onMonth }: { logs: ActivityLog[]; today: Date; openedAt: Date; monthDate: Date; onMonth: (date: Date) => void }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1, 12);
  const offset = (monthStart.getDay() + 6) % 7;
  const firstMonth = new Date(openedAt.getFullYear(), openedAt.getMonth(), 1, 12);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const backDisabled = monthStart <= firstMonth;
  const nextDisabled = monthStart >= currentMonth;
  const isCurrent = year === today.getFullYear() && month === today.getMonth();
  const endDay = isCurrent ? today.getDate() : days;
  const startDay = year === openedAt.getFullYear() && month === openedAt.getMonth() ? openedAt.getDate() : 1;
  const activeDays = Math.max(0, endDay - startDay + 1);
  const equivalent = activeDays ? Array.from({ length: activeDays }, (_, i) => effectiveCreditForDate(logs, new Date(year, month, startDay + i, 12), today, openedAt)).reduce((sum, c) => sum + Math.min(1, c / DAILY_TARGET), 0) : 0;
  const targetDays = Math.max(1, Math.round(Math.max(1, activeDays) * (WEEKLY_ACTIVE_GOAL / 7)));
  const score = activeDays === 0 ? 0 : Math.min(100, Math.round((equivalent / targetDays) * 100));
  const comeback = getRollingComeback(logs, today, openedAt);

  return <>
    <PeriodRow label={`${MONTH_NAMES[month]} ${year}`} backDisabled={backDisabled} nextDisabled={nextDisabled} onBack={() => { if (!backDisabled) onMonth(addMonths(monthDate, -1)); }} onNext={() => { if (!nextDisabled) onMonth(addMonths(monthDate, 1)); }} />
    <Card style={styles.monthCard}>
      <View style={styles.monthScoreRow}><View><Text style={styles.scoreLabel}>MONTH SCORE</Text><Text style={styles.score}>{score}%</Text></View><View style={styles.targetBadge}><Text style={styles.targetLabel}>TARGET</Text><Text style={styles.targetValue}>{MONTH_TARGET}%</Text></View></View>
      <View style={styles.calendarHeader}>{['M','T','W','T','F','S','S'].map((d, i) => <Text key={`${d}-${i}`} style={styles.calendarHeaderText}>{d}</Text>)}</View>
      <View style={styles.calendarGrid}>{Array.from({ length: offset + days }, (_, index) => {
        const day = index - offset + 1;
        if (day < 1) return <View key={`blank-${index}`} style={styles.calendarCell} />;
        const date = new Date(year, month, day, 12);
        const beforeAccount = dateOnly(date) < dateOnly(openedAt);
        const future = dateOnly(date) > dateOnly(today);
        const isToday = dateOnly(date) === dateOnly(today);
        const credit = beforeAccount ? 0 : effectiveCreditForDate(logs, date, today, openedAt);
        const recovered = beforeAccount ? 0 : comeback.recoveredByDate[dateOnly(date)] || 0;
        const complete = credit >= DAILY_TARGET;
        const colour = beforeAccount || future ? colours.card2 : complete ? recovered > 0 ? colours.purple : colours.green : isToday ? colours.blue : credit > 0 ? colours.gold : colours.red;
        return <View key={index} style={styles.calendarCell}><View style={[styles.calendarDay, { backgroundColor: colour }]}><Text style={[styles.calendarText, beforeAccount && styles.beforeAccountText]}>{day}</Text></View></View>;
      })}</View>
    </Card>
  </>;
}

function YearView({ logs, today, openedAt, year, onYear }: { logs: ActivityLog[]; today: Date; openedAt: Date; year: number; onYear: (year: number) => void }) {
  const backDisabled = year <= openedAt.getFullYear();
  const nextDisabled = year >= today.getFullYear();
  const values = Array.from({ length: 12 }, (_, month) => {
    const monthStart = new Date(year, month, 1, 12);
    const monthEnd = new Date(year, month + 1, 0, 12);
    if (monthEnd < openedAt || monthStart > new Date(today.getFullYear(), today.getMonth(), 1, 12)) return null;
    const startDay = year === openedAt.getFullYear() && month === openedAt.getMonth() ? openedAt.getDate() : 1;
    const endDay = year === today.getFullYear() && month === today.getMonth() ? today.getDate() : monthEnd.getDate();
    const activeDays = Math.max(0, endDay - startDay + 1);
    if (!activeDays) return null;
    const equivalent = Array.from({ length: activeDays }, (_, i) => effectiveCreditForDate(logs, new Date(year, month, startDay + i, 12), today, openedAt)).reduce((sum, c) => sum + Math.min(1, c / DAILY_TARGET), 0);
    const target = Math.max(1, Math.round(activeDays * (WEEKLY_ACTIVE_GOAL / 7)));
    return Math.min(100, Math.round((equivalent / target) * 100));
  });

  return <>
    <PeriodRow label={`${year}`} backDisabled={backDisabled} nextDisabled={nextDisabled} onBack={() => { if (!backDisabled) onYear(year - 1); }} onNext={() => { if (!nextDisabled) onYear(year + 1); }} />
    <Card style={styles.yearCard}>
      <View style={styles.yearTop}><Text style={styles.scoreLabel}>YEAR</Text><Text style={styles.target}>TARGET {MONTH_TARGET}%</Text></View>
      <View style={styles.chart}>
        <View pointerEvents="none" style={styles.targetLine}>
          <View style={styles.dashRow}>{Array.from({ length: 15 }, (_, index) => <View key={index} style={styles.targetDash} />)}</View>
          <Text style={styles.targetLineLabel}>{MONTH_TARGET}%</Text>
        </View>
        {values.map((value, index) => {
          const height = value === null ? 8 : Math.max(10, value * 1.35);
          const colour = value === null ? colours.card2 : value >= MONTH_TARGET ? colours.green : value >= MONTH_TARGET * 0.8 ? colours.yellow : colours.red;
          return <View key={index} style={styles.barColumn}><View style={[styles.bar, { height, backgroundColor: colour }]} /><Text style={styles.monthLetter}>{MONTHS[index]}</Text></View>;
        })}
      </View>
    </Card>
  </>;
}

function atNoon(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0); }
function startOfWeek(date: Date) { const copy = atNoon(date); const day = copy.getDay(); copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day)); return copy; }
function addDays(date: Date, amount: number) { const copy = atNoon(date); copy.setDate(copy.getDate() + amount); return copy; }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12); }
function dateOnly(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function dateLabel(date: Date) { return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase(); }
function sameDate(a: Date, b: Date) { return dateOnly(a) === dateOnly(b); }
function logsForDate(logs: ActivityLog[], date: Date) { return logs.filter((log) => sameDate(new Date(log.performed_at), date)); }
function rawCreditForDate(logs: ActivityLog[], date: Date) { return logsForDate(logs, date).reduce((sum, log) => sum + Number(log.credit_minutes || 0), 0); }
function normalCreditForDate(logs: ActivityLog[], date: Date) { return Math.min(DAILY_TARGET, rawCreditForDate(logs, date)); }
function extraCreditForDate(logs: ActivityLog[], date: Date) { return Math.max(0, rawCreditForDate(logs, date) - DAILY_TARGET); }
function getRollingComeback(logs: ActivityLog[], today: Date, openedAt: Date) {
  const start = addDays(today, -6);
  const deficits: { key: string; remaining: number }[] = [];
  const recoveredByDate: Record<string, number> = {};
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(start, index);
    if (dateOnly(date) < dateOnly(openedAt)) continue;
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
function effectiveCreditForDate(logs: ActivityLog[], date: Date, today: Date, openedAt: Date) {
  if (dateOnly(date) < dateOnly(openedAt)) return 0;
  const recovered = getRollingComeback(logs, today, openedAt).recoveredByDate[dateOnly(date)] || 0;
  return Math.min(DAILY_TARGET, normalCreditForDate(logs, date) + recovered);
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, scroll: { flex: 1 }, content: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 29, fontWeight: '900', marginTop: 18, marginBottom: 12 },
  segments: { backgroundColor: colours.card, borderWidth: 1, borderColor: colours.border, borderRadius: 11, flexDirection: 'row', padding: 3 },
  segment: { flex: 1, minHeight: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, segmentActive: { backgroundColor: colours.gold },
  segmentText: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, segmentTextActive: { color: colours.background },
  body: { marginTop: 9 }, muted: { color: colours.muted, fontSize: 10, marginTop: 20 },
  periodRow: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, period: { color: colours.white, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  chevronButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colours.border, alignItems: 'center', justifyContent: 'center' }, chevron: { color: colours.gold, fontSize: 27, lineHeight: 28 }, chevronDisabled: { opacity: 0.25 }, chevronTextDisabled: { color: colours.muted },
  weekList: { gap: 7 }, dayCard: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 11 }, completeCard: { borderColor: colours.green }, partialCard: { borderColor: colours.gold }, missedCard: { borderColor: colours.red }, comebackCard: { borderColor: colours.purple }, beforeAccountCard: { borderColor: colours.border, opacity: 0.6 },
  todayIncompleteCard: { backgroundColor: colours.blue, borderColor: colours.blue }, todayCompleteCard: { backgroundColor: colours.green, borderColor: colours.green }, dayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, dayDate: { color: colours.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, status: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  green: { color: colours.green }, gold: { color: colours.gold }, red: { color: colours.red }, purple: { color: colours.purple }, dayActivity: { color: colours.white, fontSize: 11, fontWeight: '800', marginTop: 4 }, dayActivityMuted: { color: colours.muted }, beforeAccountText: { color: colours.muted }, todayText: { color: colours.white }, comeback: { color: colours.purple, fontSize: 8, fontWeight: '900', marginTop: 3 }, todayMarker: { color: colours.white, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, textAlign: 'right', marginTop: 4 },
  monthCard: { paddingTop: 14, paddingBottom: 15 }, monthScoreRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 15 }, scoreLabel: { color: colours.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }, score: { color: colours.white, fontSize: 34, fontWeight: '900', lineHeight: 40, marginTop: 2 }, targetBadge: { backgroundColor: colours.card2, borderRadius: 10, minWidth: 78, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center' }, targetLabel: { color: colours.muted, fontSize: 7, fontWeight: '800', letterSpacing: 0.5 }, targetValue: { color: colours.gold, fontSize: 18, fontWeight: '900', marginTop: 1 }, target: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  calendarHeader: { flexDirection: 'row', marginBottom: 4 }, calendarHeaderText: { width: '14.2857%', textAlign: 'center', color: colours.muted, fontSize: 8, fontWeight: '900' }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, calendarCell: { width: '14.2857%', aspectRatio: 1, padding: 3 }, calendarDay: { flex: 1, borderRadius: 8, borderWidth: 2, borderColor: colours.card, alignItems: 'center', justifyContent: 'center' }, calendarText: { color: colours.white, fontSize: 9, fontWeight: '900' },
  yearCard: { paddingTop: 13, paddingBottom: 12 }, yearTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, chart: { height: 190, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, position: 'relative' }, targetLine: { position: 'absolute', left: 0, right: 0, bottom: 124, zIndex: 2 }, dashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }, targetDash: { width: 13, height: 2, borderRadius: 1, backgroundColor: colours.gold }, targetLineLabel: { position: 'absolute', right: 0, top: -12, color: colours.gold, fontSize: 7, fontWeight: '900' },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, bar: { width: 13, borderRadius: 4, marginBottom: 7 }, monthLetter: { color: colours.muted, fontSize: 7, fontWeight: '900' },
});
