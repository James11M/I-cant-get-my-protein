import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Card } from '@/components/Card';
import { BADGE_GROUPS, EvaluatedBadge, getEvaluatedBadges } from '@/features/awards/awards.service';
import { colours } from '@/theme/colours';

export function AwardsPanel() {
  const [badges, setBadges] = useState<EvaluatedBadge[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let live = true;
    setLoading(true);
    getEvaluatedBadges().then((items) => { if (live) { setBadges(items); setLoading(false); } }).catch(() => { if (live) { setBadges([]); setLoading(false); } });
    return () => { live = false; };
  }, []));

  const filters = useMemo(() => BADGE_GROUPS.filter((group) => group === 'All' || badges.some((badge) => badge.group === group)), [badges]);
  const visible = useMemo(() => badges.filter((badge) => filter === 'All' || badge.group === filter), [badges, filter]);
  const earnedCount = badges.filter((badge) => badge.earned).length;

  return <>
    <View style={styles.headerRow}><View><Text style={styles.heading}>MY BADGES</Text><Text style={styles.summary}>{earnedCount} OF {badges.length} EARNED</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {filters.map((group) => <Pressable key={group} style={[styles.filter, filter === group && styles.filterOn]} onPress={() => setFilter(group)}><Text style={[styles.filterText, filter === group && styles.filterTextOn]}>{group.toUpperCase()}</Text></Pressable>)}
    </ScrollView>
    {loading ? <Text style={styles.message}>Loading badges…</Text> : null}
    {!loading && visible.length === 0 ? <Text style={styles.message}>No badges in this group yet.</Text> : null}
    <View style={styles.grid}>{visible.map((badge) => <Pressable key={badge.id} style={styles.cardPress} onPress={() => router.push({ pathname: '/(app)/badge-detail', params: { id: badge.id } })}>
      <Card style={[styles.card, badge.earned && styles.cardEarned]}>
        <View style={[styles.icon, badge.earned && styles.iconEarned]}><Text style={styles.emoji}>{badge.icon}</Text></View>
        <Text style={styles.group}>{badge.group.toUpperCase()}</Text>
        <Text style={styles.title}>{badge.title}</Text>
        <Text style={styles.text}>{badge.earned && badge.earnedAt ? `GAINED ${formatDate(badge.earnedAt)}` : badge.description}</Text>
      </Card>
    </Pressable>)}</View>
  </>;
}

function formatDate(value: string) { const d = new Date(value); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }

const styles = StyleSheet.create({
  headerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:9},heading:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1.1},summary:{color:colours.muted,fontSize:8,fontWeight:'800',marginTop:3},filters:{gap:7,paddingBottom:12},filter:{borderWidth:1,borderColor:colours.border,backgroundColor:colours.card2,borderRadius:999,paddingHorizontal:12,paddingVertical:7},filterOn:{borderColor:colours.gold},filterText:{color:colours.muted,fontSize:8,fontWeight:'900',letterSpacing:.6},filterTextOn:{color:colours.gold},message:{color:colours.muted,fontSize:10,paddingVertical:16},
  grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:9},cardPress:{width:'48%'},card:{minHeight:154,alignItems:'center',justifyContent:'center',padding:10,borderColor:colours.border},cardEarned:{borderColor:colours.gold},icon:{width:58,height:58,borderRadius:29,borderWidth:2,borderColor:colours.border,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center'},iconEarned:{borderColor:colours.gold},emoji:{fontSize:27},group:{color:colours.gold,fontSize:7,fontWeight:'900',letterSpacing:.8,textAlign:'center',marginTop:8},title:{color:colours.white,fontSize:11,fontWeight:'900',textAlign:'center',marginTop:3},text:{color:colours.muted,fontSize:7,lineHeight:10,fontWeight:'700',textAlign:'center',marginTop:4}
});
