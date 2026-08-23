import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ExerciseVisual } from '@/components/ExerciseVisual';
import { Screen } from '@/components/Screen';
import { EQUIPMENT_LABELS, ExerciseDefinition } from '@/data/pocCatalog';
import { addSimpleActivityLog } from '@/features/activities/activity.service';
import { DEFAULT_EQUIPMENT, EquipmentPreferences, getEquipmentPreferences, getExerciseFavourites, getStrengthExercises, setExerciseFavourite, StrengthExercise } from '@/features/exercises/exercise-library.service';
import { loadVisualExercises, VisualExercise } from '@/features/exercises/repdb';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

type WorkoutSet = { reps: string; seconds: string; weight: string; distance: string };
type WorkoutExercise = { definition: StrengthExercise; sets: WorkoutSet[] };
type PickerExercise = StrengthExercise & VisualExercise;
type Selector = 'all' | 'favourites' | 'my_equipment' | ExerciseDefinition['equipment'];
const SELECTORS: Array<[Selector,string]> = [['all','ALL'],['favourites','★ FAVOURITES'],['my_equipment','MY EQUIPMENT'],['bodyweight','BODYWEIGHT'],['dumbbell','DUMBBELLS'],['kettlebell','KETTLEBELLS'],['homegym','HOME KIT'],['fullgym','FULL GYM']];

export default function WorkoutScreen() {
  const { session } = useAuth();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [workout, setWorkout] = useState<WorkoutExercise[]>([]);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [selector, setSelector] = useState<Selector>('all');
  const [equipment, setEquipment] = useState<EquipmentPreferences>(DEFAULT_EQUIPMENT);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [library, setLibrary] = useState<PickerExercise[]>([]);
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  useEffect(() => {
    Promise.all([getStrengthExercises(), getEquipmentPreferences(), getExerciseFavourites()]).then(async ([definitions, prefs, favs]) => {
      const visual = await loadVisualExercises(definitions);
      setLibrary(visual as PickerExercise[]); setEquipment(prefs); setFavourites(favs);
    }).catch(() => {});
  }, [adding]);

  const seconds = useMemo(() => estimateSeconds(workout), [workout]);
  const minutes = Math.max(1, Math.round(seconds / 60));
  const setCount = workout.reduce((sum, item) => sum + item.sets.length, 0);
  const filtered = library.filter((item) => {
    const selectorMatch = selector === 'all' || (selector === 'favourites' && favourites.includes(item.id)) || (selector === 'my_equipment' && equipment[item.equipment]) || item.equipment === selector;
    return selectorMatch && item.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  function blankSet(definition: StrengthExercise): WorkoutSet {
    return { reps:String(definition.defaultReps ?? 10), seconds:String(definition.defaultSeconds ?? 45), weight:'', distance:'' };
  }
  function addExercise(definition: StrengthExercise) { setWorkout((current) => [...current, { definition, sets:Array.from({length:definition.defaultSets},()=>blankSet(definition)) }]); setAdding(false); setQuery(''); }
  function updateSet(exerciseIndex:number,setIndex:number,field:keyof WorkoutSet,value:string){setWorkout((current)=>current.map((exercise,index)=>index!==exerciseIndex?exercise:{...exercise,sets:exercise.sets.map((set,inner)=>inner===setIndex?{...set,[field]:value}:set)}));}
  function addSet(exerciseIndex:number){setWorkout((current)=>current.map((exercise,index)=>index!==exerciseIndex?exercise:{...exercise,sets:[...exercise.sets,blankSet(exercise.definition)]}));}
  function removeExercise(exerciseIndex:number){setWorkout((current)=>current.filter((_,index)=>index!==exerciseIndex));}
  async function toggleFavourite(id:string){const next=!favourites.includes(id);setFavourites((items)=>next?[...items,id]:items.filter((item)=>item!==id));try{await setExerciseFavourite(id,next)}catch{setFavourites((items)=>next?items.filter((item)=>item!==id):[...items,id])}}

  async function finishWorkout(){if(workout.length===0){setComplete(true);return;}setSaving(true);try{if(session?.user.id)await addSimpleActivityLog({userId:session.user.id,name:'Strength Training',icon:'🏋️',trainingType:'Strength',durationMinutes:minutes,creditMinutes:minutes,...(date?{performedAt:`${date}T12:00:00`}:{})});setComplete(true)}finally{setSaving(false)}}

  if(complete)return <Screen><Brand/><View style={styles.completeHero}><Text style={styles.completeEmoji}>🏋️</Text><Text style={styles.completeTitle}>WORKOUT COMPLETE</Text>{date?<Text style={styles.completeDate}>{formatDate(date)}</Text>:null}</View><Card><View style={styles.statsRow}><Stat label="MIN" value={minutes}/><Stat label="EXERCISES" value={workout.length}/><Stat label="SETS" value={setCount}/></View></Card><Card style={styles.sectionGap}><Text style={styles.sectionTitle}>SAVE AS TEMPLATE</Text><TextInput style={styles.input} value={templateName} onChangeText={setTemplateName} placeholder="e.g. Saturday Gym" placeholderTextColor={colours.muted}/><Pressable style={[styles.finish,!templateName.trim()&&styles.disabled]} disabled={!templateName.trim()} onPress={()=>setTemplateSaved(true)}><Text style={styles.finishText}>{templateSaved?'TEMPLATE SAVED':'SAVE TEMPLATE'}</Text></Pressable></Card><Pressable style={styles.outline} onPress={()=>router.replace(date?'/(app)/history':'/(app)/index')}><Text style={styles.outlineText}>DONE</Text></Pressable></Screen>;

  return <Screen><Brand/><BackButton/><Text style={styles.title}>Workout</Text><Text style={styles.subtitle}>{date?`${formatDate(date)} • `:''}Estimated duration: {minutes} min</Text>
    {workout.map((exercise,exerciseIndex)=><Card key={`${exercise.definition.id}-${exerciseIndex}`} style={styles.exerciseCard}><View style={styles.exerciseHeader}><View style={styles.exerciseIcon}><Text style={styles.exerciseEmoji}>{exercise.definition.icon}</Text></View><View style={styles.flex}><Text style={styles.exerciseTitle}>{exercise.definition.name}</Text><Text style={styles.meta}>{EQUIPMENT_LABELS[exercise.definition.equipment]} • {exercise.definition.measurements.map((m)=>m.toUpperCase()).join(' + ')}</Text></View><Pressable onPress={()=>removeExercise(exerciseIndex)}><Text style={styles.remove}>×</Text></Pressable></View>
      <View style={styles.setHead}><Text style={[styles.setHeadText,styles.setNumber]}>SET</Text>{exercise.definition.measurements.map((measure)=><Text key={measure} style={[styles.setHeadText,styles.setField]}>{measure==='time'?'SEC':measure.toUpperCase()}</Text>)}</View>
      {exercise.sets.map((set,setIndex)=><View key={setIndex} style={styles.setRow}><Text style={[styles.setIndex,styles.setNumber]}>{setIndex+1}</Text>{exercise.definition.measurements.map((measure)=>{const field=measure==='time'?'seconds':measure;return <TextInput key={measure} style={[styles.setInput,styles.setField]} keyboardType="decimal-pad" value={set[field]} onChangeText={(value)=>updateSet(exerciseIndex,setIndex,field,value)} placeholder="—" placeholderTextColor={colours.muted}/>})}</View>)}
      <Pressable style={styles.addSet} onPress={()=>addSet(exerciseIndex)}><Text style={styles.addSetText}>+ ADD SET</Text></Pressable></Card>)}

    {adding?<Card style={styles.pickerCard}><Text style={styles.sectionTitle}>ADD EXERCISE</Text><TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search exercise…" placeholderTextColor={colours.muted}/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{SELECTORS.map(([key,label])=><Pressable key={key} style={[styles.filter,selector===key&&styles.filterOn]} onPress={()=>setSelector(key)}><Text style={[styles.filterText,selector===key&&styles.filterTextOn]} numberOfLines={1}>{label}</Text></Pressable>)}</ScrollView>
      {filtered.map((item)=><View key={item.id} style={styles.libraryCard}><Pressable style={styles.libraryMain} onPress={()=>addExercise(item)}><View style={styles.thumb}><ExerciseVisual exercise={item} compact/></View><View style={styles.flex}><Text style={styles.choiceTitle}>{item.name}</Text><Text style={styles.meta}>{EQUIPMENT_LABELS[item.equipment]} • {item.measurements.map((m)=>m.toUpperCase()).join(' + ')}</Text></View><Text style={styles.arrow}>+</Text></Pressable><Pressable style={styles.starStrip} onPress={()=>toggleFavourite(item.id)}><Text style={[styles.star,favourites.includes(item.id)&&styles.starOn]}>{favourites.includes(item.id)?'★':'☆'}</Text></Pressable></View>)}
      <Pressable style={styles.cancel} onPress={()=>setAdding(false)}><Text style={styles.cancelText}>CANCEL</Text></Pressable></Card>:<Pressable style={styles.outline} onPress={()=>setAdding(true)}><Text style={styles.outlineText}>+ ADD EXERCISE</Text></Pressable>}
    <Pressable style={[styles.finish,saving&&styles.disabled]} disabled={saving} onPress={finishWorkout}><Text style={styles.finishText}>{saving?'SAVING…':'FINISH'}</Text></Pressable><View style={styles.spacer}/></Screen>;
}

function estimateSeconds(workout:WorkoutExercise[]){let total=60;workout.forEach((exercise,exerciseIndex)=>{exercise.sets.forEach((set,setIndex)=>{if(exercise.definition.measurements.includes('time'))total+=Number(set.seconds)||0;else if(exercise.definition.measurements.includes('reps'))total+=(Number(set.reps)||0)*(exercise.definition.secondsPerRep||3);else total+=30;if(setIndex<exercise.sets.length-1)total+=60});if(exerciseIndex<workout.length-1)total+=45});return total}
function Stat({label,value}:{label:string;value:number}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}
function formatDate(value:string){const[y,m,d]=value.split('-');return `${d}/${m}/${y}`}
const styles=StyleSheet.create({flex:{flex:1},title:{color:colours.white,fontSize:31,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:11,fontWeight:'700',marginTop:5,marginBottom:18},sectionTitle:{color:colours.white,fontSize:11,fontWeight:'900',letterSpacing:.6},exerciseCard:{marginBottom:10},exerciseHeader:{flexDirection:'row',alignItems:'center',marginBottom:12},exerciseIcon:{width:42,height:42,borderRadius:10,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center',marginRight:10},exerciseEmoji:{fontSize:20},exerciseTitle:{color:colours.white,fontSize:13,fontWeight:'900'},meta:{color:colours.muted,fontSize:8,fontWeight:'800',marginTop:4},remove:{color:colours.muted,fontSize:26,paddingHorizontal:5},setHead:{flexDirection:'row',alignItems:'center',marginBottom:4},setHeadText:{color:colours.muted,fontSize:7,fontWeight:'900',textAlign:'center'},setNumber:{width:38},setField:{flex:1},setRow:{flexDirection:'row',alignItems:'center',marginTop:6},setIndex:{color:colours.white,fontSize:12,fontWeight:'900',textAlign:'center'},setInput:{backgroundColor:colours.card2,borderWidth:1,borderColor:colours.border,borderRadius:8,color:colours.white,minHeight:38,marginHorizontal:3,paddingHorizontal:6,textAlign:'center',fontWeight:'900'},addSet:{borderTopWidth:1,borderTopColor:colours.border,marginTop:12,paddingTop:10,alignItems:'center'},addSetText:{color:colours.gold,fontSize:9,fontWeight:'900'},outline:{borderWidth:1,borderColor:colours.gold,borderRadius:13,minHeight:48,alignItems:'center',justifyContent:'center',marginBottom:10},outlineText:{color:colours.gold,fontSize:10,fontWeight:'900',letterSpacing:1},finish:{backgroundColor:colours.gold,borderRadius:13,minHeight:48,alignItems:'center',justifyContent:'center',marginTop:2},finishText:{color:colours.background,fontSize:11,fontWeight:'900',letterSpacing:1.2},disabled:{opacity:.45},pickerCard:{borderColor:colours.gold,marginBottom:10},input:{backgroundColor:colours.card2,borderWidth:1,borderColor:colours.border,borderRadius:10,color:colours.white,paddingHorizontal:12,paddingVertical:10,marginTop:10,marginBottom:10},filters:{gap:7,paddingBottom:12,paddingRight:12},filter:{borderWidth:1,borderColor:colours.border,borderRadius:18,paddingHorizontal:11,paddingVertical:7},filterOn:{backgroundColor:colours.gold,borderColor:colours.gold},filterText:{color:colours.muted,fontSize:8,fontWeight:'900'},filterTextOn:{color:colours.background},libraryCard:{borderWidth:1,borderColor:colours.border,borderRadius:12,overflow:'hidden',marginBottom:8},libraryMain:{minHeight:94,flexDirection:'row',alignItems:'center',padding:9},thumb:{width:82,height:78,borderRadius:8,overflow:'hidden',backgroundColor:colours.card2,marginRight:10},choiceTitle:{color:colours.white,fontSize:12,fontWeight:'900'},arrow:{color:colours.gold,fontSize:24,fontWeight:'900',marginLeft:8},starStrip:{borderTopWidth:1,borderTopColor:colours.border,alignItems:'flex-end',paddingHorizontal:12,paddingVertical:5},star:{color:colours.muted,fontSize:24},starOn:{color:colours.gold},cancel:{alignItems:'center',paddingTop:8},cancelText:{color:colours.muted,fontSize:9,fontWeight:'900'},completeHero:{alignItems:'center',paddingVertical:20},completeEmoji:{fontSize:42},completeTitle:{color:colours.gold,fontSize:18,fontWeight:'900',marginTop:8,letterSpacing:1},completeDate:{color:colours.white,fontSize:10,fontWeight:'900',marginTop:5},statsRow:{flexDirection:'row',justifyContent:'space-around'},stat:{alignItems:'center',flex:1},statValue:{color:colours.white,fontSize:25,fontWeight:'900'},statLabel:{color:colours.muted,fontSize:8,fontWeight:'900',marginTop:3},sectionGap:{marginTop:10,marginBottom:10},spacer:{height:12}});