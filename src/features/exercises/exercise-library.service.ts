import { ExerciseDefinition, POC_EXERCISES } from '@/data/pocCatalog';
import { supabase } from '@/lib/supabase';

export type EquipmentPreferences = {
  bodyweight: boolean;
  dumbbell: boolean;
  kettlebell: boolean;
  homegym: boolean;
  fullgym: boolean;
};

export type ExerciseMeasurement = 'time' | 'reps' | 'weight' | 'distance';
export type StrengthExercise = ExerciseDefinition & {
  measurements: ExerciseMeasurement[];
  isCustom?: boolean;
};

export const DEFAULT_EQUIPMENT: EquipmentPreferences = {
  bodyweight: true,
  dumbbell: true,
  kettlebell: false,
  homegym: false,
  fullgym: true,
};

export function defaultMeasurements(exercise: ExerciseDefinition): ExerciseMeasurement[] {
  if (exercise.inputType === 'time') return ['time'];
  return exercise.equipment === 'bodyweight' ? ['reps'] : ['reps', 'weight'];
}

export async function getExerciseFavourites() {
  if (!supabase) return [] as string[];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [] as string[];
  const { data, error } = await supabase.from('exercise_favourites').select('exercise_id').eq('user_id', userData.user.id);
  if (error) throw error;
  return (data || []).map((row) => String(row.exercise_id));
}

export async function setExerciseFavourite(exerciseId: string, favourite: boolean) {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  if (favourite) {
    const { error } = await supabase.from('exercise_favourites').insert({ user_id: userData.user.id, exercise_id: exerciseId });
    if (error && error.code !== '23505') throw error;
  } else {
    const { error } = await supabase.from('exercise_favourites').delete().eq('user_id', userData.user.id).eq('exercise_id', exerciseId);
    if (error) throw error;
  }
}

export async function getEquipmentPreferences() {
  if (!supabase) return DEFAULT_EQUIPMENT;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return DEFAULT_EQUIPMENT;
  const { data, error } = await supabase.from('exercise_equipment_preferences').select('bodyweight,dumbbell,kettlebell,homegym,fullgym').eq('user_id', userData.user.id).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { error: insertError } = await supabase.from('exercise_equipment_preferences').insert({ user_id: userData.user.id, ...DEFAULT_EQUIPMENT });
    if (insertError) throw insertError;
    return DEFAULT_EQUIPMENT;
  }
  return {
    bodyweight: Boolean(data.bodyweight),
    dumbbell: Boolean(data.dumbbell),
    kettlebell: Boolean(data.kettlebell),
    homegym: Boolean(data.homegym),
    fullgym: Boolean(data.fullgym),
  } satisfies EquipmentPreferences;
}

export async function saveEquipmentPreferences(preferences: EquipmentPreferences) {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase.from('exercise_equipment_preferences').upsert({
    user_id: userData.user.id,
    ...preferences,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getStrengthExercises(): Promise<StrengthExercise[]> {
  const base = POC_EXERCISES.map((exercise) => ({ ...exercise, measurements: defaultMeasurements(exercise) }));
  if (!supabase) return base;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return base;

  const [{ data: preferences, error: prefError }, { data: custom, error: customError }] = await Promise.all([
    supabase.from('exercise_measurement_preferences').select('exercise_id,measurements').eq('user_id', userData.user.id),
    supabase.from('custom_exercises').select('id,name,muscle_group,equipment,measurements,icon,default_sets,default_reps,default_seconds').eq('user_id', userData.user.id).order('name'),
  ]);
  if (prefError) throw prefError;
  if (customError) throw customError;

  const preferenceMap = new Map((preferences || []).map((row) => [String(row.exercise_id), row.measurements as ExerciseMeasurement[]]));
  const system = base.map((exercise) => ({ ...exercise, measurements: preferenceMap.get(exercise.id) || exercise.measurements }));
  const customExercises: StrengthExercise[] = (custom || []).map((row) => {
    const measurements = (row.measurements || ['reps']) as ExerciseMeasurement[];
    return {
      id: String(row.id),
      name: String(row.name),
      group: String(row.muscle_group),
      equipment: row.equipment as ExerciseDefinition['equipment'],
      inputType: measurements.includes('time') && !measurements.includes('reps') ? 'time' : 'reps',
      icon: String(row.icon || '🏋️'),
      defaultSets: Number(row.default_sets || 3),
      defaultReps: row.default_reps == null ? undefined : Number(row.default_reps),
      defaultSeconds: row.default_seconds == null ? undefined : Number(row.default_seconds),
      secondsPerRep: 3,
      measurements,
      isCustom: true,
    };
  });
  return [...system, ...customExercises];
}

export async function saveExerciseMeasurements(exerciseId: string, measurements: ExerciseMeasurement[]) {
  if (!supabase || measurements.length === 0) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase.from('exercise_measurement_preferences').upsert({
    user_id: userData.user.id,
    exercise_id: exerciseId,
    measurements,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function saveCustomExercise(input: {
  id?: string;
  name: string;
  group: string;
  equipment: ExerciseDefinition['equipment'];
  measurements: ExerciseMeasurement[];
  icon?: string;
  defaultSets?: number;
}) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Sign in to save an exercise.');
  const payload = {
    user_id: userData.user.id,
    name: input.name.trim(),
    muscle_group: input.group.trim() || 'Other',
    equipment: input.equipment,
    measurements: input.measurements,
    icon: input.icon || '🏋️',
    default_sets: input.defaultSets || 3,
    default_reps: input.measurements.includes('reps') ? 10 : null,
    default_seconds: input.measurements.includes('time') ? 45 : null,
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await supabase.from('custom_exercises').update(payload).eq('id', input.id).eq('user_id', userData.user.id);
    if (error) throw error;
    return input.id;
  }
  const { data, error } = await supabase.from('custom_exercises').insert(payload).select('id').single();
  if (error) throw error;
  return String(data.id);
}
