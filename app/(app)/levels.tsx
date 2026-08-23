import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

const DAILY_TARGET = 30;
const LEVELS = [
  [1, 'Starter', 0], [2, 'Rookie', 100], [3, 'Builder', 300], [4, 'Challenger', 700], [5, 'Athlete', 1500],
  [6, 'Competitor', 3100], [7, 'Performer', 6300], [8, 'Expert', 30000], [9, 'Leader', 42000], [10, 'Master', 51100],
] as const;

export default function LevelsScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useFocusEffect(useCallback(() => {
    let live = true;
    getActivityLogs().then((items) => { if (live) setLogs(items); }).catch(() => { if (live) setLogs([]); });
    return () => { live = false; };
  }, []));

  const activeXP = Math.round(logs.reduce((sum, log) => sum + (Math.min(DAILY_TARGET, Number(log.credit_minutes || 0)) / DAILY_TARGET) * 120, 0));
  const lifetimeXP = activeXP;
  const rank = getRank(activeXP);

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Brand />
        <BackButton />
        <Text style={styles.title}>Progress</Text>

        <Card style={styles.activeCard}>
          <Text style={styles.goldLabel}>ACTIVE LEVEL</Text>
          <Text style={styles.levelTitle}>Level {rank.level} • {rank.title}</Text>
          <Text style={styles.activeXp}>{activeXP.toLocaleString()} XP</Text>
          {rank.next ? <Text style={styles.nextLevel}>{rank.xpToNext.toLocaleString()} XP → {rank.next.title}</Text> : <Text style={styles.nextLevel}>MASTER LEVEL</Text>}
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${rank.progress}%` }]} /></View>
          <Text style={styles.note}>Active XP reflects the previous 365 days.</Text>
          <Text style={styles.note}>Lifetime XP is retained separately.</Text>
        </Card>

        <Card style={styles.xpSummary}>
          <View style={styles.xpBox}><Text style={styles.xpValue}>{activeXP.toLocaleString()}</Text><Text style={styles.xpLabel}>ACTIVE XP</Text></View>
          <View style={styles.xpBox}><Text style={styles.xpValue}>{lifetimeXP.toLocaleString()}</Text><Text style={styles.xpLabel}>LIFETIME XP</Text></View>
        </Card>

        <Text style={styles.sectionTitle}>LEVELS</Text>
        {LEVELS.map(([level, title, threshold]) => {
          const reached = activeXP >= threshold;
          const current = rank.level === level;
          return (
            <Card key={level} style={[styles.levelRow, current && styles.currentLevel]}>
              <View style={[styles.levelBadge, !reached && styles.levelBadgeLocked]}><Text style={[styles.levelBadgeText, !reached && styles.levelBadgeTextLocked]}>{level}</Text></View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowMeta}>{threshold.toLocaleString()} active XP</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
      <BottomNav active="today" />
    </Screen>
  );
}

function getRank(xp: number) {
  let current = LEVELS[0]; let next: typeof LEVELS[number] | null = LEVELS[1];
  LEVELS.forEach((level, index) => { if (xp >= level[2]) { current = level; next = LEVELS[index + 1] || null; } });
  if (!next) return { level: current[0], title: current[1], next: null, xpToNext: 0, progress: 100 };
  const progress = Math.max(0, Math.min(100, Math.round(((xp - current[2]) / (next[2] - current[2])) * 100)));
  return { level: current[0], title: current[1], next: { title: next[1] }, xpToNext: next[2] - xp, progress };
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 },
  scroll: { flex: 1 },
  content: { paddingBottom: 18 },
  title: { color: colours.white, fontSize: 44, lineHeight: 48, fontWeight: '900', marginBottom: 14 },
  activeCard: { borderColor: colours.gold, paddingVertical: 18 },
  goldLabel: { color: colours.gold, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  levelTitle: { color: colours.white, fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 8 },
  activeXp: { color: colours.gold, fontSize: 31, lineHeight: 36, fontWeight: '900', marginTop: 9 },
  nextLevel: { color: colours.gold, fontSize: 12, lineHeight: 17, fontWeight: '900', marginTop: 5 },
  progressTrack: { height: 9, borderRadius: 5, backgroundColor: colours.card2, overflow: 'hidden', marginTop: 13 },
  progressFill: { height: '100%', backgroundColor: colours.gold },
  note: { color: colours.muted, fontSize: 11, lineHeight: 18, marginTop: 8 },
  xpSummary: { flexDirection: 'row', gap: 8, marginTop: 12 },
  xpBox: { flex: 1, minHeight: 76, borderRadius: 11, backgroundColor: colours.card2, alignItems: 'center', justifyContent: 'center' },
  xpValue: { color: colours.white, fontSize: 22, fontWeight: '900' },
  xpLabel: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.5, marginTop: 5 },
  sectionTitle: { color: colours.white, fontSize: 18, fontWeight: '900', marginTop: 22, marginBottom: 8 },
  levelRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8 },
  currentLevel: { borderColor: colours.gold },
  levelBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: colours.gold, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  levelBadgeLocked: { backgroundColor: colours.card2 },
  levelBadgeText: { color: colours.background, fontSize: 19, fontWeight: '900' },
  levelBadgeTextLocked: { color: colours.muted },
  rowTitle: { color: colours.white, fontSize: 18, fontWeight: '900' },
  rowMeta: { color: colours.muted, fontSize: 11, marginTop: 5 },
  flex: { flex: 1 },
});