import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

type Mode = 'leaderboard' | 'awards' | 'stats';
type Group = 'Friends' | 'Teams' | 'Houses' | 'Schools';
const LEADERBOARD: Record<Group, [string, number, boolean?][]> = {
  Friends: [['MAX',28400],['JAMES',21240,true],['ALEX',19850],['SAM',17520]],
  Teams: [['MAX',28400],['JAMES',21240,true],['HARRY',20200],['TOM',18800]],
  Houses: [['School House',86],['Wallace',82],['Abbey',77],['The Green',71]],
  Schools: [['School A',88],['School B',84],['School C',79],['School D',74]],
};
const AWARDS = [
  ['🔥','Threepeat','3-day streak'], ['🏊','Old-School Mile','1,500 m swim'], ['🏃','Five Alive','5 km run'],
  ['🏉','Hard Yards','1,000 rugby min'], ['🏋️','Rep Rookie','5 strength sessions'], ['↻','Sunday Saver','Complete a comeback'],
] as const;

export default function LeadersScreen() {
  const [mode, setMode] = useState<Mode>('leaderboard');
  const [group, setGroup] = useState<Group>('Friends');
  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>Leaders</Text>
        <View style={styles.segments}>
          <Segment label="LEADERBOARD" active={mode === 'leaderboard'} onPress={() => setMode('leaderboard')} />
          <Segment label="AWARDS" active={mode === 'awards'} onPress={() => setMode('awards')} />
          <Segment label="STATS" active={mode === 'stats'} onPress={() => setMode('stats')} />
        </View>
        <View style={styles.body}>
          {mode === 'leaderboard' ? <Leaderboard group={group} setGroup={setGroup} /> : null}
          {mode === 'awards' ? <Awards /> : null}
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
    <View style={styles.leaderList}>{LEADERBOARD[group].map(([name, value, you], index) => <Card key={name} style={[styles.leaderCard, you && styles.youCard]}>
      <Text style={styles.rank}>{index + 1}</Text>
      <View style={styles.leaderCopy}><Text style={styles.leaderName}>{name}{you ? ' • YOU' : ''}</Text></View>
      <Text style={styles.leaderXp}>{value.toLocaleString()}{percentageGroup ? '%' : ' XP'}</Text>
    </Card>)}</View>
  </>;
}

function Awards() {
  return <View style={styles.awardsGrid}>{AWARDS.map(([emoji, title, text]) => <Card key={title} style={styles.awardCard}>
    <View style={styles.awardIcon}><Text style={styles.awardEmoji}>{emoji}</Text></View>
    <Text style={styles.awardTitle}>{title}</Text>
    <Text style={styles.awardText}>{text}</Text>
  </Card>)}</View>;
}

function Stats() {
  return <>
    <Text style={styles.sectionLabel}>CORE</Text>
    <View style={styles.statsRow}>
      <Card style={styles.statCard}><Text style={styles.statLabel}>CURRENT WEIGHT</Text><Text style={styles.statValue}>69.8 <Text style={styles.statUnit}>kg</Text></Text><Text style={styles.statGoal}>GOAL 72 kg</Text><Pressable style={styles.smallAdd}><Text style={styles.smallAddText}>+ ADD</Text></Pressable></Card>
      <Card style={styles.statCard}><Text style={styles.statLabel}>BODY FAT</Text><Text style={styles.statValue}>15.1<Text style={styles.statUnit}>%</Text></Text><Text style={styles.statGoal}>GOAL 14%</Text><Pressable style={styles.smallAdd}><Text style={styles.smallAddText}>+ ADD</Text></Pressable></Card>
    </View>
    <Card style={styles.chartCard}>
      <View style={styles.chartTop}><Text style={styles.statLabel}>WEIGHT</Text><View style={styles.chartRight}><Text style={styles.chartValue}>69.8 kg</Text><Text style={styles.chartAdd}>+ ADD</Text></View></View>
      <View style={styles.fakeChart}><View style={[styles.point,{left:'7%',bottom:28}]} /><View style={[styles.line,{left:'9%',width:'33%',bottom:35,transform:[{rotate:'-5deg'}]}]} /><View style={[styles.point,{left:'42%',bottom:41}]} /><View style={[styles.line,{left:'44%',width:'35%',bottom:50,transform:[{rotate:'-4deg'}]}]} /><View style={[styles.point,{left:'80%',bottom:58}]} /></View>
    </Card>
  </>;
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, scroll: { flex: 1 }, content: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 29, fontWeight: '900', marginTop: 18, marginBottom: 12 },
  segments: { backgroundColor: colours.card, borderWidth: 1, borderColor: colours.border, borderRadius: 11, flexDirection: 'row', padding: 3 },
  segment: { flex: 1, minHeight: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, segmentActive: { backgroundColor: colours.gold },
  segmentText: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 }, segmentTextActive: { color: colours.background }, body: { paddingTop: 12 },
  groups: { flexDirection: 'row', gap: 6, marginBottom: 11 }, groupPill: { flex: 1, minHeight: 30, borderRadius: 15, backgroundColor: colours.card2, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }, groupPillActive: { borderColor: colours.gold }, groupText: { color: colours.muted, fontSize: 8, fontWeight: '900' }, groupTextActive: { color: colours.gold },
  leaderList: { gap: 8 }, leaderCard: { minHeight: 61, paddingVertical: 11, flexDirection: 'row', alignItems: 'center' }, youCard: { borderColor: colours.gold }, rank: { color: colours.gold, fontSize: 20, fontWeight: '900', width: 31 }, leaderCopy: { flex: 1 }, leaderName: { color: colours.white, fontSize: 13, fontWeight: '900' }, leaderXp: { color: colours.white, fontSize: 11, fontWeight: '900' },
  awardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, awardCard: { width: '48.6%', minHeight: 139, alignItems: 'center', justifyContent: 'center', padding: 10 }, awardIcon: { width: 53, height: 53, borderRadius: 27, borderWidth: 2, borderColor: colours.gold, alignItems: 'center', justifyContent: 'center' }, awardEmoji: { fontSize: 25 }, awardTitle: { color: colours.white, fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 9 }, awardText: { color: colours.muted, fontSize: 8, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  sectionLabel: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8 }, statsRow: { flexDirection: 'row', gap: 9 }, statCard: { flex: 1, minHeight: 133, padding: 12 }, statLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, statValue: { color: colours.white, fontSize: 24, fontWeight: '900', marginTop: 6 }, statUnit: { fontSize: 12 }, statGoal: { color: colours.muted, fontSize: 8, fontWeight: '800', marginTop: 3 }, smallAdd: { borderWidth: 1, borderColor: colours.gold, borderRadius: 8, minHeight: 29, alignItems: 'center', justifyContent: 'center', marginTop: 11 }, smallAddText: { color: colours.gold, fontSize: 8, fontWeight: '900' },
  chartCard: { marginTop: 9, minHeight: 165 }, chartTop: { flexDirection: 'row', justifyContent: 'space-between' }, chartRight: { alignItems: 'flex-end' }, chartValue: { color: colours.white, fontSize: 10, fontWeight: '900' }, chartAdd: { color: colours.gold, fontSize: 7, fontWeight: '900', marginTop: 2 }, fakeChart: { height: 100, marginTop: 8, borderBottomWidth: 1, borderBottomColor: colours.border, position: 'relative' }, point: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: colours.gold }, line: { position: 'absolute', height: 2, backgroundColor: colours.gold },
});