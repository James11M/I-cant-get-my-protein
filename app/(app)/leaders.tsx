import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { AwardsPanel } from '@/components/AwardsPanel';
import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { Screen } from '@/components/Screen';
import { getMeasurementSummaries, MeasurementSummary } from '@/features/measurements/measurements.service';
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
      <Text style={styles.rank}>{index + 1}</Text><View style={styles.leaderCopy}><Text style={styles.leaderName}>{name}{you ? ' • YOU' : ''}</Text></View><Text style={styles.leaderXp}>{value.toLocaleString()}{percentageGroup ? '%' : ' XP'}</Text>
    </Card>)}</View>
  </>;
}

function Stats() {
  const [summaries, setSummaries] = useState<MeasurementSummary[]>([]);
  const [selectedType, setSelectedType] = useState<string>('Weight');
  const [message, setMessage] = useState('');

  useFocusEffect(useCallback(() => {
    let live = true;
    getMeasurementSummaries().then((rows) => {
      if (!live) return;
      const core = rows.filter((row) => row.isCore);
      setSummaries(core);
      if (!core.some((row) => row.type === selectedType) && core[0]) setSelectedType(core[0].type);
    }).catch(() => { if (live) setMessage('Could not load measurements.'); });
    return () => { live = false; };
  }, [selectedType]));

  const selected = useMemo(() => summaries.find((row) => row.type === selectedType) || summaries[0] || null, [summaries, selectedType]);
  const entries: ChartEntry[] = selected ? selected.entries.map((entry) => ({ date: shortDate(entry.measured_at), value: entry.value })) : [];
  const trend = selected ? getTrend(selected) : null;

  return <>
    <Text style={styles.sectionLabel}>CORE</Text>
    <View style={styles.statRows}>
      {summaries.map((item) => <Pressable key={item.type} onPress={() => setSelectedType(item.type)}>
        <Card style={[styles.statRowCard, selected?.type === item.type && styles.statRowSelected]}>
          <View style={styles.statCopy}>
            <Text style={styles.statLabel}>{item.type.toUpperCase()}</Text>
            <View style={styles.statValueLine}>
              <Text style={styles.statValue}>{item.current != null ? formatValue(item.current) : '—'} <Text style={styles.statUnit}>{item.current != null ? item.unit : ''}</Text></Text>
              <Text style={styles.statGoal}>{item.target != null ? `GOAL ${formatValue(item.target)} ${item.unit}` : 'NO GOAL SET'}</Text>
            </View>
          </View>
          <Pressable style={styles.smallAdd} onPress={(event) => { event.stopPropagation(); router.push({ pathname: '/(app)/measurements', params: { metric: item.type } }); }}><Text style={styles.smallAddText}>+ ADD</Text></Pressable>
        </Card>
      </Pressable>)}
    </View>
    {message ? <Text style={styles.message}>{message}</Text> : null}

    {selected ? <Card style={styles.chartCard}>
      <View style={styles.chartTop}>
        <View><Text style={styles.statLabel}>{selected.type.toUpperCase()}</Text><Text style={styles.chartMeta}>{selected.target != null ? `TARGET ${formatValue(selected.target)} ${selected.unit}` : 'NO TARGET SET'}</Text></View>
        <View style={styles.chartCurrent}><Text style={styles.chartCurrentValue}>{selected.current != null ? `${formatValue(selected.current)} ${selected.unit}` : '—'}</Text>{selected.target != null && selected.current != null ? <Text style={styles.gapText}>{formatGap(selected.current, selected.target)}</Text> : null}</View>
      </View>
      {trend ? <Text style={[styles.trendText, trend.kind === 'closer' ? styles.trendGood : trend.kind === 'away' ? styles.trendBad : styles.trendNeutral]}>{trend.label}</Text> : null}
      {entries.length ? <ReusableLineChart entries={entries} unit={selected.unit} target={selected.target} /> : <View style={styles.emptyChart}><Text style={styles.emptyChartText}>Add measurements to build your trend chart.</Text></View>}
    </Card> : null}
  </>;
}

function getTrend(item: MeasurementSummary) {
  if (item.target == null || item.entries.length < 2) return { kind: 'neutral' as const, label: 'INSUFFICIENT DATA FOR TARGET TREND' };
  const previous = item.entries[item.entries.length - 2].value;
  const current = item.entries[item.entries.length - 1].value;
  const previousGap = Math.abs(previous - item.target);
  const currentGap = Math.abs(current - item.target);
  if (Math.abs(previousGap - currentGap) < 0.0001) return { kind: 'neutral' as const, label: 'UNCHANGED DISTANCE FROM TARGET' };
  return currentGap < previousGap ? { kind: 'closer' as const, label: '↓ GETTING CLOSER TO TARGET' } : { kind: 'away' as const, label: '↑ MOVING FURTHER FROM TARGET' };
}

function ReusableLineChart({ entries, unit, target }: { entries: ChartEntry[]; unit: string; target: number | null }) {
  const [width, setWidth] = useState(300);
  const [selected, setSelected] = useState(entries.length - 1);
  const height = 160, paddingLeft = 34, paddingRight = 12, paddingTop = 18, paddingBottom = 26;
  const allValues = [...entries.map((entry) => entry.value), ...(target != null ? [target] : [])];
  let min = Math.min(...allValues), max = Math.max(...allValues);
  const spread = Math.max(0.8, max - min);
  min = Math.floor((min - spread * 0.25) * 10) / 10; max = Math.ceil((max + spread * 0.25) * 10) / 10;
  const usableWidth = Math.max(40, width - paddingLeft - paddingRight), usableHeight = height - paddingTop - paddingBottom;
  const yFor = (value: number) => paddingTop + usableHeight - ((value - min) / Math.max(0.0001, max - min)) * usableHeight;
  const points = entries.map((entry, index) => ({ entry, x: paddingLeft + (entries.length === 1 ? usableWidth / 2 : (index / (entries.length - 1)) * usableWidth), y: yFor(entry.value) }));
  const gridValues = [max, (max + min) / 2, min], selectedPoint = points[Math.min(selected, points.length - 1)];
  const targetTop = target != null ? yFor(target) : null;

  return <View style={styles.chartWrap} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}><View style={[styles.plot,{height}]}>
    {gridValues.map((value,index)=><View key={index} style={[styles.gridRow,{top:paddingTop+(index/2)*usableHeight}]}><Text style={styles.axisValue}>{value.toFixed(1)}</Text><View style={styles.gridLine}/></View>)}
    {targetTop != null ? <View pointerEvents="none" style={[styles.targetLine,{top:targetTop}]}><View style={styles.targetDashRow}>{Array.from({length:22},(_,i)=><View key={i} style={styles.targetDash}/>)}</View><Text style={styles.targetLineLabel}>TARGET</Text></View> : null}
    {points.slice(0,-1).map((point,index)=>{const next=points[index+1],dx=next.x-point.x,dy=next.y-point.y,length=Math.sqrt(dx*dx+dy*dy),angle=Math.atan2(dy,dx)*180/Math.PI;return <View key={`line-${index}`} style={[styles.chartLine,{width:length,left:(point.x+next.x)/2-length/2,top:(point.y+next.y)/2-1,transform:[{rotate:`${angle}deg`}]}]}/>})}
    {points.map((point,index)=><Pressable key={`${point.entry.date}-${index}`} onPress={()=>setSelected(index)} style={[styles.pointHit,{left:point.x-12,top:point.y-12}]}><View style={[styles.chartPoint,selected===index&&styles.chartPointSelected]}/></Pressable>)}
    {selectedPoint ? <View pointerEvents="none" style={[styles.valueBubble,{left:Math.max(paddingLeft,Math.min(width-76,selectedPoint.x-30)),top:Math.max(0,selectedPoint.y-35)}]}><Text style={styles.valueBubbleText}>{formatValue(selectedPoint.entry.value)} {unit}</Text></View> : null}
    {points.map((point,index)=>index===0||index===points.length-1||index===Math.floor(points.length/2)?<Text key={`label-${index}`} style={[styles.xLabel,{left:point.x-22,top:paddingTop+usableHeight+7}]}>{point.entry.date}</Text>:null)}
  </View></View>;
}

function formatValue(value:number){return Number.isInteger(value)?String(value):value.toFixed(1)}
function shortDate(value:string){const d=new Date(value);return `${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('en-GB',{month:'short'}).toUpperCase()}`}
function formatGap(current:number,target:number){if(target===0)return `GAP ${formatValue(Math.abs(current-target))}`;const pct=Math.abs((current-target)/target)*100;return `${pct.toFixed(1)}% FROM TARGET`}

const styles=StyleSheet.create({
  screen:{paddingBottom:6},scroll:{flex:1},content:{paddingBottom:10},title:{color:colours.white,fontSize:29,fontWeight:'900',marginTop:18,marginBottom:12},segments:{backgroundColor:colours.card,borderWidth:1,borderColor:colours.border,borderRadius:11,flexDirection:'row',padding:3},segment:{flex:1,minHeight:34,borderRadius:8,alignItems:'center',justifyContent:'center'},segmentActive:{backgroundColor:colours.gold},segmentText:{color:colours.muted,fontSize:7,fontWeight:'900',letterSpacing:.7},segmentTextActive:{color:colours.background},body:{paddingTop:12},
  groups:{flexDirection:'row',gap:6,marginBottom:11},groupPill:{flex:1,minHeight:30,borderRadius:15,backgroundColor:colours.card2,borderWidth:1,borderColor:'transparent',alignItems:'center',justifyContent:'center'},groupPillActive:{borderColor:colours.gold},groupText:{color:colours.muted,fontSize:8,fontWeight:'900'},groupTextActive:{color:colours.gold},addFriendButton:{marginBottom:11},leaderList:{gap:8},leaderCard:{minHeight:61,paddingVertical:11,flexDirection:'row',alignItems:'center'},youCard:{borderColor:colours.gold},rank:{color:colours.gold,fontSize:20,fontWeight:'900',width:31},leaderCopy:{flex:1},leaderName:{color:colours.white,fontSize:13,fontWeight:'900'},leaderXp:{color:colours.white,fontSize:11,fontWeight:'900'},
  sectionLabel:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1.1,marginBottom:8},statRows:{gap:8},statRowCard:{minHeight:78,flexDirection:'row',alignItems:'center',paddingVertical:11},statRowSelected:{borderColor:colours.gold},statCopy:{flex:1},statLabel:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:.8},statValueLine:{flexDirection:'row',alignItems:'baseline',gap:10,marginTop:5},statValue:{color:colours.white,fontSize:22,fontWeight:'900'},statUnit:{fontSize:11},statGoal:{color:colours.muted,fontSize:8,fontWeight:'800'},smallAdd:{borderWidth:1,borderColor:colours.gold,borderRadius:8,minHeight:36,minWidth:66,alignItems:'center',justifyContent:'center',marginLeft:12},smallAddText:{color:colours.gold,fontSize:9,fontWeight:'900'},message:{color:colours.gold,fontSize:9,marginTop:8},
  chartCard:{marginTop:10,minHeight:245},chartTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},chartMeta:{color:colours.muted,fontSize:8,fontWeight:'800',marginTop:3},chartCurrent:{alignItems:'flex-end'},chartCurrentValue:{color:colours.white,fontSize:18,fontWeight:'900'},gapText:{color:colours.gold,fontSize:8,fontWeight:'900',marginTop:3},trendText:{fontSize:8,fontWeight:'900',letterSpacing:.4,marginTop:9},trendGood:{color:colours.green},trendBad:{color:colours.red},trendNeutral:{color:colours.muted},emptyChart:{height:150,alignItems:'center',justifyContent:'center'},emptyChartText:{color:colours.muted,fontSize:10},
  chartWrap:{marginTop:8},plot:{position:'relative',width:'100%'},gridRow:{position:'absolute',left:0,right:0,height:1,flexDirection:'row',alignItems:'center'},axisValue:{width:29,color:colours.muted,fontSize:7,fontWeight:'800',textAlign:'right',marginRight:5},gridLine:{flex:1,height:1,backgroundColor:colours.border,opacity:.55},chartLine:{position:'absolute',height:2,backgroundColor:colours.gold,borderRadius:1},pointHit:{position:'absolute',width:24,height:24,alignItems:'center',justifyContent:'center'},chartPoint:{width:8,height:8,borderRadius:4,backgroundColor:colours.gold,borderWidth:1,borderColor:colours.background},chartPointSelected:{width:12,height:12,borderRadius:6,borderWidth:2,borderColor:colours.white},xLabel:{position:'absolute',width:44,color:colours.muted,fontSize:6,fontWeight:'800',textAlign:'center'},valueBubble:{position:'absolute',minWidth:60,paddingHorizontal:7,paddingVertical:4,borderRadius:7,backgroundColor:colours.card2,borderWidth:1,borderColor:colours.gold,alignItems:'center'},valueBubbleText:{color:colours.white,fontSize:8,fontWeight:'900'},targetLine:{position:'absolute',left:34,right:12,zIndex:2},targetDashRow:{flexDirection:'row',justifyContent:'space-between'},targetDash:{width:7,height:1,backgroundColor:colours.gold},targetLineLabel:{position:'absolute',right:0,top:-12,color:colours.gold,fontSize:7,fontWeight:'900'}
});