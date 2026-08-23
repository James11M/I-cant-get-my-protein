import { supabase } from '@/lib/supabase';

export type Friend = {
  user_id: string;
  display_name: string;
  friends_since: string;
};

export type FriendCode = {
  code: string;
  expires_at: string;
};

export async function createFriendCode(): Promise<FriendCode> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('create_friend_code');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.code || !row?.expires_at) throw new Error('Could not create friend code.');
  return { code: String(row.code), expires_at: String(row.expires_at) };
}

export async function acceptFriendCode(code: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('accept_friend_code', { input_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { userId: String(row.friend_user_id), displayName: String(row.friend_display_name || 'Friend') } : null;
}

export async function getMyFriends(): Promise<Friend[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('get_my_friends');
  if (error) throw error;
  return (data || []).map((row: any) => ({
    user_id: String(row.user_id),
    display_name: String(row.display_name || 'Friend'),
    friends_since: String(row.friends_since),
  }));
}

export async function removeFriend(friendId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.rpc('remove_friend', { friend_id: friendId });
  if (error) throw error;
}
