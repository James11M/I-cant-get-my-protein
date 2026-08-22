import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EQUIPMENT_LABELS, ExerciseDefinition, POC_EXERCISES } from '@/data/pocCatalog';
import { addActivityLog } from '@/features/activities/activity.service';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

type WorkoutSet = { reps: string; seconds: string; weight: string };
type WorkoutExercise = { definition: ExerciseDefinition; sets: WorkoutSet[] };

export default function WorkoutScreen() {
  const { session } = useAuth();
  const [workout, setWorkout] = useState<WorkoutExercise[]>([]);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<'all' | ExerciseDefinition['equipment']>('all');
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  const seconds = useMemo(() => estimateSeconds(workout), [workout]);
  const minutes = Math.max(1, Math.round(seconds / 60));
  const setCount = workout.reduce((sum, item) => sum + item.sets.length, 0);

  const filtered = POC_EXERCISES.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesEquipment = equipment === 'all' || item.equipment === equipment;
    return matchesQuery && matchesEquipment;
  }).slice(0, 24);

  function addExercise(definition: ExerciseDefinition) {
    const sets = Array.from({ length: definition.defaultSets }, () => ({
      reps: String(definition.defaultReps ?? 10),
      seconds: String(definition.defaultSeconds ?? 45),
      weight: '',
    }));
    setWorkout((current) => [...current, { definition, sets }]);
    setAdding(false);
    setQuery('');
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: string) {
    setWorkout((current) => current.map((exercise, index) => index !== exerciseIndex ? exercise : {
      ...exercise,
      sets: exercise.sets.map((set, innerIndex) => innerIndex === setIndex ? { ...set, [field]: value } : set),
    }));
  }

  function addSet(exerciseIndex: number) {
    setWorkout((current) => current.map((exercise, index) => index !== exerciseIndex ? exercise : {
      ...exercise,
      sets: [...exercise.sets, { reps: String(exercise.definition.defaultReps ?? 10), seconds: String(exercise.definition.defaultSeconds ?? 45), weight: '' }],
    }));
  }

  function removeExercise(exerciseIndex: number) {
    setWorkout((current) => current.filter((_, index) => index !== exerciseIndex));
  }

  async function finishWorkout() {
    if (workout.length === 0) {
      setComplete(true);
      return;
    }
    setSaving(true);
    try {
      if (session?.user.id) {
        await addActivityLog({ userId: session.user.id, name: 'Strength Training', durationMinutes: minutes });
      }
      setComplete(true);
    } finally {
      setSaving(false);
    }
  }

  if (complete) {
    return (
      <Screen>
        <Brand />
        <View style={styles.completeHero}>
          <Text style={styles.completeEmoji}>🏋️</Text>
          <Text style={styles.completeTitle}>WORKOUT COMPLETE</Text>
        </View>
        <Card>
          <View style={styles.statsRow}>
            <Stat label="MIN" value={minutes} />
            <Stat label="EXERCISES" value={workout.length} />
            <Stat label="SETS" value={setCount} />
          </View>
        </Card>
        <Card style={styles.sectionGap}>
          <Text style={styles.sectionTitle}>SAVE AS TEMPLATE</Text>
          <TextInput style={styles.input} value={templateName} onChangeText={setTemplateName} placeholder="e.g. Saturday Gym" placeholderTextColor={colours.muted} />
          <Pressable style={[styles.finish, !templateName.trim() && styles.disabled]} disabled={!templateName.trim()} onPress={() => setTemplateSaved(true)}>
            <Text style={styles.finishText}>{templateSaved ? 'TEMPLATE SAVED' : 'SAVE TEMPLATE'}</Text>
          </Pressable>
        </Card>
        <Pressable style={styles.outline} onPress={() => router.replace('/(app)/index')}><Text style={styles.outlineText}>DONE</Text></Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Workout</Text>
      <Text style={styles.subtitle}>Estimated duration: {minutes} min</Text>

      {workout.map((exercise, exerciseIndex) => (
        <Card key={`${exercise.definition.id}-${exerciseIndex}`} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseIcon}><Text style={styles.exerciseEmoji}>{exercise.definition.icon}</Text></View>
            <View style={styles.flex}>
              <Text style={styles.exerciseTitle}>{exercise.definition.name}</Text>
              <Text style={styles.meta}>{EQUIPMENT_LABELS[exercise.definition.equipment]} • {exercise.definition.group}</Text>
            </View>
            <Pressable onPress={() => removeExercise(exerciseIndex)}><Text style={styles.remove}>×</Text></Pressable>
          </View>

          <View style={styles.setHead}>
            <Text style={[styles.setHeadText, styles.setNumber]}>SET</Text>
            <Text style={[styles.setHeadText, styles.setField]}>{exercise.definition.inputType === 'reps' ? 'REPS' : 'SEC'}</Text>
            <Text style={[styles.setHeadText, styles.setField]}>WEIGHT</Text>
          </View>
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <Text style={[styles.setIndex, styles.setNumber]}>{setIndex + 1}</Text>
              <TextInput
                style={[styles.setInput, styles.setField]}
                keyboardType="numeric"
                value={exercise.definition.inputType === 'reps' ? set.reps : set.seconds}
                onChangeText={(value) => updateSet(exerciseIndex, setIndex, exercise.definition.inputType === 'reps' ? 'reps' : 'seconds', value)}
              />
              <TextInput style={[styles.setInput, styles.setField]} keyboardType="decimal-pad" value={set.weight} onChangeText={(value) => updateSet(exerciseIndex, setIndex, 'weight', value)} placeholder="—" placeholderTextColor={colours.muted} />
            </View>
          ))}
          <Pressable style={styles.addSet} onPress={() => addSet(exerciseIndex)}><Text style={styles.addSetText}>+ ADD SET</Text></Pressable>
        </Card>
      ))}

      {adding ? (
        <Card style={styles.pickerCard}>
          <Text style={styles.sectionTitle}>ADD EXERCISE</Text>
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search exercise…" placeholderTextColor={colours.muted} />
          <View style={styles.pills}>
            {(['all','bodyweight','dumbbell','kettlebell','fullgym'] as const).map((item) => (
              <Pressable key={item} style={[styles.pill, equipment === item && styles.pillActive]} onPress={() => setEquipment(item)}>
                <Text style={[styles.pillText, equipment === item && styles.pillTextActive]}>{item === 'all' ? 'ALL' : EQUIPMENT_LABELS[item]}</Text>
              </Pressable>
            ))}
          </View>
          {filtered.map((item) => (
            <Pressable key={item.id} style={styles.exerciseChoice} onPress={() => addExercise(item)}>
              <Text style={styles.choiceEmoji}>{item.icon}</Text>
              <View style={styles.flex}><Text style={styles.choiceTitle}>{item.name}</Text><Text style={styles.meta}>{EQUIPMENT_LABELS[item.equipment]} • {item.inputType === 'reps' ? 'Reps' : 'Timed'}</Text></View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancel} onPress={() => setAdding(false)}><Text style={styles.cancelText}>CANCEL</Text></Pressable>
        </Card>
      ) : (
        <Pressable style={styles.outline} onPress={() => setAdding(true)}><Text style={styles.outlineText}>+  ADD EXERCISE</Text></Pressable>
      )}

      <Pressable style={[styles.finish, saving && styles.disabled]} disabled={saving} onPress={finishWorkout}><Text style={styles.finishText}>{saving ? 'SAVING…' : 'FINISH'}</Text></Pressable>
      <View style={styles.spacer} />
    </Screen>
  );
}

function estimateSeconds(workout: WorkoutExercise[]) {
  let total = 60;
  workout.forEach((exercise, exerciseIndex) => {
    exercise.sets.forEach((set, setIndex) => {
      if (exercise.definition.inputType === 'reps') total += (Number(set.reps) || 0) * (exercise.definition.secondsPerRep || 3);
      else total += Number(set.seconds) || 0;
      if (setIndex < exercise.sets.length - 1) total += 60;
    });
    if (exerciseIndex < workout.length - 1) total += 45;
  });
  return total;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { color: colours.white, fontSize: 31, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, fontWeight: '700', marginTop: 5, marginBottom: 18 },
  sectionTitle: { color: colours.white, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  exerciseCard: { marginBottom: 10 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: colours.card2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  exerciseEmoji: { color: colours.gold, fontSize: 20, fontWeight: '900' },
  exerciseTitle: { color: colours.white, fontSize: 13, fontWeight: '900' },
  meta: { color: colours.muted, fontSize: 7, fontWeight: '800', marginTop: 3 },
  remove: { color: colours.muted, fontSize: 26, paddingHorizontal: 5 },
  setHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  setHeadText: { color: colours.muted, fontSize: 7, fontWeight: '900', textAlign: 'center' },
  setNumber: { width: 38 },
  setField: { flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  setIndex: { color: colours.white, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  setInput: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 8, color: colours.white, minHeight: 38, marginHorizontal: 4, paddingHorizontal: 8, textAlign: 'center', fontWeight: '900' },
  addSet: { borderTopWidth: 1, borderTopColor: colours.border, marginTop: 12, paddingTop: 10, alignItems: 'center' },
  addSetText: { color: colours.gold, fontSize: 9, fontWeight: '900' },
  outline: { borderWidth: 1, borderColor: colours.gold, borderRadius: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  outlineText: { color: colours.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  finish: { backgroundColor: colours.gold, borderRadius: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  finishText: { color: colours.background, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  disabled: { opacity: 0.45 },
  pickerCard: { borderColor: colours.gold, marginBottom: 10 },
  input: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 10, color: colours.white, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginVertical: 9 },
  pill: { backgroundColor: colours.card2, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 },
  pillActive: { backgroundColor: colours.gold },
  pillText: { color: colours.muted, fontSize: 7, fontWeight: '900' },
  pillTextActive: { color: colours.background },
  exerciseChoice: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colours.border },
  choiceEmoji: { width: 35, color: colours.gold, fontSize: 18, fontWeight: '900' },
  choiceTitle: { color: colours.white, fontSize: 10, fontWeight: '900' },
  arrow: { color: colours.gold, fontSize: 22 },
  cancel: { alignItems: 'center', paddingTop: 11 },
  cancelText: { color: colours.muted, fontSize: 9, fontWeight: '900' },
  completeHero: { alignItems: 'center', paddingVertical: 20 },
  completeEmoji: { fontSize: 42 },
  completeTitle: { color: colours.gold, fontSize: 18, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: colours.white, fontSize: 25, fontWeight: '900' },
  statLabel: { color: colours.muted, fontSize: 8, fontWeight: '900', marginTop: 3 },
  sectionGap: { marginTop: 10, marginBottom: 10 },
  spacer: { height: 12 },
});
