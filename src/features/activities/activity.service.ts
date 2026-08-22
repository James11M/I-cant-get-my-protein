import { supabase } from '@/lib/supabase';

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
  name: string;
  durationMinutes: number;
  amount?: number | null;
  unit?: string | null;
};

export async function addActivityLog(input: NewActivityLog) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('activity_logs').insert({
    user_id: input.userId,
    activity_name: input.name.trim(),
    training_type: 'general',
    duration_minutes: input.durationMinutes,
    credit_minutes: Math.min(30, input.durationMinutes),
    amount: input.amount ?? null,
    unit: input.unit?.trim() || null,
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
