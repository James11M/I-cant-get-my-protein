import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { Screen } from '@/components/Screen';
import { EQUIPMENT_LABELS, ExerciseDefinition } from '@/data/pocCatalog';
import { ExerciseMeasurement, getStrengthExercises, saveCustomExercise, saveExerciseMeasurements, StrengthExercise } from '@/features/exercises/exercise-library.service';
import { colours } from '@/theme/colours';

const MEASURES: Array<[ExerciseMeasurement, string, string]> = [
  ['time', 'TIME', 'Seconds held or performed'],
  ['reps', 'REPS', 'Repetitions in each set'],
  ['weight', 'WEIGHT', 'Load used in kg'],
  ['distance', 'DISTANCE', 'Distance covered in metres'],
];
const EQUIPMENT = Object.entries(EQUIPMENT_LABELS) as Array<[ExerciseDefinition['equipment'], string]>;

export default function ExerciseSettingsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [exercise, setExercise] = useState<StrengthExercise | null>(null);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Other');
  const [equipment, setEquipment] = useState<ExerciseDefinition['equipment']>('bodyweight');
  const [measurements, setMeasurements] = useState<ExerciseMeasurement[]>(['reps']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getStrengthExercises().then((items) => {
      const found = items.find((item) => item.id === id);
      if (!found) return;
      setExercise(found); setName(found.name); setGroup(found.group); setEquipment(found.equipment); setMeasurements(found.measurements);
    }).catch(() => setError('Could not load exercise settings.'));
  }, [id]);

  function toggleMeasure(value: ExerciseMeasurement) {
    setMeasurements((items) => items.includes(value) ? (items.length === 1 ? items : items.filter((item) => item !== value)) : [...items, value]);
  }

  async function save() {
    if (!name.trim() && !id) { setError('Please give your exercise a name.'); return; }
    if (!measurements.length) return;
    setSaving(true); setError('');
    try {
      if (exercise?.isCustom || !id) await saveCustomExercise({ id: exercise?.isCustom ? exercise.id : undefined, name, group, equipment, measurements });
      else await saveExerciseMeasurements(id, measurements);
      router.back();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save exercise.'); }
    finally { setSaving(false); }
  }

  const custom = !id || exercise?.isCustom;
  return <Screen>
    <Brand /><BackButton /><Text style={styles.title}>{custom ? (id ? 'Edit Exercise' : 'Add Exercise') : 'Exercise Settings'}</Text>
    <Text style={styles.subtitle}>Choose exactly what is recorded for this exercise.</Text>

    {custom ? <Card style={styles.card}>
      <Text style={styles.label}>EXERCISE NAME</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Exercise name" placeholderTextColor={colours.muted} />
      <Text style={styles.label}>MUSCLE GROUP</Text><TextInput style={styles.input} value={group} onChangeText={setGroup} placeholder="e.g. Core" placeholderTextColor={colours.muted} />
      <Text style={styles.label}>EQUIPMENT</Text><View style={styles.pills}>{EQUIPMENT.map(([key,label]) => <Pressable key={key} style={[styles.pill,equipment===key&&styles.pillOn]} onPress={()=>setEquipment(key)}><Text style={[styles.pillText,equipment===key&&styles.pillTextOn]}>{label}</Text></Pressable>)}</View>
    </Card> : <Card style={styles.summary}><Text style={styles.exerciseName}>{exercise?.name || 'Loading…'}</Text><Text style={styles.meta}>{exercise ? `${EQUIPMENT_LABELS[exercise.equipment]} • ${exercise.group}` : ''}</Text></Card>}

    <Text style={styles.section}>MEASUREMENTS</Text>
    {MEASURES.map(([key,title,description]) => <Pressable key={key} style={[styles.measureCard,measurements.includes(key)&&styles.measureOn]} onPress={()=>toggleMeasure(key)}><View style={styles.flex}><Text style={[styles.measureTitle,measurements.includes(key)&&styles.measureTitleOn]}>{title}</Text><Text style={[styles.measureText,measurements.includes(key)&&styles.measureTextOn]}>{description}</Text></View><Text style={[styles.check,measurements.includes(key)&&styles.checkOn]}>{measurements.includes(key)?'✓':'○'}</Text></Pressable>)}
    <Text style={styles.note}>Examples: Front Plank = Time. Bench Press = Reps + Weight. Farmer’s Carry = Weight + Distance.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <PrimaryActionButton label={saving?'SAVING…':'SAVE'} onPress={save} disabled={saving} style={styles.save} />
  </Screen>;
}

const styles=StyleSheet.create({title:{color:colours.white,fontSize:30,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:14},card:{marginBottom:14},label:{color:colours.gold,fontSize:8,fontWeight:'900',letterSpacing:1,marginTop:8,marginBottom:6},input:{backgroundColor:colours.card2,borderWidth:1,borderColor:colours.border,borderRadius:10,color:colours.white,paddingHorizontal:12,paddingVertical:11,fontSize:14},pills:{flexDirection:'row',flexWrap:'wrap',gap:7},pill:{borderWidth:1,borderColor:colours.border,borderRadius:16,paddingHorizontal:10,paddingVertical:7},pillOn:{backgroundColor:colours.gold,borderColor:colours.gold},pillText:{color:colours.muted,fontSize:8,fontWeight:'900'},pillTextOn:{color:colours.background},summary:{borderColor:colours.gold,marginBottom:14},exerciseName:{color:colours.white,fontSize:18,fontWeight:'900'},meta:{color:colours.muted,fontSize:9,marginTop:5},section:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1,marginBottom:8},measureCard:{minHeight:67,borderWidth:1,borderColor:colours.border,borderRadius:12,backgroundColor:colours.card,flexDirection:'row',alignItems:'center',padding:12,marginBottom:8},measureOn:{backgroundColor:colours.gold,borderColor:colours.gold},flex:{flex:1},measureTitle:{color:colours.white,fontSize:13,fontWeight:'900'},measureTitleOn:{color:colours.background},measureText:{color:colours.muted,fontSize:9,marginTop:3},measureTextOn:{color:colours.background},check:{color:colours.muted,fontSize:22},checkOn:{color:colours.background},note:{color:colours.muted,fontSize:9,lineHeight:14,marginTop:4},error:{color:colours.red,fontSize:10,marginTop:10},save:{marginTop:14}});