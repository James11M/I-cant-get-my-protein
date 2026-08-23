import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ExerciseVisual } from '@/components/ExerciseVisual';
import { Screen } from '@/components/Screen';
import { EQUIPMENT_LABELS } from '@/data/pocCatalog';
import { getExerciseFavourites, getStrengthExercises, setExerciseFavourite, StrengthExercise } from '@/features/exercises/exercise-library.service';
import { loadVisualExercises, VisualExercise } from '@/features/exercises/repdb';
import { colours } from '@/theme/colours';

type DetailExercise = StrengthExercise & VisualExercise;

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<DetailExercise | null>(null);
  const [favourite, setFavourite] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all([getStrengthExercises(), getExerciseFavourites().catch(() => [])]).then(async ([items, favourites]) => {
      const base = items.find((item) => item.id === id);
      if (!base) return;
      const visual = await loadVisualExercises([base]);
      if (!live) return;
      setExercise((visual[0] || base) as DetailExercise);
      setFavourite(favourites.includes(base.id));
    });
    return () => { live = false; };
  }, [id]);

  async function toggleFavourite() {
    if (!exercise) return;
    const next = !favourite;
    setFavourite(next);
    try { await setExerciseFavourite(exercise.id, next); } catch { setFavourite(!next); }
  }

  if (!exercise) return <Screen><Brand /><BackButton /><Text style={styles.loading}>Loading exercise…</Text></Screen>;

  return <Screen>
    <Brand /><BackButton />
    <View style={styles.hero}><ExerciseVisual exercise={exercise} /></View>
    <View style={styles.titleRow}><View style={styles.flex}><Text style={styles.title}>{exercise.name}</Text><View style={styles.equipmentPill}><Text style={styles.equipmentText}>{EQUIPMENT_LABELS[exercise.equipment]}</Text></View><Text style={styles.subtitle}>{exercise.group}</Text></View><Pressable onPress={toggleFavourite}><Text style={[styles.star,favourite?styles.starOn:styles.starOff]}>{favourite?'★':'☆'}</Text></Pressable></View>
    <Card style={styles.measureCard}><View style={styles.measureHeader}><Text style={styles.sectionTitle}>MEASUREMENTS</Text><Pressable onPress={()=>router.push({pathname:'/(app)/exercise-settings',params:{id:exercise.id}})}><Text style={styles.edit}>✎ EDIT</Text></Pressable></View><Text style={styles.measureValue}>{exercise.measurements.map((item)=>item.toUpperCase()).join(' + ')}</Text></Card>
    <Card style={styles.techniqueCard}><Text style={styles.sectionTitle}>TECHNIQUE</Text><Text style={styles.technique}>Use controlled technique and stop if form breaks down.</Text>{(exercise.instructions||[]).map((instruction,index)=><Text key={index} style={styles.instruction}>{index+1}. {instruction}</Text>)}</Card>
  </Screen>;
}

const styles=StyleSheet.create({loading:{color:colours.muted,fontSize:11},hero:{height:330,borderWidth:1,borderColor:colours.border,borderRadius:14,overflow:'hidden',backgroundColor:colours.card,marginBottom:18},titleRow:{flexDirection:'row',alignItems:'center',marginBottom:16},flex:{flex:1},title:{color:colours.white,fontSize:31,lineHeight:35,fontWeight:'900'},equipmentPill:{alignSelf:'flex-start',backgroundColor:colours.card2,borderRadius:6,paddingHorizontal:8,paddingVertical:4,marginTop:8},equipmentText:{color:colours.gold,fontSize:8,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:13,marginTop:6},star:{fontSize:45,marginLeft:12},starOn:{color:colours.gold},starOff:{color:colours.muted},measureCard:{borderColor:colours.gold,marginBottom:10},measureHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},measureValue:{color:colours.gold,fontSize:12,fontWeight:'900',marginTop:8},edit:{color:colours.gold,fontSize:9,fontWeight:'900'},techniqueCard:{borderColor:colours.border},sectionTitle:{color:colours.white,fontSize:12,fontWeight:'900',letterSpacing:.7},technique:{color:colours.muted,fontSize:12,lineHeight:18,marginTop:12},instruction:{color:colours.white,fontSize:11,lineHeight:18,marginTop:12}});