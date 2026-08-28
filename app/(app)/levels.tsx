import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { calculateXpSummary, RANKS } from '@/features/xp/xp';
import { colours } from '@/theme/colours';

export default function LevelsScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useFocusEffect(useCallback(() => {
    let live = true;
    getActivityLogs().then((items) => { if (live) setLogs(items); }).catch(() => { if (live) setLogs([]); });
    return () => { live = false; };
  }, []));

  const { activeXp, lifetimeXp, rank } = calculateXpSummary(logs);

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Brand />
        <BackButton />
        <Text style={styles.title}>Progress</Text>

        <Card style={styles.activeCard}>
          <Text style={styles.goldLabel}>ACTIVE LEVEL</Text>
          <Text style={styles.levelTitle}>{rank.kind === 'master-star' ? rank.title : `Level ${rank.level} • ${rank.title}`}</Text>
          <Text style={styles.activeXp}>{activeXp.toLocaleString()} XP</Text>
          {rank.next ? (
            <Text style={styles.nextLevel}>{rank.xpToNext.toLocaleString()} XP → {rank.next.title}</Text>
          ) : (
            <Text style={styles.nextLevel}>MASTER STAR 5</Text>
          )}
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${rank.progress}%` }]} /></View>
          <Text style={styles.note}>Active XP reflects the previous 365 days.</Text>
          <Text style={styles.note}>XP older than 365 days expires from your active level automatically.</Text>
          <Text style={styles.note}>Lifetime XP is retained separately and never expires.</Text>
        </Card>

        <Card style={styles.xpSummary}>
          <View style={styles.xpBox}><Text style={styles.xpValue}>{activeXp.toLocaleString()}</Text><Text style={styles.xpLabel}>ACTIVE XP</Text></View>
          <View style={styles.xpBox}><Text style={styles.xpValue}>{lifetimeXp.toLocaleString()}</Text><Text style={styles.xpLabel}>LIFETIME XP</Text></View>
        </Card>

        <Text style={styles.sectionTitle}>LEVELS</Text>
        {RANKS.map((item) => {
          const reached = activeXp >= item.totalXp;
          const current = rank.totalXp === item.totalXp;
          return (
            <Card key={`${item.kind}-${item.totalXp}`} style={[styles.levelRow, current && styles.currentLevel]}>
              <View style={[styles.levelBadge, item.kind === 'master-star' && styles.starBadge, !reached && styles.levelBadgeLocked]}>
                <Text style={[styles.levelBadgeText, item.kind === 'master-star' && styles.starBadgeText, !reached && styles.levelBadgeTextLocked]}>{item.badge}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>{item.totalXp.toLocaleString()} active XP</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
      <BottomNav active="today" />
    </Screen>
  );
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
  currentLevel: { borderColor: colours.gold, borderWidth: 2 },
  levelBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: colours.gold, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  starBadge: { borderWidth: 2, borderColor: colours.gold, backgroundColor: colours.card2 },
  levelBadgeLocked: { backgroundColor: colours.card2, borderColor: colours.border },
  levelBadgeText: { color: colours.background, fontSize: 19, fontWeight: '900' },
  starBadgeText: { color: colours.gold, fontSize: 15 },
  levelBadgeTextLocked: { color: colours.muted },
  rowTitle: { color: colours.white, fontSize: 18, fontWeight: '900' },
  rowMeta: { color: colours.muted, fontSize: 11, marginTop: 5 },
  flex: { flex: 1 },
});