import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EvaluatedBadge, getEvaluatedBadges } from '@/features/awards/awards.service';
import { colours } from '@/theme/colours';

export default function BadgeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [badges, setBadges] = useState<EvaluatedBadge[]>([]);
  const [selectedId, setSelectedId] = useState(id || '');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let live = true;
    setLoading(true);
    getEvaluatedBadges().then((items) => { if (live) { setBadges(items); setLoading(false); } }).catch(() => { if (live) { setBadges([]); setLoading(false); } });
    return () => { live = false; };
  }, []));

  const selected = useMemo(() => badges.find((badge) => badge.id === selectedId) || badges.find((badge) => badge.id === id) || null, [badges, id, selectedId]);
  const groupBadges = useMemo(() => selected ? badges.filter((badge) => badge.group === selected.group) : [], [badges, selected]);
  const families = useMemo(() => Array.from(new Set(groupBadges.map((badge) => badge.family))), [groupBadges]);

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}><Brand /><Pressable style={styles.close} onPress={() => router.back()}><Text style={styles.closeText}>×</Text></Pressable></View>
        {loading ? <Text style={styles.message}>Loading badge…</Text> : null}
        {!loading && !selected ? <Text style={styles.message}>Badge not found.</Text> : null}
        {selected ? <>
          <View style={[styles.heroIcon, selected.earned && styles.heroIconEarned]}><Text style={styles.heroEmoji}>{selected.icon}</Text></View>
          <Text style={styles.group}>{selected.group.toUpperCase()}</Text>
          <Text style={styles.title}>{selected.title}</Text>
          <Text style={styles.description}>{selected.description}</Text>
          <Text style={[styles.gained, !selected.earned && styles.locked]}>{selected.earned && selected.earnedAt ? `GAINED ${formatDate(selected.earnedAt)}` : 'NOT YET GAINED'}</Text>

          {families.map((family) => {
            const familyBadges = groupBadges.filter((badge) => badge.family === family);
            return <Card key={family} style={styles.familyCard}>
              <Text style={styles.familyTitle}>{family}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sequence}>
                {familyBadges.map((badge) => <Pressable key={badge.id} style={styles.sequenceItem} onPress={() => setSelectedId(badge.id)}>
                  <View style={[styles.sequenceCircle, badge.earned && styles.sequenceEarned, badge.id === selected.id && styles.sequenceSelected]}><Text style={[styles.sequenceValue, badge.earned && styles.sequenceValueEarned]}>{sequenceLabel(badge)}</Text></View>
                  <Text style={[styles.sequenceName, badge.id === selected.id && styles.sequenceNameSelected]}>{badge.title}</Text>
                </Pressable>)}
              </ScrollView>
            </Card>;
          })}
        </> : null}
      </ScrollView>
    </Screen>
  );
}

function sequenceLabel(badge: EvaluatedBadge) {
  if (badge.unit === 'm') return badge.threshold >= 1000 ? `${badge.threshold / 1000}K` : `${badge.threshold}`;
  if (badge.unit === 'sessions') return `${badge.threshold}`;
  if (badge.unit === 'min') return badge.threshold >= 1000 ? `${badge.threshold / 1000}K` : `${badge.threshold}`;
  return `${badge.threshold}`;
}
function formatDate(value: string) { const d = new Date(value); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }

const styles = StyleSheet.create({
  screen:{paddingBottom:0},scroll:{flex:1},content:{paddingBottom:34},topRow:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'},close:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:colours.border,backgroundColor:colours.card,alignItems:'center',justifyContent:'center',marginTop:2},closeText:{color:colours.white,fontSize:29,lineHeight:31,fontWeight:'400'},
  message:{color:colours.muted,fontSize:11,marginTop:24},heroIcon:{width:122,height:122,borderRadius:61,borderWidth:3,borderColor:colours.border,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center',alignSelf:'center',marginTop:26},heroIconEarned:{borderColor:colours.gold},heroEmoji:{fontSize:60},group:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1.4,textAlign:'center',marginTop:18},title:{color:colours.white,fontSize:30,lineHeight:34,fontWeight:'900',textAlign:'center',marginTop:5},description:{color:colours.muted,fontSize:12,lineHeight:18,textAlign:'center',marginHorizontal:22,marginTop:8},gained:{color:colours.gold,fontSize:10,fontWeight:'900',letterSpacing:1,textAlign:'center',marginTop:12},locked:{color:colours.muted},
  familyCard:{marginTop:18,paddingHorizontal:12},familyTitle:{color:colours.white,fontSize:12,fontWeight:'900',letterSpacing:.6,marginBottom:12},sequence:{gap:12,paddingRight:8},sequenceItem:{width:68,alignItems:'center'},sequenceCircle:{width:56,height:56,borderRadius:28,borderWidth:2,borderColor:colours.border,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center'},sequenceEarned:{borderColor:colours.gold},sequenceSelected:{borderWidth:3},sequenceValue:{color:colours.muted,fontSize:12,fontWeight:'900'},sequenceValueEarned:{color:colours.white},sequenceName:{color:colours.muted,fontSize:7,lineHeight:10,fontWeight:'800',textAlign:'center',marginTop:6},sequenceNameSelected:{color:colours.gold}
});
