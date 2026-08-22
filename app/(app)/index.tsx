import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

const DAILY_TARGET = 30;
const FIRE_XP = [120, 132, 144, 156, 170, 190, 214, 240];
const FIRE_MULTIPLIER = [1, 1.1, 1.2, 1.3, 1.42, 1.58, 1.78, 2];
const LEVELS = [
  [1, 'Starter', 0], [2, 'Rookie', 100], [3, 'Builder', 300], [4, 'Challenger', 700], [5, 'Athlete', 1500],
  [6, 'Competitor', 3100], [7, 'Performer', 6300], [8, 'Expert', 30000], [9, 'Leader', 42000], [10, 'Master', 51100],
] as const;

export default function HomeScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const today = useMemo(() => new Date(), []);

  useFocusEffect(useCallback(() => {
    let live = true;
    getActivityLogs().then((items) => { if (live) setLogs(items); }).catch(() => { if (live) setLogs([]); });
    return () => { live = false; };
  }, []));

  const todaysLogs = logs.filter((log) => sameDate(new Date(log.performed_at), today));
  const todayCredit = todaysLogs.reduce((sum, log) => sum + Number(log.credit_minutes || 0), 0);
  const activeXP = Math.round(logs.reduce((sum, log) => sum + (Number(log.credit_minutes || 0) / DAILY_TARGET) * 120, 0));
  const rank = getRank(activeXP);
  const fireWindow = getFireWindow(logs, today);
  const fireScore = fireWindow.filter(Boolean).length;
  const projectedFire = todayCredit >= DAILY_TARGET ? fireScore : Math.min(7, fireWindow.slice(0, 6).filter(Boolean).length + 1);
  const rewardXP = FIRE_XP[projectedFire];
  const multiplier = FIRE_MULTIPLIER[projectedFire];
  const missing = getWeeklyMissing(logs, today);

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>{today.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}  •  HOLIDAY</Text>

        <Card style={styles.levelCard}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.goldLabel}>LEVEL {rank.level}</Text>
              <Text style={styles.levelTitle}>{rank.title}</Text>
              <Text style={styles.activeXp}>{activeXP.toLocaleString()} ACTIVE XP</Text>
              {rank.next ? <Text style={styles.nextLevel}>{rank.xpToNext.toLocaleString()} XP → {rank.next.title}</Text> : null}
            </View>
            <View style={styles.levelCircle}><Text style={styles.levelNumber}>{rank.level}</Text></View>
          </View>
          <View style={styles.levelTrack}><View style={[styles.levelFill, { width: `${rank.progress}%` }]} /></View>
        </Card>

        <Card style={styles.targetCard}>
          <Text style={styles.sectionTitle}>TODAY'S TARGET</Text>
          <View style={styles.targetTop}>
            <View style={styles.ringWrap}><ProgressRing minutes={todayCredit} target={DAILY_TARGET} /></View>
            <View style={styles.rewardPanel}>
              <Text style={styles.rewardXp}>+{rewardXP} XP</Text>
              <Text style={styles.rewardSub}>TODAY'S REWARD</Text>
              <View style={styles.rewardDivider} />
              <Text style={styles.multiplier}>×{multiplier.toFixed(2)}</Text>
              <Text style={styles.rewardSub}>consistency boost</Text>
            </View>
          </View>

          <View style={styles.fireSection}>
            <View style={styles.flex}>
              <Text style={styles.fireLabel}>7-DAY FIRE SCORE</Text>
              <View style={styles.fireRow}>{fireWindow.map((complete, index) => <View key={index} style={[styles.fireBubble, index === 6 && styles.fireToday]}><Text style={[styles.fireEmoji, !complete && styles.fireOff]}>🔥</Text></View>)}</View>
            </View>
            <Text style={styles.fireCount}>{fireScore}</Text>
          </View>

          <View style={styles.capacityRow}>
            <View><Text style={styles.capacityLabel}>AVAILABLE TODAY</Text><Text style={styles.capacityValue}>180 min</Text></View>
          </View>
        </Card>

        <Card style={styles.activityCard}>
          <Text style={styles.sectionTitle}>TODAY'S ACTIVITY</Text>
          {todaysLogs.length === 0 ? <View style={styles.empty}><Text style={styles.emptyEmoji}>💤</Text><Text style={styles.emptyText}>Nothing logged yet</Text></View> : todaysLogs.map((log) => <View key={log.id} style={styles.loggedRow}><Text style={styles.loggedEmoji}>{log.activity_icon || '⚡'}</Text><View style={styles.flex}><Text style={styles.loggedTitle}>{log.activity_name}</Text><Text style={styles.loggedMeta}>{log.duration_minutes} min{log.amount !== null && log.unit ? ` • ${log.amount} ${log.unit}` : ''}</Text></View></View>)}
          <Pressable style={styles.primary} onPress={() => router.push('/(app)/add')}><Text style={styles.primaryText}>+ ADD TRAINING</Text></Pressable>
        </Card>

        <Card style={styles.comebackCard}>
          <View style={styles.rowBetween}><View style={styles.inline}><Text style={styles.comebackIcon}>↻</Text><Text style={styles.comebackLabel}>WEEKLY COMEBACK</Text></View><Text style={styles.open}>OPEN</Text></View>
          <Text style={styles.comebackTitle}>{Math.round(missing)} missing minutes</Text>
        </Card>
      </ScrollView>
      <BottomNav active="today" />
    </Screen>
  );
}

function sameDate(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function addDays(date: Date, amount: number) { const copy = new Date(date); copy.setDate(copy.getDate() + amount); return copy; }
function startOfWeek(date: Date) { const copy = new Date(date); const day = copy.getDay(); copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day)); return copy; }
function creditForDate(logs: ActivityLog[], date: Date) { return logs.filter((log) => sameDate(new Date(log.performed_at), date)).reduce((sum, log) => sum + Number(log.credit_minutes || 0), 0); }
function getFireWindow(logs: ActivityLog[], today: Date) { return Array.from({ length: 7 }, (_, index) => creditForDate(logs, addDays(today, index - 6)) >= DAILY_TARGET); }
function getWeeklyMissing(logs: ActivityLog[], today: Date) { const monday = startOfWeek(today); let missing = 0; for (let i = 0; i < 7; i += 1) { const date = addDays(monday, i); if (dateKey(date) > dateKey(today)) break; missing += Math.max(0, DAILY_TARGET - Math.min(DAILY_TARGET, creditForDate(logs, date))); } return missing; }
function getRank(xp: number) {
  let current = LEVELS[0]; let next: typeof LEVELS[number] | null = LEVELS[1];
  LEVELS.forEach((level, index) => { if (xp >= level[2]) { current = level; next = LEVELS[index + 1] || null; } });
  if (!next) return { level: current[0], title: current[1], next: null, xpToNext: 0, progress: 100 };
  const progress = Math.max(0, Math.min(100, Math.round(((xp - current[2]) / (next[2] - current[2])) * 100)));
  return { level: current[0], title: current[1], next: { title: next[1] }, xpToNext: next[2] - xp, progress };
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, scroll: { flex: 1 }, scrollContent: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 31, lineHeight: 34, fontWeight: '900', marginTop: 18 }, subtitle: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 2, marginBottom: 8 },
  levelCard: { paddingVertical: 11 }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, flex: { flex: 1 }, goldLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, levelTitle: { color: colours.white, fontSize: 22, fontWeight: '900', marginTop: 1 }, activeXp: { color: colours.white, fontSize: 9, fontWeight: '900', marginTop: 2 }, nextLevel: { color: colours.muted, fontSize: 8, fontWeight: '800', marginTop: 2 }, levelCircle: { width: 49, height: 49, borderRadius: 25, borderWidth: 3, borderColor: colours.gold, alignItems: 'center', justifyContent: 'center' }, levelNumber: { color: colours.white, fontSize: 24, fontWeight: '900' }, levelTrack: { height: 6, borderRadius: 4, backgroundColor: colours.card3 || colours.ringTrack, marginTop: 9, overflow: 'hidden' }, levelFill: { height: '100%', backgroundColor: colours.gold, borderRadius: 4 },
  targetCard: { marginTop: 7, paddingVertical: 10 }, sectionTitle: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, targetTop: { flexDirection: 'row', alignItems: 'center', minHeight: 150 }, ringWrap: { width: 176, marginLeft: -6 }, rewardPanel: { flex: 1, backgroundColor: colours.card2, borderRadius: 12, minHeight: 115, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, rewardXp: { color: colours.gold, fontSize: 22, fontWeight: '900' }, rewardSub: { color: colours.muted, fontSize: 7, fontWeight: '900', textAlign: 'center', marginTop: 2 }, rewardDivider: { width: '75%', height: 1, backgroundColor: colours.border, marginVertical: 8 }, multiplier: { color: colours.white, fontSize: 17, fontWeight: '900' },
  fireSection: { borderTopWidth: 1, borderTopColor: colours.border, flexDirection: 'row', alignItems: 'center', paddingTop: 8 }, fireLabel: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1 }, fireRow: { flexDirection: 'row', gap: 3, marginTop: 4 }, fireBubble: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, fireToday: { borderWidth: 1, borderColor: colours.gold }, fireEmoji: { fontSize: 15 }, fireOff: { opacity: 0.18 }, fireCount: { color: colours.white, fontSize: 26, fontWeight: '900', marginLeft: 7 },
  capacityRow: { borderTopWidth: 1, borderTopColor: colours.border, marginTop: 8, paddingTop: 7 }, capacityLabel: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1 }, capacityValue: { color: colours.white, fontSize: 14, fontWeight: '900', marginTop: 1 },
  activityCard: { marginTop: 7, paddingVertical: 10 }, empty: { alignItems: 'center', paddingVertical: 8 }, emptyEmoji: { fontSize: 19 }, emptyText: { color: colours.muted, fontSize: 10, fontWeight: '800', marginTop: 3 }, loggedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colours.border }, loggedEmoji: { fontSize: 20, marginRight: 9 }, loggedTitle: { color: colours.white, fontSize: 11, fontWeight: '900' }, loggedMeta: { color: colours.muted, fontSize: 8, marginTop: 2 }, primary: { backgroundColor: colours.gold, borderRadius: 11, minHeight: 39, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, primaryText: { color: colours.background, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  comebackCard: { marginTop: 7, borderColor: '#9A72E8', paddingVertical: 10 }, inline: { flexDirection: 'row', alignItems: 'center' }, comebackIcon: { color: '#9A72E8', fontSize: 20, fontWeight: '900', marginRight: 7 }, comebackLabel: { color: '#9A72E8', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, open: { color: colours.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, comebackTitle: { color: colours.white, fontSize: 14, fontWeight: '900', marginTop: 5 },
});
