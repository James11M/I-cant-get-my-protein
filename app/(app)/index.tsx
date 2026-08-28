import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { CardAction } from '@/components/CardAction';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs, removeActivityLog } from '@/features/activities/activity.service';
import { getLinkedSchool, isSchoolTermTime, SchoolCalendarEntry } from '@/features/schools/school.service';
import { calculateXpSummary, DAILY_TARGET, effectiveComplete, getTodayReward } from '@/features/xp/xp';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

const COMEBACK_RATE = 0.5;

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
  const [schoolCalendar, setSchoolCalendar] = useState<SchoolCalendarEntry[]>([]);
  const today = useMemo(() => new Date(), []);

  useFocusEffect(useCallback(() => {
    let live = true;

    async function load() {
      const [items, userData, school] = await Promise.all([
        getActivityLogs().catch(() => [] as ActivityLog[]),
        supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null }, error: null }),
        getLinkedSchool().catch(() => ({ school: null, calendar: [] as SchoolCalendarEntry[] })),
      ]);

      if (!live) return;
      setLogs(items);
      setSchoolCalendar(school.calendar);

      if (!supabase || !userData.data.user) return;
      const { data } = await supabase
        .from('profiles')
        .select('date_of_birth,protein_enabled,protein_goal,protein_multiplier_override,current_weight_kg')
        .eq('id', userData.data.user.id)
        .single();

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

  async function removeLog(id: string) {
    try {
      await removeActivityLog(id);
      setLogs((items) => items.filter((item) => item.id !== id));
    } catch {}
  }

  const todaysLogs = logs.filter((log) => sameDate(new Date(log.performed_at), today));
  const rawTodayCredit = rawCreditForDate(logs, today);
  const complete = rawTodayCredit >= DAILY_TARGET;
  const xp = calculateXpSummary(logs, today);
  const rank = xp.rank;
  const reward = getTodayReward(logs, today);
  const fireWindow = Array.from({ length: 7 }, (_, index) => effectiveComplete(logs, addDays(today, index - 6), today));
  const fireScore = fireWindow.filter(Boolean).length;
  const comeback = getRollingComeback(logs, today);
  const comebackMinutes = comeback.totalExtra * COMEBACK_RATE;
  const proteinMultiplier = getProteinMultiplier(protein, today);
  const proteinTarget = protein.weight && protein.goal && proteinMultiplier ? Math.round(protein.weight * proteinMultiplier) : null;
  const proteinGoalTitle = getProteinGoalTitle(protein, today);
  const proteinRoute = !protein.goal ? '/(app)/protein' : !protein.weight ? '/(app)/measurements' : '/(app)/protein-details';
  const dayType = schoolCalendar.length ? (isSchoolTermTime(schoolCalendar, today) ? 'TERM TIME' : 'HOLIDAY') : 'HOLIDAY';

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>{today.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}  •  {dayType}</Text>

        <Pressable onPress={() => router.push('/(app)/levels')}>
          <Card style={styles.levelCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text style={styles.goldLabel}>{rank.eyebrow}</Text>
                <Text style={styles.levelTitle}>{rank.title}</Text>
                <Text style={styles.activeXp}>{xp.activeXp.toLocaleString()} ACTIVE XP</Text>
                {rank.next ? <Text style={styles.nextLevel}>{rank.xpToNext.toLocaleString()} XP → {rank.next.title}</Text> : <Text style={styles.nextLevel}>TOP RANK</Text>}
              </View>
              <View style={[styles.levelCircle, rank.kind === 'master-star' && styles.starCircle]}>
                <Text style={[styles.levelNumber, rank.kind === 'master-star' && styles.starNumber]}>{rank.badge}</Text>
              </View>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${rank.progress}%` }]} /></View>
            <Text style={styles.tinyMuted}>Rolling 12-month XP  •  VIEW LEVELS →</Text>
          </Card>
        </Pressable>

        <Card style={styles.targetCard}>
          <View style={styles.rowBetween}>
            <View style={styles.targetCopy}>
              <Text style={styles.sectionTitle}>TODAY'S TARGET</Text>
              <Text style={[styles.targetValue, complete && styles.targetValueComplete]}>{Math.round(rawTodayCredit)} / 30</Text>
              <Text style={styles.smallMuted}>credit minutes</Text>
            </View>
            <View style={styles.ringSlot}><ProgressRing minutes={rawTodayCredit} target={DAILY_TARGET} /></View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (rawTodayCredit / DAILY_TARGET) * 100)}%`, backgroundColor: complete ? colours.green : colours.gold }]} /></View>
          <View style={styles.rewardPanel}>
            <View style={styles.rewardLeft}>
              <Text style={styles.rewardLabel}>{complete ? 'XP EARNED' : 'WHEN COMPLETE'}</Text>
              <Text style={styles.rewardXp}>+{reward.xp} XP</Text>
            </View>
            <View style={styles.rewardRight}>
              <Text numberOfLines={1} style={styles.multiplier}>×{reward.multiplier.toFixed(2)}</Text>
              <Text numberOfLines={1} style={styles.rewardSub}>consistency boost</Text>
            </View>
          </View>
          <View style={styles.fireSection}>
            <View style={styles.flex}>
              <Text style={styles.fireLabel}>7-DAY FIRE SCORE</Text>
              <View style={styles.fireRow}>{fireWindow.map((done, index) => <View key={index} style={[styles.fireWrap, index === 6 && styles.fireToday]}><Text style={[styles.fireEmoji, !done && styles.fireOff]}>🔥</Text></View>)}</View>
            </View>
            <Text style={styles.fireCount}>{fireScore}</Text>
          </View>
          <View style={styles.capacityRow}><View><Text style={styles.capacityLabel}>AVAILABLE TODAY</Text><Text style={styles.capacityValue}>180 min</Text></View></View>
        </Card>

        <Card style={styles.activityCard}>
          <Text style={styles.sectionTitle}>TODAY'S ACTIVITY</Text>
          {todaysLogs.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyEmoji}>💤</Text><Text style={styles.emptyText}>Nothing logged yet</Text></View>
          ) : todaysLogs.map((log) => (
            <View key={log.id} style={styles.loggedRow}>
              <Text style={styles.loggedEmoji}>{log.activity_icon || '⚡'}</Text>
              <View style={styles.flex}><Text style={styles.loggedTitle}>{log.activity_name}</Text><Text style={styles.loggedMeta}>{formatMinutes(Number(log.duration_minutes))} min{log.amount !== null && log.unit ? ` • ${log.amount} ${log.unit}` : ''}</Text></View>
              <Pressable style={styles.removeButton} onPress={() => removeLog(log.id)}><Text style={styles.removeText}>✕ REMOVE</Text></Pressable>
            </View>
          ))}
          <PrimaryActionButton label="+ ADD TRAINING" onPress={() => router.push('/(app)/add')} style={styles.addTraining} />
        </Card>

        <Pressable style={styles.comebackPress} onPress={() => router.push('/(app)/comeback')}>
          <Card style={styles.comebackCard}>
            <View style={styles.rowBetween}><View style={styles.inline}><Text style={styles.comebackIcon}>↻</Text><Text style={styles.comebackLabel}>COMEBACK MINUTES</Text></View><CardAction colour={colours.purple} /></View>
            <Text style={styles.comebackTitle}>{formatMinutes(comebackMinutes)} comeback minutes</Text>
          </Card>
        </Pressable>

        {protein.enabled ? (
          <Pressable style={styles.proteinPress} onPress={() => router.push(proteinRoute)}>
            <Card style={styles.proteinCard}>
              <View style={styles.cardTitleRow}><Text style={styles.proteinLabel}>HIT MY PROTEIN</Text><CardAction colour={colours.gold} /></View>
              {proteinTarget && proteinGoalTitle ? (
                <><Text style={styles.levelTitle}>{proteinGoalTitle}</Text><Text style={styles.proteinTarget}>{proteinTarget}g DAILY TARGET</Text><Text style={styles.proteinMeta}>{protein.weight} kg × {proteinMultiplier?.toFixed(1)} g/kg</Text></>
              ) : (
                <><Text style={styles.proteinValue}>{!protein.goal ? 'SET YOUR GOAL' : 'ADD YOUR WEIGHT'}</Text><Text style={styles.proteinMeta}>{!protein.goal ? 'Choose a protein goal to calculate your target.' : 'Add Weight in Stats & Measurements to calculate your target.'}</Text></>
              )}
            </Card>
          </Pressable>
        ) : null}
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
function getRollingComeback(logs: ActivityLog[], today: Date) { const windowStart = addDays(today, -6); const deficits: { key: string; remaining: number }[] = []; let totalExtra = 0; for (let index = 0; index < 7; index += 1) { const date = addDays(windowStart, index); const normal = normalCreditForDate(logs, date); const missing = Math.max(0, DAILY_TARGET - normal); const extra = extraCreditForDate(logs, date); totalExtra += extra; let available = extra * COMEBACK_RATE; for (let deficitIndex = deficits.length - 1; deficitIndex >= 0 && available > 0; deficitIndex -= 1) { const deficit = deficits[deficitIndex]; if (deficit.remaining <= 0) continue; const applied = Math.min(available, deficit.remaining); deficit.remaining -= applied; available -= applied; } if (missing > 0) deficits.push({ key: dateKey(date), remaining: missing }); } return { totalExtra }; }
function ageFromIsoDate(value: string | null, today: Date) { if (!value) return null; const [year, month, day] = value.split('-').map(Number); let age = today.getFullYear() - year; if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1; return age; }
function getProteinMultiplier(profile: ProteinProfile, today: Date) { if (!profile.goal) return null; if (profile.override !== null) return profile.override; const under18 = (ageFromIsoDate(profile.dob, today) ?? 18) < 18; if (profile.goal === 'stay_active') return under18 ? 1.2 : 1.4; if (profile.goal === 'training_recovery') return 1.4; if (profile.goal === 'build_muscle') return under18 ? 1.5 : 1.6; if (profile.goal === 'lose_fat_keep_muscle') return under18 ? null : 1.8; return null; }
function getProteinGoalTitle(profile: ProteinProfile, today: Date) { if (!profile.goal) return null; const under18 = (ageFromIsoDate(profile.dob, today) ?? 18) < 18; if (profile.goal === 'stay_active') return 'Stay Active'; if (profile.goal === 'training_recovery') return 'Training & Recovery'; if (profile.goal === 'build_muscle') return under18 ? 'Build Strength & Muscle' : 'Build Muscle'; if (profile.goal === 'lose_fat_keep_muscle') return 'Lose Fat, Keep Muscle'; return null; }
function formatMinutes(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, scroll: { flex: 1 }, scrollContent: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 29, fontWeight: '900', marginTop: 18, marginBottom: 8 }, subtitle: { color: colours.muted, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }, flex: { flex: 1 }, inline: { flexDirection: 'row', alignItems: 'center' },
  goldLabel: { color: colours.gold, fontSize: 9, fontWeight: '900' }, sectionTitle: { color: colours.white, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 }, smallMuted: { color: colours.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, tinyMuted: { color: colours.muted, fontSize: 7, marginTop: 5 },
  levelCard: { borderColor: colours.gold }, levelTitle: { color: colours.white, fontSize: 23, fontWeight: '900', marginTop: 2 }, activeXp: { color: colours.white, fontSize: 12, fontWeight: '800', marginTop: 5 }, nextLevel: { color: colours.gold, fontSize: 10, fontWeight: '900', marginTop: 5 },
  levelCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: colours.gold, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }, starCircle: { backgroundColor: colours.card2 }, levelNumber: { color: colours.gold, fontSize: 23, fontWeight: '900' }, starNumber: { fontSize: 15 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colours.card2, overflow: 'hidden', marginTop: 11 }, progressFill: { height: '100%', backgroundColor: colours.gold },
  targetCard: { marginTop: 12, borderColor: colours.blue }, targetCopy: { flex: 1, minWidth: 0 }, ringSlot: { width: '42%', maxWidth: 112, alignItems: 'flex-end', justifyContent: 'center' }, targetValue: { color: colours.white, fontSize: 28, fontWeight: '900', marginTop: 5 }, targetValueComplete: { color: colours.green },
  rewardPanel: { backgroundColor: colours.card2, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13, gap: 14 }, rewardLeft: { flex: 1, minWidth: 0 }, rewardLabel: { color: colours.muted, fontSize: 8, fontWeight: '900' }, rewardXp: { color: colours.gold, fontSize: 21, fontWeight: '900', marginTop: 2 }, rewardRight: { minWidth: 104, alignItems: 'flex-end' }, multiplier: { color: colours.gold, fontSize: 17, fontWeight: '900' }, rewardSub: { color: colours.muted, fontSize: 7, marginTop: 1 },
  fireSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }, fireLabel: { color: colours.muted, fontSize: 8, fontWeight: '900' }, fireRow: { flexDirection: 'row', marginTop: 3 }, fireWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, fireToday: { borderWidth: 1, borderColor: colours.gold, borderRadius: 14 }, fireEmoji: { fontSize: 17 }, fireOff: { opacity: 0.2 }, fireCount: { color: colours.gold, fontSize: 25, fontWeight: '900' },
  capacityRow: { borderTopWidth: 1, borderTopColor: colours.border, marginTop: 10, paddingTop: 9 }, capacityLabel: { color: colours.muted, fontSize: 8, fontWeight: '900' }, capacityValue: { color: colours.white, fontSize: 14, fontWeight: '900', marginTop: 2 },
  activityCard: { marginTop: 12 }, empty: { alignItems: 'center', paddingVertical: 12 }, emptyEmoji: { fontSize: 20 }, emptyText: { color: colours.muted, fontSize: 10, fontWeight: '800', marginTop: 4 }, loggedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colours.border }, loggedEmoji: { fontSize: 21, marginRight: 9 }, loggedTitle: { color: colours.white, fontSize: 12, fontWeight: '900' }, loggedMeta: { color: colours.muted, fontSize: 9, marginTop: 2 }, removeButton: { paddingHorizontal: 7, paddingVertical: 5 }, removeText: { color: colours.red, fontSize: 7, fontWeight: '900' }, addTraining: { marginTop: 9 },
  comebackPress: { marginTop: 12 }, comebackCard: { borderColor: colours.purple }, comebackIcon: { color: colours.purple, fontSize: 20, fontWeight: '900', marginRight: 7 }, comebackLabel: { color: colours.purple, fontSize: 9, fontWeight: '900' }, comebackTitle: { color: colours.white, fontSize: 15, fontWeight: '900', marginTop: 6 },
  proteinPress: { marginTop: 12 }, proteinCard: { borderColor: colours.gold }, proteinLabel: { color: colours.gold, fontSize: 9, fontWeight: '900' }, proteinTarget: { color: colours.gold, fontSize: 20, fontWeight: '900', marginTop: 5 }, proteinMeta: { color: colours.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, proteinValue: { color: colours.white, fontSize: 18, fontWeight: '900', marginTop: 7 },
});