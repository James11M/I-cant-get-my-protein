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
};

export function calculateActivityCredit(activity: Activity, amount: number, minutes: number) {
  if (activity.training_type === 'Recovery') return 0;
  const target = Number(activity.default_target || 0);
  if (target <= 0) return 0;
  if (activity.measure_type === 'time') return (minutes / target) * 30;
  return (amount / target) * 30;
}

export async function getActivities(): Promise<Activity[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('activities')
    .select('id, name, icon, category, training_type, measure_type, unit, default_target, default_minutes, owner_user_id, is_system')
    .order('is_system', { ascending: false })
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getActivity(activityId: string): Promise<Activity> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('activities')
    .select('id, name, icon, category, training_type, measure_type, unit, default_target, default_minutes, owner_user_id, is_system')
    .eq('id', activityId)
    .single();
  if (error) throw error;
  return data;
}

export async function getFavouriteActivityIds(userId: string): Promise<string[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('activity_favourites')
    .select('activity_id')
    .eq('user_id', userId);
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
  });

  if (error) throw error;
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, activity_name, activity_icon, training_type, amount, unit, duration_minutes, credit_minutes, performed_at')
    .order('performed_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function removeActivityLog(logId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('activity_logs').delete().eq('id', logId);
  if (error) throw error;
}
