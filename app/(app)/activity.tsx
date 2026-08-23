import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { Activity, getActivities, getFavouriteActivityIds, setActivityFavourite } from '@/features/activities/activity.service';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

const FILTERS = ['FAVOURITES', 'ALL', 'Sport', 'Cardio', 'Recovery', 'School / PE'];

export default function ActivityLibraryScreen() {
  const { session } = useAuth();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      try {
        setLoading(true);
        const [items, favouriteIds] = await Promise.all([getActivities(), session?.user.id ? getFavouriteActivityIds(session.user.id) : Promise.resolve([])]);
        if (live) { setActivities(items); setFavourites(favouriteIds); }
      } finally { if (live) setLoading(false); }
    }
    void load();
    return () => { live = false; };
  }, [session?.user.id]));

  const visible = useMemo(() => activities.filter((activity) => filter === 'ALL' ? true : filter === 'FAVOURITES' ? favourites.includes(activity.id) : activity.category === filter), [activities, favourites, filter]);

  async function toggleFavourite(activityId: string) {
    if (!session?.user.id) return;
    const next = !favourites.includes(activityId);
    setFavourites((current) => next ? [...current, activityId] : current.filter((id) => id !== activityId));
    try { await setActivityFavourite(session.user.id, activityId, next); } catch { setFavourites((current) => next ? current.filter((id) => id !== activityId) : [...current, activityId]); }
  }

  return (
    <Screen>
      <Brand /><BackButton label="BACK" />
      <Text style={styles.title}>Sport / Activity</Text>
      <Text style={styles.subtitle}>{date ? `Choose what you did on ${formatDate(date)}.` : 'Choose what you did.'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{FILTERS.map((item) => <Pressable key={item} style={[styles.filter, filter === item && styles.filterOn]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.filterTextOn]}>{item}</Text></Pressable>)}</ScrollView>
      {loading ? <Text style={styles.message}>Loading activities…</Text> : null}
      {!loading && visible.length === 0 ? <Text style={styles.message}>No activities in this filter yet.</Text> : null}
      {visible.map((activity) => <View key={activity.id} style={styles.listCard}>
        <Pressable style={styles.listMain} onPress={() => router.push({ pathname: '/(app)/activity-log', params: { id: activity.id, ...(date ? { date } : {}) } })}>
          <Text style={styles.listEmoji}>{activity.icon || '⚡'}</Text><View style={styles.flex}><Text style={styles.cardTitle}>{activity.name}</Text><Text style={styles.smallMuted}>{activity.category} • full credit {activity.default_target} {activity.unit}</Text></View><Text style={styles.arrow}>→</Text>
        </Pressable>
        <Pressable style={styles.favouriteStrip} onPress={() => void toggleFavourite(activity.id)}><Text style={favourites.includes(activity.id) ? styles.starOn : styles.starOff}>{favourites.includes(activity.id) ? '★' : '☆'}</Text></Pressable>
      </View>)}
    </Screen>
  );
}
function formatDate(value: string) { const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`; }
const styles = StyleSheet.create({
  title:{color:colours.white,fontSize:30,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:11,marginTop:4,marginBottom:12},filters:{gap:7,paddingBottom:12},filter:{borderWidth:1,borderColor:colours.border,backgroundColor:colours.card2,borderRadius:999,paddingHorizontal:12,paddingVertical:7},filterOn:{borderColor:colours.gold},filterText:{color:colours.muted,fontSize:8,fontWeight:'900',letterSpacing:.6},filterTextOn:{color:colours.gold},message:{color:colours.muted,fontSize:11,paddingVertical:16},listCard:{flexDirection:'row',backgroundColor:colours.card,borderWidth:1,borderColor:colours.border,borderRadius:14,marginBottom:8,overflow:'hidden'},listMain:{flex:1,flexDirection:'row',alignItems:'center',minHeight:67,paddingHorizontal:12,paddingVertical:10},listEmoji:{fontSize:25,width:42},flex:{flex:1},cardTitle:{color:colours.white,fontSize:13,fontWeight:'900'},smallMuted:{color:colours.muted,fontSize:8,fontWeight:'700',marginTop:3},arrow:{color:colours.gold,fontSize:19,fontWeight:'900',marginLeft:8},favouriteStrip:{width:42,borderLeftWidth:1,borderLeftColor:colours.border,alignItems:'center',justifyContent:'center',backgroundColor:colours.card2},starOn:{color:colours.gold,fontSize:21},starOff:{color:colours.muted,fontSize:21}
});
