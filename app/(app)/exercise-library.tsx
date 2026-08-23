import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { CardAction } from '@/components/CardAction';
import { ExerciseVisual } from '@/components/ExerciseVisual';
import { Screen } from '@/components/Screen';
import { EQUIPMENT_LABELS, ExerciseDefinition } from '@/data/pocCatalog';
import { DEFAULT_EQUIPMENT, EquipmentPreferences, getEquipmentPreferences, getExerciseFavourites, getStrengthExercises, saveEquipmentPreferences, setExerciseFavourite, StrengthExercise } from '@/features/exercises/exercise-library.service';
import { loadVisualExercises, VisualExercise } from '@/features/exercises/repdb';
import { colours } from '@/theme/colours';

type Selector = 'all' | 'favourites' | 'my_equipment' | ExerciseDefinition['equipment'];
type LibraryExercise = VisualExercise & StrengthExercise;

const SELECTORS: Array<[Selector, string]> = [
  ['all', 'ALL'], ['favourites', '★ FAVOURITES'], ['my_equipment', 'MY EQUIPMENT'], ['bodyweight', 'BODYWEIGHT'], ['dumbbell', 'DUMBBELLS'], ['kettlebell', 'KETTLEBELLS'], ['homegym', 'HOME KIT'], ['fullgym', 'FULL GYM'],
];
const EQUIPMENT: Array<[keyof EquipmentPreferences, string]> = [
  ['bodyweight', 'Bodyweight'], ['dumbbell', 'Dumbbells'], ['kettlebell', 'Kettlebells'], ['homegym', 'Home Kit'], ['fullgym', 'Full Gym'],
];

export default function ExerciseLibraryScreen() {
  const [query, setQuery] = useState('');
  const [selector, setSelector] = useState<Selector>('all');
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [equipment, setEquipment] = useState<EquipmentPreferences>(DEFAULT_EQUIPMENT);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [illustrationError, setIllustrationError] = useState(false);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      setLoading(true);
      const [savedFavourites, savedEquipment, definitions] = await Promise.all([
        getExerciseFavourites().catch(() => []),
        getEquipmentPreferences().catch(() => DEFAULT_EQUIPMENT),
        getStrengthExercises(),
      ]);
      const visual = await loadVisualExercises(definitions);
      if (!live) return;
      setFavourites(savedFavourites);
      setEquipment(savedEquipment);
      setExercises(visual as LibraryExercise[]);
      setIllustrationError(!visual.some((item) => item.imageStart || item.imagePeak || item.imageMain));
      setLoading(false);
    }
    load().catch(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []));

  const availableLabels = EQUIPMENT.filter(([key]) => equipment[key]).map(([, label]) => label);
  const visible = useMemo(() => exercises.filter((exercise) => {
    const selectorMatch = selector === 'all'
      || (selector === 'favourites' && favourites.includes(exercise.id))
      || (selector === 'my_equipment' && equipment[exercise.equipment])
      || exercise.equipment === selector;
    return selectorMatch && exercise.name.toLowerCase().includes(query.trim().toLowerCase());
  }), [equipment, exercises, favourites, query, selector]);

  async function toggleFavourite(id: string) {
    const next = !favourites.includes(id);
    setFavourites((items) => next ? [...items, id] : items.filter((item) => item !== id));
    try { await setExerciseFavourite(id, next); } catch { setFavourites((items) => next ? items.filter((item) => item !== id) : [...items, id]); }
  }

  async function toggleEquipment(key: keyof EquipmentPreferences) {
    if (key === 'bodyweight') return;
    const next = { ...equipment, [key]: !equipment[key] };
    setEquipment(next);
    try { await saveEquipmentPreferences(next); } catch { setEquipment(equipment); }
  }

  return (
    <Screen>
      <Brand /><BackButton /><Text style={styles.title}>Exercise Library</Text>
      <Card style={styles.equipmentCard}>
        <Pressable style={styles.rowBetween} onPress={() => setEquipmentOpen((value) => !value)}>
          <View style={styles.flex}><Text style={styles.sectionTitle}>EQUIPMENT AVAILABLE</Text>{!equipmentOpen ? <Text style={styles.muted}>{availableLabels.join(' • ')}</Text> : null}</View>
          <CardAction colour={colours.gold} label={equipmentOpen ? 'HIDE ↑' : 'VIEW →'} />
        </Pressable>
        {equipmentOpen ? <View style={styles.equipmentList}>{EQUIPMENT.map(([key, label], index) => <Pressable key={key} style={[styles.equipmentRow, index < EQUIPMENT.length - 1 && styles.divider]} onPress={() => toggleEquipment(key)}><Text style={styles.equipmentName}>{label}</Text><View style={[styles.toggle, equipment[key] && styles.toggleOn]}><View style={[styles.knob, equipment[key] && styles.knobOn]} /></View></Pressable>)}</View> : null}
      </Card>

      <Pressable style={styles.addOwn} onPress={() => router.push('/(app)/exercise-settings')}><Text style={styles.addOwnText}>+ ADD YOUR OWN EXERCISE</Text></Pressable>
      <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search exercise…" placeholderTextColor={colours.muted} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>{SELECTORS.map(([key, label]) => <Pressable key={key} style={[styles.filter, selector === key && styles.filterOn]} onPress={() => setSelector(key)}><Text style={[styles.filterText, selector === key && styles.filterTextOn]} numberOfLines={1}>{label}</Text></Pressable>)}</ScrollView>

      {loading ? <ActivityIndicator color={colours.gold} style={styles.loading} /> : null}
      {illustrationError ? <Text style={styles.warning}>Some exercise illustrations are temporarily unavailable.</Text> : null}
      {visible.map((exercise) => <View key={exercise.id} style={styles.exerciseCard}>
        <Pressable style={styles.exerciseMain} onPress={() => router.push({ pathname: '/(app)/exercise-detail', params: { id: exercise.id } })}>
          <View style={styles.thumb}><ExerciseVisual exercise={exercise} compact /></View>
          <View style={styles.flex}><Text style={styles.exerciseTitle}>{exercise.name}</Text><View style={styles.equipmentPill}><Text style={styles.equipmentPillText}>{EQUIPMENT_LABELS[exercise.equipment]}</Text></View><Text style={styles.exerciseMeta}>{exercise.group} • {exercise.measurements.map((item) => item.toUpperCase()).join(' + ')}</Text></View><Text style={styles.arrow}>→</Text>
        </Pressable>
        <View style={styles.actionStrip}><Pressable onPress={() => router.push({ pathname: '/(app)/exercise-settings', params: { id: exercise.id } })}><Text style={styles.edit}>✎ EDIT</Text></Pressable><Pressable onPress={() => toggleFavourite(exercise.id)}><Text style={[styles.star, favourites.includes(exercise.id) ? styles.starOn : styles.starOff]}>{favourites.includes(exercise.id) ? '★' : '☆'}</Text></Pressable></View>
      </View>)}
      <Text style={styles.attribution}>Exercise data & illustrations by RepDB</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title:{color:colours.white,fontSize:30,lineHeight:34,fontWeight:'900',marginBottom:14},flex:{flex:1},rowBetween:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},sectionTitle:{color:colours.white,fontSize:11,fontWeight:'900',letterSpacing:.7},equipmentCard:{borderColor:colours.border,marginBottom:12},muted:{color:colours.muted,fontSize:10,marginTop:6},equipmentList:{marginTop:10,borderTopWidth:1,borderTopColor:colours.border},equipmentRow:{minHeight:64,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},divider:{borderBottomWidth:1,borderBottomColor:colours.border},equipmentName:{color:colours.white,fontSize:15,fontWeight:'900'},toggle:{width:52,height:30,borderRadius:15,padding:3,backgroundColor:colours.card2,justifyContent:'center'},toggleOn:{backgroundColor:colours.gold},knob:{width:24,height:24,borderRadius:12,backgroundColor:colours.muted},knobOn:{alignSelf:'flex-end',backgroundColor:colours.background},addOwn:{minHeight:50,borderWidth:1,borderColor:colours.gold,borderRadius:11,alignItems:'center',justifyContent:'center',marginBottom:12},addOwnText:{color:colours.gold,fontSize:11,fontWeight:'900',letterSpacing:.5},search:{minHeight:54,backgroundColor:colours.card,borderWidth:1,borderColor:colours.border,borderRadius:12,color:colours.white,paddingHorizontal:14,fontSize:15,marginBottom:9},filterScroll:{marginHorizontal:-1,marginBottom:12},filters:{gap:8,paddingHorizontal:1,paddingRight:16},filter:{minHeight:38,borderWidth:1,borderColor:colours.border,borderRadius:20,paddingHorizontal:15,alignItems:'center',justifyContent:'center'},filterOn:{backgroundColor:colours.gold,borderColor:colours.gold},filterText:{color:colours.muted,fontSize:9,fontWeight:'900'},filterTextOn:{color:colours.background},loading:{marginVertical:10},warning:{color:colours.muted,fontSize:9,marginBottom:8},exerciseCard:{borderWidth:1,borderColor:colours.border,borderRadius:13,backgroundColor:colours.card,marginBottom:10,overflow:'hidden'},exerciseMain:{minHeight:112,flexDirection:'row',alignItems:'center',padding:12},thumb:{width:96,height:92,borderRadius:10,overflow:'hidden',backgroundColor:colours.card2,marginRight:12},exerciseTitle:{color:colours.white,fontSize:16,lineHeight:20,fontWeight:'900'},equipmentPill:{alignSelf:'flex-start',backgroundColor:colours.card2,borderRadius:6,paddingHorizontal:8,paddingVertical:4,marginTop:5},equipmentPillText:{color:colours.gold,fontSize:8,fontWeight:'900'},exerciseMeta:{color:colours.muted,fontSize:9,marginTop:6},arrow:{color:colours.gold,fontSize:28,marginLeft:8},actionStrip:{minHeight:43,borderTopWidth:1,borderTopColor:colours.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14},edit:{color:colours.gold,fontSize:9,fontWeight:'900'},star:{fontSize:28},starOn:{color:colours.gold},starOff:{color:colours.muted},attribution:{color:colours.muted,fontSize:8,textAlign:'center',marginTop:2,marginBottom:12}
});