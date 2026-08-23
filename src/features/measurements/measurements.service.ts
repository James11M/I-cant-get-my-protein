import { supabase } from '@/lib/supabase';

export type MeasurementType =
  | 'Weight' | 'Body Fat' | 'Neck' | 'Shoulders' | 'Chest' | 'Left Bicep' | 'Right Bicep'
  | 'Left Forearm' | 'Right Forearm' | 'Upper Abs' | 'Waist' | 'Lower Abs' | 'Hips'
  | 'Left Thigh' | 'Right Thigh' | 'Left Calf' | 'Right Calf';

export type MeasurementEntry = {
  id: string;
  measurement_type: MeasurementType;
  value: number;
  unit: string;
  measured_at: string;
};

export type MeasurementSummary = {
  type: MeasurementType;
  unit: string;
  isCore: boolean;
  target: number | null;
  entries: MeasurementEntry[];
  current: number | null;
};

export const ALL_MEASUREMENTS: MeasurementType[] = [
  'Weight','Body Fat','Neck','Shoulders','Chest','Left Bicep','Right Bicep','Left Forearm','Right Forearm',
  'Upper Abs','Waist','Lower Abs','Hips','Left Thigh','Right Thigh','Left Calf','Right Calf',
];

export const DEFAULT_CORE: MeasurementType[] = ['Weight', 'Body Fat'];

export function unitFor(type: MeasurementType) {
  if (type === 'Weight') return 'kg';
  if (type === 'Body Fat') return '%';
  return 'cm';
}

export async function getMeasurementSummaries(): Promise<MeasurementSummary[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Authentication required.');

  const [entriesResult, preferencesResult, settingsResult, profileResult] = await Promise.all([
    supabase.from('measurement_entries').select('id,measurement_type,value,unit,measured_at').eq('user_id', user.id).order('measured_at', { ascending: true }),
    supabase.from('core_measurement_preferences').select('measurement_type,is_core,target_value').eq('user_id', user.id),
    supabase.from('user_settings').select('target_weight_kg,target_body_fat_percent').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('current_weight_kg').eq('id', user.id).single(),
  ]);
  if (entriesResult.error) throw entriesResult.error;
  if (preferencesResult.error) throw preferencesResult.error;

  const preferences = new Map((preferencesResult.data || []).map((row: any) => [String(row.measurement_type), row]));
  const grouped = new Map<MeasurementType, MeasurementEntry[]>();
  for (const type of ALL_MEASUREMENTS) grouped.set(type, []);
  for (const row of entriesResult.data || []) {
    const type = String(row.measurement_type) as MeasurementType;
    if (!grouped.has(type)) continue;
    grouped.get(type)!.push({ id: String(row.id), measurement_type: type, value: Number(row.value), unit: String(row.unit), measured_at: String(row.measured_at) });
  }

  // Preserve existing profile weight as a fallback until a first historical Weight entry is created.
  if ((grouped.get('Weight') || []).length === 0 && profileResult.data?.current_weight_kg != null) {
    grouped.set('Weight', [{ id: 'profile-weight', measurement_type: 'Weight', value: Number(profileResult.data.current_weight_kg), unit: 'kg', measured_at: user.created_at }]);
  }

  return ALL_MEASUREMENTS.map((type) => {
    const pref: any = preferences.get(type);
    const entries = grouped.get(type) || [];
    const defaultTarget = type === 'Weight' ? settingsResult.data?.target_weight_kg : type === 'Body Fat' ? settingsResult.data?.target_body_fat_percent : null;
    const target = pref?.target_value != null ? Number(pref.target_value) : defaultTarget != null ? Number(defaultTarget) : null;
    return {
      type,
      unit: unitFor(type),
      isCore: pref ? Boolean(pref.is_core) : DEFAULT_CORE.includes(type),
      target,
      entries,
      current: entries.length ? entries[entries.length - 1].value : null,
    };
  });
}

export async function setCoreMeasurement(type: MeasurementType, isCore: boolean) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Authentication required.');
  const { error } = await supabase.from('core_measurement_preferences').upsert({ user_id: userData.user.id, measurement_type: type, is_core: isCore, updated_at: new Date().toISOString() }, { onConflict: 'user_id,measurement_type' });
  if (error) throw error;
}

export async function saveMeasurement(type: MeasurementType, value: number) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Authentication required.');
  const unit = unitFor(type);
  const { error } = await supabase.from('measurement_entries').insert({ user_id: userData.user.id, measurement_type: type, value, unit, measured_at: new Date().toISOString() });
  if (error) throw error;
  if (type === 'Weight') {
    const { error: profileError } = await supabase.from('profiles').update({ current_weight_kg: value }).eq('id', userData.user.id);
    if (profileError) throw profileError;
  }
}
