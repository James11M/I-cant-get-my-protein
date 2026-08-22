import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

type Mode = 'leaderboard' | 'awards' | 'stats';
const LEADERS = [['MAX', '28,400 XP'], ['YOU', '21,240 XP'], ['ALEX', '19,850 XP'], ['SAM', '17,520 XP']];
const AWARDS = [
  ['🔥','Threepeat','3-day streak'], ['🏊','Old-School Mile','1,500 m swim'], ['🏃','Five Alive','5 km run'],
  ['🏉','Hard Yards','1,000 team-sport min'], ['🏋️','Rep Rookie','5 strength sessions'], ['↻','Sunday Saver','Complete a comeback'],
];

export default function LeadersScreen() {
  const [mode, setMode] = useState<Mode>('leaderboard');
  const [group, setGroup] = useState('Friends');
  return (
    <Screen scroll={false} contentStyle={styles.screen}>
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
      <BottomNav active="leaders" />
    </Screen>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

function Leaderboard({ group, setGroup }: { group: string; setGroup: (value: string) => void }) {
  return <>
    <View style={styles.groups}>{['Friends','Teams','Groups','Organisations'].map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[styles.groupPill, group === item && styles.groupPillActive]}><Text style={[styles.groupText, group === item && styles.groupTextActive]}>{item}</Text></Pressable>)}</View>
    <View style={styles.leaderList}>{LEADERS.map(([name, value], index) => <Card key={name} style={[styles.leaderCard, name === 'YOU' && styles.youCard]}><Text style={styles.rank}>{index + 1}</Text><View style={styles.leaderCopy}><Text style={styles.leaderName}>{name}{name === 'YOU' ? ' • YOU' : ''}</Text></View><Text style={styles.leaderXp}>{value}</Text></Card>)}</View>
  </>;
}

function Awards() {
  return <View style={styles.awardsGrid}>{AWARDS.map(([emoji, title, text]) => <Card key={title} style={styles.awardCard}><View style={styles.awardIcon}><Text style={styles.awardEmoji}>{emoji}</Text></View><Text style={styles.awardTitle}>{title}</Text><Text style={styles.awardText}>{text}</Text></Card>)}</View>;
}

function Stats() {
  return <>
    <Text style={styles.sectionLabel}>CORE</Text>
    <View style={styles.statsRow}>
      <Card style={styles.statCard}><Text style={styles.statLabel}>CURRENT WEIGHT</Text><Text style={styles.statValue}>69.8 <Text style={styles.statUnit}>kg</Text></Text><Text style={styles.statGoal}>GOAL 72 kg</Text><Pressable style={styles.smallAdd}><Text style={styles.smallAddText}>+ ADD</Text></Pressable></Card>
      <Card style={styles.statCard}><Text style={styles.statLabel}>BODY FAT</Text><Text style={styles.statValue}>15.1<Text style={styles.statUnit}>%</Text></Text><Text style={styles.statGoal}>GOAL 14%</Text><Pressable style={styles.smallAdd}><Text style={styles.smallAddText}>+ ADD</Text></Pressable></Card>
    </View>
    <Card style={styles.chartCard}><View style={styles.chartTop}><Text style={styles.statLabel}>WEIGHT</Text><Text style={styles.chartValue}>69.8 kg</Text></View><View style={styles.fakeChart}><View style={[styles.point,{left:'8%',bottom:30}]} /><View style={[styles.line,{left:'10%',width:'32%',bottom:37,transform:[{rotate:'-5deg'}]}]} /><View style={[styles.point,{left:'42%',bottom:43}]} /><View style={[styles.line,{left:'44%',width:'34%',bottom:51,transform:[{rotate:'-4deg'}]}]} /><View style={[styles.point,{left:'79%',bottom:58}]} /></View></Card>
  </>;
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, title: { color: colours.white, fontSize: 31, fontWeight: '900', marginTop: 19, marginBottom: 11 },
  segments: { backgroundColor: colours.card, borderWidth: 1, borderColor: colours.border, borderRadius: 12, flexDirection: 'row', padding: 3 }, segment: { flex: 1, minHeight: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, segmentActive: { backgroundColor: colours.gold }, segmentText: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 }, segmentTextActive: { color: colours.background }, body: { flex: 1, paddingTop: 10 },
  groups: { flexDirection: 'row', gap: 5, marginBottom: 9 }, groupPill: { flex: 1, minHeight: 28, borderRadius: 14, backgroundColor: colours.card2, alignItems: 'center', justifyContent: 'center' }, groupPillActive: { borderWidth: 1, borderColor: colours.gold }, groupText: { color: colours.muted, fontSize: 7, fontWeight: '900' }, groupTextActive: { color: colours.gold },
  leaderList: { gap: 7 }, leaderCard: { minHeight: 54, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' }, youCard: { borderColor: colours.gold }, rank: { color: colours.gold, fontSize: 18, fontWeight: '900', width: 28 }, leaderCopy: { flex: 1 }, leaderName: { color: colours.white, fontSize: 12, fontWeight: '900' }, leaderXp: { color: colours.white, fontSize: 10, fontWeight: '900' },
  awardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, awardCard: { width: '48.7%', minHeight: 132, alignItems: 'center', justifyContent: 'center', padding: 10 }, awardIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colours.gold, alignItems: 'center', justifyContent: 'center' }, awardEmoji: { fontSize: 24 }, awardTitle: { color: colours.white, fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 8 }, awardText: { color: colours.muted, fontSize: 8, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  sectionLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginBottom: 7 }, statsRow: { flexDirection: 'row', gap: 8 }, statCard: { flex: 1, minHeight: 126, padding: 11 }, statLabel: { color: colours.gold, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 }, statValue: { color: colours.white, fontSize: 23, fontWeight: '900', marginTop: 5 }, statUnit: { fontSize: 11 }, statGoal: { color: colours.muted, fontSize: 8, fontWeight: '800', marginTop: 2 }, smallAdd: { borderWidth: 1, borderColor: colours.gold, borderRadius: 8, minHeight: 27, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, smallAddText: { color: colours.gold, fontSize: 7, fontWeight: '900' },
  chartCard: { marginTop: 8, minHeight: 155 }, chartTop: { flexDirection: 'row', justifyContent: 'space-between' }, chartValue: { color: colours.white, fontSize: 10, fontWeight: '900' }, fakeChart: { height: 95, marginTop: 8, borderBottomWidth: 1, borderBottomColor: colours.border, position: 'relative' }, point: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: colours.gold }, line: { position: 'absolute', height: 2, backgroundColor: colours.gold },
});
