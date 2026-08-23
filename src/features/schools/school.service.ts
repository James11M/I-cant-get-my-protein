import { supabase } from '@/lib/supabase';

export type School = {
  id: string;
  name: string;
  school_mode: 'boarding' | 'day' | 'hybrid' | null;
};

export type SchoolCalendarEntry = {
  id: string;
  organisation_id: string;
  entry_type: 'term' | 'half_term' | 'exeat' | 'inset';
  name: string;
  start_date: string;
  end_date: string;
};

export async function getSubscribedSchools(): Promise<School[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('organisations')
    .select('id,name,school_mode')
    .eq('organisation_type', 'school')
    .eq('is_subscribed', true)
    .order('name');
  if (error) throw error;
  return (data || []) as School[];
}

export async function getSchoolCalendar(schoolId: string): Promise<SchoolCalendarEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('school_calendar_entries')
    .select('id,organisation_id,entry_type,name,start_date,end_date')
    .eq('organisation_id', schoolId)
    .order('start_date');
  if (error) throw error;
  return (data || []) as SchoolCalendarEntry[];
}

export async function getLinkedSchool(): Promise<{ school: School | null; calendar: SchoolCalendarEntry[] }> {
  if (!supabase) return { school: null, calendar: [] };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { school: null, calendar: [] };
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('linked_school_id')
    .eq('id', userData.user.id)
    .single();
  if (profileError) throw profileError;
  if (!profile?.linked_school_id) return { school: null, calendar: [] };

  const { data: schoolData, error: schoolError } = await supabase
    .from('organisations')
    .select('id,name,school_mode')
    .eq('id', profile.linked_school_id)
    .single();
  if (schoolError) throw schoolError;
  const calendar = await getSchoolCalendar(profile.linked_school_id);
  return { school: schoolData as School, calendar };
}

export async function linkSchool(schoolId: string | null) {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase.from('profiles').update({ linked_school_id: schoolId }).eq('id', userData.user.id);
  if (error) throw error;
}

export function isSchoolTermTime(calendar: SchoolCalendarEntry[], date = new Date()) {
  const day = toIsoDate(date);
  const inTerm = calendar.some((entry) => entry.entry_type === 'term' && day >= entry.start_date && day <= entry.end_date);
  if (!inTerm) return false;
  const inException = calendar.some((entry) => entry.entry_type !== 'term' && day >= entry.start_date && day <= entry.end_date);
  return !inException;
}

export function formatSchoolDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
