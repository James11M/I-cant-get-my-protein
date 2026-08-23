import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AwardsPanel } from '@/components/AwardsPanel';
import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { Screen } from '@/components/Screen';
import { StatsPanel } from '@/components/StatsPanel';
import { colours } from '@/theme/colours';

type Mode = 'leaders' | 'awards' | 'stats';

export default function LeadersScreen() {
  const [mode, setMode] = useState<Mode>('leaders');
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
          {mode === 'leaders' ? <LeaderboardPanel /> : null}
          {mode === 'awards' ? <AwardsPanel /> : null}
          {mode === 'stats' ? <StatsPanel /> : null}
        </View>
      </ScrollView>
      <BottomNav active="leaders" />
    </Screen>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

const styles=StyleSheet.create({
  screen:{paddingBottom:6},scroll:{flex:1},content:{paddingBottom:10},title:{color:colours.white,fontSize:29,fontWeight:'900',marginTop:18,marginBottom:12},
  segments:{backgroundColor:colours.card,borderWidth:1,borderColor:colours.border,borderRadius:11,flexDirection:'row',padding:3},segment:{flex:1,minHeight:34,borderRadius:8,alignItems:'center',justifyContent:'center'},segmentActive:{backgroundColor:colours.gold},segmentText:{color:colours.muted,fontSize:7,fontWeight:'900',letterSpacing:.7},segmentTextActive:{color:colours.background},body:{paddingTop:12}
});
