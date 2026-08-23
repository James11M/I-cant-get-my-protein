import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

const DAILY_TARGET = 30;
const COMEBACK_RATE = 0.5;
const FIRE_XP = [120, 132, 144, 156, 170, 190, 214, 240];
const FIRE_MULTIPLIER = [1, 1.1, 1.2, 1.3, 1.42, 1.58, 1.78, 2];
const LEVELS = [
  [1, 'Starter', 0], [2, 'Rookie', 100], [3, 'Builder', 300], [4, 'Challenger', 700], [5, 'Athlete', 1500],
  [6, 'Competitor', 3100], [7, 'Performer', 6300], [8, 'Expert', 30000], [9, 'Leader', 42000], [10, 'Master', 51100],
] as const;

type ProteinProfile = {
  enabled: boolean;
  goal: string | null;
  override: number | null;
  weight: number | null;
  dob: string | null;
};

export default function HomeScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [protein, setProtein] = useState<ProteinProfile>({ enabled: false, goal: null, override: null, weight: null, dob: null });
  const today = useMemo(() => new Date(), []);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      const [items, userData] = await Promise.all([
        getActivityLogs().catch(() => [] as ActivityLog[]),
        supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null }, error: null }),
      ]);
      if (!live) return;
      setLogs(items);
      if (!supabase || !userData.data.user) return;
      const { data } = await supabase.from('profiles').select('date_of_birth,protein_enabled,protein_goal,protein_multiplier_override,current_weight_kg').eq('id', userData.data.user.id).single();
      if (!live || !data) return;
      setProtein({
        enabled: Boolean(data.protein_enabled),
        goal: data.protein_goal || null,
        override: data.protein_multiplier_override == null ? null : Number(data.protein_multiplier_override),
        weight: data.current_weight_kg == null ? null : Number(data.current_weight_kg),
        dob: data.date_of_birth || null,
      });
    }
    load().catch(() => { if (live) setLogs([]); });
    return () => { live = false; };
  }, []));

  const todaysLogs = logs.filter((log) => sameDate(new Date(log.performed_at), today));
  const rawTodayCredit = rawCreditForDate(logs, today);
  const todayCredit = Math.min(DAILY_TARGET, rawTodayCredit);
  const activeXP = Math.round(logs.reduce((sum, log) => sum + (Math.min(DAILY_TARGET, Number(log.credit_minutes || 0)) / DAILY_TARGET) * 120, 0));
  const rank = getRank(activeXP);
  const fireWindow = getFireWindow(logs, today);
  const fireScore = fireWindow.filter(Boolean).length;
  const priorFireScore = Math.min(7, fireWindow.slice(0, 6).filter(Boolean).length);
  const rewardXP = FIRE_XP[priorFireScore];
  const multiplier = FIRE_MULTIPLIER[priorFireScore];
  const comeback = getRollingComeback(logs, today);
  const complete = todayCredit >= DAILY_TARGET;
  const proteinMultiplier = getProteinMultiplier(protein, today);
  const proteinTarget = protein.weight && protein.goal && proteinMultiplier ? Math.round(protein.weight * proteinMultiplier) : null;
  const proteinRoute = !protein.weight && protein.goal ? '/(app)/measurements' : '/(app)/protein';

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>{today.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}  •  HOLIDAY</Text>

        <Pressable onPress={() => router.push('/(app)/levels')}>
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
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${rank.progress}%` }]} /></View>
            <Text style={styles.tinyMuted}>Rolling 12-month XP  •  VIEW LEVELS →</Text>
          </Card>
        </Pressable>

        {protein.enabled ? (
          <Pressable style={styles.proteinPress} onPress={() => router.push(proteinRoute)}>
            <Card style={styles.proteinCard}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.proteinLabel}>HIT MY PROTEIN</Text>
                  <Text style={styles.proteinValue}>{!protein.goal ? 'SET YOUR GOAL' : !protein.weight ? 'ADD YOUR WEIGHT' : `${proteinTarget}g`}</Text>
                  <Text style={styles.proteinMeta}>{proteinTarget ? `${protein.weight} kg × ${proteinMultiplier?.toFixed(1)} g/kg • daily target` : !protein.goal ? 'Choose a protein goal to calculate your target.' : 'Add Weight in Stats & Measurements to calculate your target.'}</Text>
                </View>
                <View style={styles.proteinViewButton}><Text style={styles.proteinViewText}>VIEW →</Text></View>
              </View>
            </Card>
          </Pressable>
        ) : null}

        <Card style={styles.targetCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>TODAY'S TARGET</Text>
              <Text style={[styles.targetValue, complete && styles.targetValueComplete]}>{Math.round(rawTodayCredit)} / 30</Text>
              <Text style={styles.smallMuted}>credit minutes</Text>
            </View>
            <ProgressRing minutes={rawTodayCredit} target={DAILY_TARGET} />
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (rawTodayCredit / DAILY_TARGET) * 100)}%`, backgroundColor: complete ? colours.green : colours.gold }]} />
          </View>

          <View style={styles.rewardPanel}>
            <View>
              <Text style={styles.rewardLabel}>{complete ? 'XP EARNED' : 'WHEN COMPLETE'}</Text>
              <Text style={styles.rewardXp}>+{rewardXP} XP</Text>
            </View>
            <View style={styles.rewardRight}>
              <Text style={styles.multiplier}>×{multiplier.toFixed(2)}</Text>
              <Text style={styles.rewardSub}>consistency boost</Text>
            </View>
          </View>

          <View style={styles.fireSection}>
            <View style={styles.flex}>
              <Text style={styles.fireLabel}>7-DAY FIRE SCORE</Text>
              <View style={styles.fireRow}>
                {fireWindow.map((done, index) => (
                  <View key={index} style={[styles.fireWrap, index === 6 && styles.fireToday]}>
                    <Text style={[styles.fireEmoji, !done && styles.fireOff]}>🔥</Text>
                  </View>
                ))}
              </View>
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

        <Pressable style={styles.comebackPress} onPress={() => router.push('/(app)/comeback')}>
          <Card style={styles.comebackCard}>
            <View style={styles.rowBetween}>
              <View style={styles.inline}><Text style={styles.comebackIcon}>↻</Text><Text style={styles.comebackLabel}>WEEKLY COMEBACK</Text></View>
              <Text style={styles.open}>VIEW →</Text>
            </View>
            <Text style={styles.comebackTitle}>{Math.round(comeback.missing)} missing minutes</Text>
          </Card>
        </Pressable>
      </ScrollView>
      <BottomNav active="today" />
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
function effectiveCredit(logs: ActivityLog[], date: Date, today: Date) {
  const comeback = getRollingComeback(logs, today);
  return Math.min(DAILY_TARGET, normalCreditForDate(logs, date) + (comeback.recoveredByDate[dateKey(date)] || 0));
}
function effectiveComplete(logs: ActivityLog[], date: Date, today: Date) { return effectiveCredit(logs, date, today) >= DAILY_TARGET; }
function getFireWindow(logs: ActivityLog[], today: Date) { return Array.from({ length: 7 }, (_, index) => { const date = addDays(today, index - 6); return effectiveComplete(logs, date, today); }); }
function getRank(xp: number) {
  let current = LEVELS[0]; let next: typeof LEVELS[number] | null = LEVELS[1];
  LEVELS.forEach((level, index) => { if (xp >= level[2]) { current = level; next = LEVELS[index + 1] || null; } });
  if (!next) return { level: current[0], title: current[1], next: null, xpToNext: 0, progress: 100 };
  const progress = Math.max(0, Math.min(100, Math.round(((xp - current[2]) / (next[2] - current[2])) * 100)));
  return { level: current[0], title: current[1], next: { title: next[1] }, xpToNext: next[2] - xp, progress };
}
function ageFromIsoDate(value: string | null, today: Date) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
}
function getProteinMultiplier(profile: ProteinProfile, today: Date) {
  if (!profile.goal) return null;
  if (profile.override !== null) return profile.override;
  const under18 = (ageFromIsoDate(profile.dob, today) ?? 18) < 18;
  if (profile.goal === 'stay_active') return under18 ? 1.2 : 1.4;
  if (profile.goal === 'training_recovery') return 1.4;
  if (profile.goal === 'build_muscle') return under18 ? 1.5 : 1.6;
  if (profile.goal === 'lose_fat_keep_muscle') return under18 ? null : 1.8;
  return null;
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 29, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex: { flex: 1 },
  goldLabel: { color: colours.gold, fontSize: 9, fontWeight: '900' },
  sectionTitle: { color: colours.white, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  smallMuted: { color: colours.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  tinyMuted: { color: colours.muted, fontSize: 7, marginTop: 5 },

  levelCard: { borderColor: colours.gold },
  levelTitle: { color: colours.white, fontSize: 23, fontWeight: '900', marginTop: 2 },
  activeXp: { color: colours.white, fontSize: 12, fontWeight: '800', marginTop: 5 },
  nextLevel: { color: colours.gold, fontSize: 10, fontWeight: '900', marginTop: 5 },
  levelCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: colours.gold, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  levelNumber: { color: colours.gold, fontSize: 23, fontWeight: '900' },

  proteinPress: { marginTop: 12 },
  proteinCard: { borderColor: colours.gold, backgroundColor: colours.card2 },
  proteinLabel: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  proteinValue: { color: colours.white, fontSize: 22, fontWeight: '900', marginTop: 4 },
  proteinMeta: { color: colours.muted, fontSize: 8, lineHeight: 13, marginTop: 4, paddingRight: 8 },
  proteinViewButton: { minHeight: 32, minWidth: 68, borderWidth: 1, borderColor: colours.gold, borderRadius: 9, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colours.card, marginLeft: 10 },
  proteinViewText: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },

  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colours.card2, overflow: 'hidden', marginTop: 11 },
  progressFill: { height: '100%', backgroundColor: colours.gold },

  targetCard: { marginTop: 12, borderColor: colours.blue },
  targetValue: { color: colours.white, fontSize: 28, fontWeight: '900', marginTop: 5 },
  targetValueComplete: { color: colours.green },

  rewardPanel: { backgroundColor: colours.card2, borderRadius: 11, padding: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 },
  rewardLabel: { color: colours.muted, fontSize: 8, fontWeight: '900' },
  rewardXp: { color: colours.gold, fontSize: 21, fontWeight: '900', marginTop: 2 },
  rewardRight: { alignItems: 'flex-end' },
  multiplier: { color: colours.orange, fontSize: 16, fontWeight: '900' },
  rewardSub: { color: colours.muted, fontSize: 7 },

  fireSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 },
  fireLabel: { color: colours.muted, fontSize: 8, fontWeight: '900' },
  fireRow: { flexDirection: 'row', marginTop: 3 },
  fireWrap: { width: 28, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  fireToday: { borderWidth: 2, borderColor: colours.gold, transform: [{ translateX: 2 }] },
  fireEmoji: { fontSize: 22 },
  fireOff: { opacity: 0.18 },
  fireCount: { color: colours.orange, fontSize: 27, fontWeight: '900', marginBottom: 2 },

  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colours.border, paddingTop: 11, marginTop: 12 },
  capacityLabel: { color: colours.muted, fontSize: 7, fontWeight: '900' },
  capacityValue: { color: colours.white, fontSize: 12, fontWeight: '900', marginTop: 3 },

  activityCard: { marginTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 18 },
  emptyEmoji: { fontSize: 27 },
  emptyText: { color: colours.white, fontSize: 11, fontWeight: '900', marginTop: 5 },
  loggedRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colours.border, marginTop: 8, paddingTop: 8 },
  loggedEmoji: { width: 38, fontSize: 21 },
  loggedTitle: { color: colours.white, fontSize: 13, fontWeight: '900' },
  loggedMeta: { color: colours.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  primary: { backgroundColor: colours.gold, borderRadius: 10, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  primaryText: { color: colours.background, fontSize: 11, fontWeight: '900' },

  comebackPress: { marginTop: 12 },
  comebackCard: { borderColor: colours.purple, backgroundColor: colours.card2 },
  inline: { flexDirection: 'row', alignItems: 'center' },
  comebackIcon: { color: colours.purple, fontSize: 20, fontWeight: '900', marginRight: 7 },
  comebackLabel: { color: colours.purple, fontSize: 9, fontWeight: '900' },
  open: { color: colours.purple, fontSize: 9, fontWeight: '900' },
  comebackTitle: { color: colours.white, fontSize: 18, fontWeight: '900', marginTop: 7 },
});