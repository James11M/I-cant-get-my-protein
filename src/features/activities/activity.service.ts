import { supabase } from '@/lib/supabase';

export type Activity = {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  training_type: string;
  measure_type: string;
  unit: string;
  default_target: number | null;
  default_minutes: number | null;
  owner_user_id: string | null;
  is_system: boolean;
};

export type ActivityLog = {
  id: string;
  activity_id: string | null;
  activity_name: string;
  activity_icon: string | null;
  training_type: string;
  amount: number | null;
  unit: string | null;
  duration_minutes: number;
  credit_minutes: number;
  performed_at: string;
};

type NewActivityLog = {
  userId: string;
  activity: Activity;
  durationMinutes: number;
  amount: number;
  performedAt?: string;
};

type NewSimpleActivityLog = {
  userId: string;
  name: string;
  icon?: string | null;
  trainingType?: string;
  durationMinutes: number;
  creditMinutes?: number;
  performedAt?: string;
};

type CustomActivityInput = {
  name: string;
  icon: string;
};

const ACTIVITY_FIELDS = 'id, name, icon, category, training_type, measure_type, unit, default_target, default_minutes, owner_user_id, is_system';

export function calculateActivityCredit(activity: Activity, amount: number, minutes: number) {
  if (activity.training_type === 'Recovery') return 0;
  const target = Number(activity.default_target || 0);
  if (target <= 0) return 0;
  if (activity.measure_type === 'time') return (minutes / target) * 30;
  return (amount / target) * 30;
}

export async function getAllActivities(): Promise<Activity[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('activities').select(ACTIVITY_FIELDS).order('is_system', { ascending: false }).order('name');
  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function getHiddenActivityIds(): Promise<string[]> {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase.from('activity_visibility_preferences').select('activity_id').eq('user_id', userData.user.id).eq('hidden', true);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.activity_id));
}

export async function getActivities(): Promise<Activity[]> {
  const [activities, hidden] = await Promise.all([getAllActivities(), getHiddenActivityIds()]);
  const hiddenSet = new Set(hidden);
  return activities.filter((activity) => !hiddenSet.has(activity.id));
}

export async function getActivity(activityId: string): Promise<Activity> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('activities').select(ACTIVITY_FIELDS).eq('id', activityId).single();
  if (error) throw error;
  return data as Activity;
}

export async function createCustomActivity(input: CustomActivityInput): Promise<Activity> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('You must be signed in.');
  const { data, error } = await supabase.from('activities').insert({
    name: input.name.trim(),
    icon: input.icon.trim() || '⭐',
    category: 'Sport',
    training_type: 'Sport',
    measure_type: 'time',
    unit: 'min',
    default_target: 30,
    default_minutes: 30,
    owner_user_id: userData.user.id,
    organisation_id: null,
    is_system: false,
  }).select(ACTIVITY_FIELDS).single();
  if (error) throw error;
  return data as Activity;
}

export async function updateOwnActivity(activityId: string, input: CustomActivityInput) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('You must be signed in.');
  const { error } = await supabase.from('activities').update({ name: input.name.trim(), icon: input.icon.trim() || '⭐' }).eq('id', activityId).eq('owner_user_id', userData.user.id).eq('is_system', false);
  if (error) throw error;
}

export async function setActivityHidden(activityId: string, hidden: boolean) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('You must be signed in.');
  if (hidden) {
    const { error } = await supabase.from('activity_visibility_preferences').upsert({ user_id: userData.user.id, activity_id: activityId, hidden: true, updated_at: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('activity_visibility_preferences').delete().eq('user_id', userData.user.id).eq('activity_id', activityId);
  if (error) throw error;
}

export async function getFavouriteActivityIds(userId: string): Promise<string[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('activity_favourites').select('activity_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.activity_id);
}

export async function setActivityFavourite(userId: string, activityId: string, favourite: boolean) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (favourite) {
    const { error } = await supabase.from('activity_favourites').upsert({ user_id: userId, activity_id: activityId });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('activity_favourites').delete().eq('user_id', userId).eq('activity_id', activityId);
  if (error) throw error;
}

export async function addActivityLog(input: NewActivityLog) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const credit = calculateActivityCredit(input.activity, input.amount, input.durationMinutes);
  const { error } = await supabase.from('activity_logs').insert({
    user_id: input.userId,
    activity_id: input.activity.id,
    activity_name: input.activity.name,
    activity_icon: input.activity.icon,
    training_type: input.activity.training_type,
    duration_minutes: input.durationMinutes,
    credit_minutes: credit,
    amount: input.activity.measure_type === 'time' ? input.durationMinutes : input.amount,
    unit: input.activity.measure_type === 'time' ? 'min' : input.activity.unit,
    ...(input.performedAt ? { performed_at: input.performedAt } : {}),
  });
  if (error) throw error;
}

export async function addSimpleActivityLog(input: NewSimpleActivityLog) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('activity_logs').insert({
    user_id: input.userId,
    activity_id: null,
    activity_name: input.name,
    activity_icon: input.icon ?? '🏋️',
    training_type: input.trainingType ?? 'Strength',
    duration_minutes: input.durationMinutes,
    credit_minutes: input.creditMinutes ?? input.durationMinutes,
    amount: input.durationMinutes,
    unit: 'min',
    ...(input.performedAt ? { performed_at: input.performedAt } : {}),
  });
  if (error) throw error;
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('activity_logs').select('id, activity_id, activity_name, activity_icon, training_type, amount, unit, duration_minutes, credit_minutes, performed_at').order('performed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getActivityLog(logId: string): Promise<ActivityLog> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('activity_logs').select('id, activity_id, activity_name, activity_icon, training_type, amount, unit, duration_minutes, credit_minutes, performed_at').eq('id', logId).single();
  if (error) throw error;
  return data;
}

export async function updateActivityLog(logId: string, activity: Activity | null, durationMinutes: number, amount: number) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const credit = activity ? calculateActivityCredit(activity, amount, durationMinutes) : durationMinutes;
  const { error } = await supabase.from('activity_logs').update({
    duration_minutes: durationMinutes,
    credit_minutes: credit,
    amount: activity?.measure_type === 'time' || !activity ? durationMinutes : amount,
    unit: activity?.measure_type === 'time' || !activity ? 'min' : activity.unit,
  }).eq('id', logId);
  if (error) throw error;
}

export async function removeActivityLog(logId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('activity_logs').delete().eq('id', logId);
  if (error) throw error;
}
