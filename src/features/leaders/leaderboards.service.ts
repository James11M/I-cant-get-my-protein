import { supabase } from '@/lib/supabase';

export type LeaderRow = { user_id: string; display_name: string; xp: number; level: number; is_you: boolean };
export type TeamSummary = { team_id: string; team_name: string; member_count: number; is_owner: boolean; invite_code: string | null };
export type TeamJoinRequest = { user_id: string; display_name: string; requested_at: string };
export type LeaderContext = { linked_school_id: string | null; school_name: string | null; houses_enabled: boolean };
export type HouseRow = { house_name: string; xp: number };

function needSupabase() { if (!supabase) throw new Error('Supabase is not configured.'); return supabase; }

export async function getFriendLeaderboard(): Promise<LeaderRow[]> {
  const { data, error } = await needSupabase().rpc('get_friend_leaderboard');
  if (error) throw error;
  return (data || []).map(mapLeader);
}

export async function getLeaderContext(): Promise<LeaderContext> {
  const { data, error } = await needSupabase().rpc('get_leader_context');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { linked_school_id: row?.linked_school_id ? String(row.linked_school_id) : null, school_name: row?.school_name ? String(row.school_name) : null, houses_enabled: Boolean(row?.houses_enabled) };
}

export async function getSchoolLeaderboard(): Promise<LeaderRow[]> {
  const { data, error } = await needSupabase().rpc('get_school_leaderboard');
  if (error) throw error;
  return (data || []).map(mapLeader);
}

export async function getHouseLeaderboard(): Promise<HouseRow[]> {
  const { data, error } = await needSupabase().rpc('get_house_leaderboard');
  if (error) throw error;
  return (data || []).map((row: any) => ({ house_name: String(row.house_name), xp: Number(row.xp || 0) }));
}

export async function getMyTeams(): Promise<TeamSummary[]> {
  const { data, error } = await needSupabase().rpc('get_my_teams');
  if (error) throw error;
  return (data || []).map((row: any) => ({ team_id: String(row.team_id), team_name: String(row.team_name), member_count: Number(row.member_count || 0), is_owner: Boolean(row.is_owner), invite_code: row.invite_code ? String(row.invite_code) : null }));
}

export async function getTeamLeaderboard(teamId: string): Promise<LeaderRow[]> {
  const { data, error } = await needSupabase().rpc('get_team_leaderboard', { input_team_id: teamId });
  if (error) throw error;
  return (data || []).map(mapLeader);
}

export async function createTeam(name: string): Promise<string> {
  const { data, error } = await needSupabase().rpc('create_team', { team_name: name });
  if (error) throw error;
  return String(data);
}

export async function ensureTeamCode(teamId: string) {
  const { data, error } = await needSupabase().rpc('ensure_team_invite_code', { input_team_id: teamId });
  if (error) throw error;
  return String(data);
}

export async function regenerateTeamCode(teamId: string) {
  const { data, error } = await needSupabase().rpc('regenerate_team_invite_code', { input_team_id: teamId });
  if (error) throw error;
  return String(data);
}

export async function requestTeamJoin(code: string) {
  const { data, error } = await needSupabase().rpc('request_team_join', { input_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { team_id: String(row.team_id), team_name: String(row.team_name), request_status: String(row.request_status) } : null;
}

export async function getTeamJoinRequests(teamId: string): Promise<TeamJoinRequest[]> {
  const { data, error } = await needSupabase().rpc('get_team_join_requests', { input_team_id: teamId });
  if (error) throw error;
  return (data || []).map((row: any) => ({ user_id: String(row.user_id), display_name: String(row.display_name || 'User'), requested_at: String(row.requested_at) }));
}

export async function decideTeamJoinRequest(teamId: string, userId: string, accept: boolean) {
  const { error } = await needSupabase().rpc('decide_team_join_request', { input_team_id: teamId, input_user_id: userId, input_accept: accept });
  if (error) throw error;
}

export async function leaveTeam(teamId: string) {
  const { error } = await needSupabase().rpc('leave_team', { input_team_id: teamId });
  if (error) throw error;
}

function mapLeader(row: any): LeaderRow {
  return { user_id: String(row.user_id), display_name: String(row.display_name || 'User'), xp: Number(row.xp || 0), level: Number(row.level || 1), is_you: Boolean(row.is_you) };
}
