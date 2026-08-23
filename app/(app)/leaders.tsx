import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AwardsPanel } from '@/components/AwardsPanel';
import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

type Mode = 'leaders' | 'awards' | 'stats';
type Group = 'Friends' | 'Teams' | 'Houses' | 'Schools';
type ChartEntry = { date: string; value: number };
const LEADERBOARD: Record<Group, [string, number, boolean?][]> = {
  Friends: [['MAX',28400],['JAMES',21240,true],['ALEX',19850],['SAM',17520]],
  Teams: [['MAX',28400],['JAMES',21240,true],['HARRY',20200],['TOM',18800]],
  Houses: [['School House',86],['Wallace',82],['Abbey',77],['The Green',71]],
  Schools: [['School A',88],['School B',84],['School C',79],['School D',74]],
};
const WEIGHT_ENTRIES: ChartEntry[] = [
  { date: '02 AUG', value: 70.5 },
  { date: '07 AUG', value: 70.2 },
  { date: '12 AUG', value: 70.1 },
  { date: '17 AUG', value: 69.9 },
  { date: '22 AUG', value: 69.8 },
];

export default function LeadersScreen() {
  const [mode, setMode] = useState<Mode>('leaders');
  const [group, setGroup] = useState<Group>('Friends');
  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>Leaders</Text>
        <View style={styles.segments}>
          <Segment label="LEADERS" active={mode === 'leaders'} onPress={() => setMode('leaders')} />
          <Segment label="AWARDS" active={mode === 'awards'} onPress={() => setMode('awards')} />
          <Segment label="STATS" active={mode === 'stats'} onPress={() => setMode('stats')} />
        </View>
        <View style={styles.body}>
          {mode === 'leaders' ? <Leaderboard group={group} setGroup={setGroup} /> : null}
          {mode === 'awards' ? <AwardsPanel /> : null}
          {mode === 'stats' ? <Stats /> : null}
        </View>
      </ScrollView>
      <BottomNav active="leaders" />
    </Screen>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

function Leaderboard({ group, setGroup }: { group: Group; setGroup: (value: Group) => void }) {
  const percentageGroup = group === 'Houses' || group === 'Schools';
  return <>
    <View style={styles.groups}>{(['Friends','Teams','Houses','Schools'] as Group[]).map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[styles.groupPill, group === item && styles.groupPillActive]}><Text style={[styles.groupText, group === item && styles.groupTextActive]}>{item}</Text></Pressable>)}</View>
    {group === 'Friends' ? <PrimaryActionButton label="+ ADD FRIEND" onPress={() => router.push('/(app)/friends')} style={styles.addFriendButton} /> : null}
    <View style={styles.leaderList}>{LEADERBOARD[group].map(([name, value, you], index) => <Card key={name} style={[styles.leaderCard, you && styles.youCard]}>
      <Text style={styles.rank}>{index + 1}</Text>
      <View style={styles.leaderCopy}><Text style={styles.leaderName}>{name}{you ? ' • YOU' : ''}</Text></View>
      <Text style={styles.leaderXp}>{value.toLocaleString()}{percentageGroup ? '%' : ' XP'}</Text>
    </Card>)}</View>
  </>;
}

function Stats() {
  return <>
    <Text style={styles.sectionLabel}>CORE</Text>
    <View style={styles.statsRow}>
      <Card style={styles.statCard}><Text style={styles.statLabel}>CURRENT WEIGHT</Text><Text style={styles.statValue}>69.8 <Text style={styles.statUnit}>kg</Text></Text><Text style={styles.statGoal}>GOAL 72 kg</Text><Pressable style={styles.smallAdd}><Text style={styles.smallAddText}>+ ADD</Text></Pressable></Card>
      <Card style={styles.statCard}><Text style={styles.statLabel}>BODY FAT</Text><Text style={styles.statValue}>15.1<Text style={styles.statUnit}>%</Text></Text><Text style={styles.statGoal}>GOAL 14%</Text><Pressable style={styles.smallAdd}><Text style={styles.smallAddText}>+ ADD</Text></Pressable></Card>
    </View>
    <Card style={styles.chartCard}>
      <View style={styles.chartTop}><View><Text style={styles.statLabel}>WEIGHT</Text><Text style={styles.chartValue}>69.8 kg</Text></View><Pressable style={styles.chartAddButton}><Text style={styles.chartAdd}>+ ADD</Text></Pressable></View>
      <ReusableLineChart entries={WEIGHT_ENTRIES} unit="kg" />
    </Card>
  </>;
}

function ReusableLineChart({ entries, unit }: { entries: ChartEntry[]; unit: string }) {
  const [width, setWidth] = useState(300);
  const [selected, setSelected] = useState(entries.length - 1);
  const height = 160;
  const paddingLeft = 34;
  const paddingRight = 12;
  const paddingTop = 18;
  const paddingBottom = 26;
  const values = entries.map((entry) => entry.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  const spread = Math.max(0.8, max - min);
  min = Math.floor((min - spread * 0.25) * 10) / 10;
  max = Math.ceil((max + spread * 0.25) * 10) / 10;
  const usableWidth = Math.max(40, width - paddingLeft - paddingRight);
  const usableHeight = height - paddingTop - paddingBottom;
  const points = entries.map((entry, index) => ({
    entry,
    x: paddingLeft + (entries.length === 1 ? usableWidth / 2 : (index / (entries.length - 1)) * usableWidth),
    y: paddingTop + usableHeight - ((entry.value - min) / (max - min)) * usableHeight,
  }));
  const gridValues = [max, (max + min) / 2, min];
  const selectedPoint = points[selected];

  return <View style={styles.chartWrap} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
    <View style={[styles.plot, { height }]}>
      {gridValues.map((value, index) => {
        const top = paddingTop + (index / 2) * usableHeight;
        return <View key={index} style={[styles.gridRow, { top }]}><Text style={styles.axisValue}>{value.toFixed(1)}</Text><View style={styles.gridLine} /></View>;
      })}
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        return <View key={`line-${index}`} style={[styles.chartLine, { width: length, left: (point.x + next.x) / 2 - length / 2, top: (point.y + next.y) / 2 - 1, transform: [{ rotate: `${angle}deg` }] }]} />;
      })}
      {points.map((point, index) => <Pressable key={point.entry.date} onPress={() => setSelected(index)} style={[styles.pointHit, { left: point.x - 12, top: point.y - 12 }]}><View style={[styles.chartPoint, selected === index && styles.chartPointSelected]} /></Pressable>)}
      {selectedPoint ? <View pointerEvents="none" style={[styles.valueBubble, { left: Math.max(paddingLeft, Math.min(width - 76, selectedPoint.x - 30)), top: Math.max(0, selectedPoint.y - 35) }]}><Text style={styles.valueBubbleText}>{selectedPoint.entry.value.toFixed(1)} {unit}</Text></View> : null}
      {points.map((point, index) => index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2) ? <Text key={`label-${point.entry.date}`} style={[styles.xLabel, { left: point.x - 22, top: paddingTop + usableHeight + 7 }]}>{point.entry.date}</Text> : null)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, scroll: { flex: 1 }, content: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 29, fontWeight: '900', marginTop: 18, marginBottom: 12 },
  segments: { backgroundColor: colours.card, borderWidth: 1, borderColor: colours.border, borderRadius: 11, flexDirection: 'row', padding: 3 },
  segment: { flex: 1, minHeight: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, segmentActive: { backgroundColor: colours.gold },
  segmentText: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 }, segmentTextActive: { color: colours.background }, body: { paddingTop: 12 },
  groups: { flexDirection: 'row', gap: 6, marginBottom: 11 }, groupPill: { flex: 1, minHeight: 30, borderRadius: 15, backgroundColor: colours.card2, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }, groupPillActive: { borderColor: colours.gold }, groupText: { color: colours.muted, fontSize: 8, fontWeight: '900' }, groupTextActive: { color: colours.gold },
  addFriendButton: { marginBottom: 11 },
  leaderList: { gap: 8 }, leaderCard: { minHeight: 61, paddingVertical: 11, flexDirection: 'row', alignItems: 'center' }, youCard: { borderColor: colours.gold }, rank: { color: colours.gold, fontSize: 20, fontWeight: '900', width: 31 }, leaderCopy: { flex: 1 }, leaderName: { color: colours.white, fontSize: 13, fontWeight: '900' }, leaderXp: { color: colours.white, fontSize: 11, fontWeight: '900' },
  sectionLabel: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8 }, statsRow: { flexDirection: 'row', gap: 9 }, statCard: { flex: 1, minHeight: 139, padding: 12 }, statLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, statValue: { color: colours.white, fontSize: 24, fontWeight: '900', marginTop: 6 }, statUnit: { fontSize: 12 }, statGoal: { color: colours.muted, fontSize: 8, fontWeight: '800', marginTop: 3 }, smallAdd: { borderWidth: 1, borderColor: colours.gold, borderRadius: 8, minHeight: 36, alignItems: 'center', justifyContent: 'center', marginTop: 11 }, smallAddText: { color: colours.gold, fontSize: 9, fontWeight: '900' },
  chartCard: { marginTop: 9, minHeight: 230 }, chartTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, chartValue: { color: colours.white, fontSize: 14, fontWeight: '900', marginTop: 3 }, chartAddButton: { borderWidth: 1, borderColor: colours.gold, borderRadius: 8, minHeight: 34, minWidth: 64, alignItems: 'center', justifyContent: 'center' }, chartAdd: { color: colours.gold, fontSize: 9, fontWeight: '900' },
  chartWrap: { marginTop: 8 }, plot: { position: 'relative', width: '100%' }, gridRow: { position: 'absolute', left: 0, right: 0, height: 1, flexDirection: 'row', alignItems: 'center' }, axisValue: { width: 29, color: colours.muted, fontSize: 7, fontWeight: '800', textAlign: 'right', marginRight: 5 }, gridLine: { flex: 1, height: 1, backgroundColor: colours.border, opacity: 0.55 }, chartLine: { position: 'absolute', height: 2, backgroundColor: colours.gold, borderRadius: 1 }, pointHit: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }, chartPoint: { width: 8, height: 8, borderRadius: 4, backgroundColor: colours.gold, borderWidth: 1, borderColor: colours.background }, chartPointSelected: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colours.white }, xLabel: { position: 'absolute', width: 44, color: colours.muted, fontSize: 6, fontWeight: '800', textAlign: 'center' }, valueBubble: { position: 'absolute', minWidth: 60, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.gold, alignItems: 'center' }, valueBubbleText: { color: colours.white, fontSize: 8, fontWeight: '900' },
});
