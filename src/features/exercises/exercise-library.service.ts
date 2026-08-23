import { supabase } from '@/lib/supabase';

export type EquipmentPreferences = {
  bodyweight: boolean;
  dumbbell: boolean;
  kettlebell: boolean;
  homegym: boolean;
  fullgym: boolean;
};

export const DEFAULT_EQUIPMENT: EquipmentPreferences = {
  bodyweight: true,
  dumbbell: true,
  kettlebell: false,
  homegym: false,
  fullgym: true,
};

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
    const { error } = await supabase.from('exercise_favourites').upsert({ user_id: userData.user.id, exercise_id: exerciseId });
    if (error) throw error;
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
