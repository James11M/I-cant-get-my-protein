import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { getFriendLeaderboard, getHouseLeaderboard, getLeaderContext, getMyTeams, getSchoolLeaderboard, getTeamLeaderboard, HouseRow, LeaderContext, LeaderRow, TeamSummary } from '@/features/leaders/leaderboards.service';
import { colours } from '@/theme/colours';

type Group = 'Friends' | 'Teams' | 'Houses' | 'School';

export function LeaderboardPanel() {
  const [group, setGroup] = useState<Group>('Friends');
  const [context, setContext] = useState<LeaderContext>({ linked_school_id: null, school_name: null, houses_enabled: false });
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [houses, setHouses] = useState<HouseRow[]>([]);
  const [message, setMessage] = useState('');

  const groups = useMemo<Group[]>(() => {
    const rows: Group[] = ['Friends', 'Teams'];
    if (context.houses_enabled && context.linked_school_id) rows.push('Houses');
    if (context.linked_school_id) rows.push('School');
    return rows;
  }, [context]);

  const loadContext = useCallback(async () => {
    const [ctx, teamRows] = await Promise.all([getLeaderContext(), getMyTeams()]);
    setContext(ctx);
    setTeams(teamRows);
    setSelectedTeamId((current) => teamRows.some((team) => team.team_id === current) ? current : teamRows[0]?.team_id || '');
    setGroup((current) => {
      const allowed: Group[] = ['Friends','Teams',...(ctx.houses_enabled && ctx.linked_school_id ? ['Houses' as const] : []),...(ctx.linked_school_id ? ['School' as const] : [])];
      return allowed.includes(current) ? current : 'Friends';
    });
  }, []);

  useFocusEffect(useCallback(() => { loadContext().catch(() => setMessage('Could not load leaderboard options.')); }, [loadContext]));

  useEffect(() => {
    let live = true;
    setMessage('');
    async function loadRows() {
      if (group === 'Houses') {
        const rows = await getHouseLeaderboard();
        if (live) { setHouses(rows); setLeaders([]); }
        return;
      }
      let rows: LeaderRow[] = [];
      if (group === 'Friends') rows = await getFriendLeaderboard();
      if (group === 'School') rows = await getSchoolLeaderboard();
      if (group === 'Teams' && selectedTeamId) rows = await getTeamLeaderboard(selectedTeamId);
      if (live) { setLeaders(rows); setHouses([]); }
    }
    loadRows().catch(() => { if (live) { setLeaders([]); setHouses([]); setMessage('Could not load this leaderboard.'); } });
    return () => { live = false; };
  }, [group, selectedTeamId]);

  return <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groups}>
      {groups.map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[styles.groupPill, group === item && styles.groupPillActive]}><Text style={[styles.groupText, group === item && styles.groupTextActive]}>{item.toUpperCase()}</Text></Pressable>)}
    </ScrollView>

    {group === 'Teams' && teams.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamPills}>
      {teams.map((team) => <Pressable key={team.team_id} onPress={() => setSelectedTeamId(team.team_id)} style={[styles.teamPill, selectedTeamId === team.team_id && styles.teamPillActive]}><Text style={[styles.teamPillText, selectedTeamId === team.team_id && styles.teamPillTextActive]}>{team.team_name.toUpperCase()}</Text></Pressable>)}
    </ScrollView> : null}

    {group === 'School' && context.school_name ? <Text style={styles.contextLabel}>{context.school_name.toUpperCase()}</Text> : null}

    {message ? <Text style={styles.message}>{message}</Text> : null}

    <View style={styles.leaderList}>
      {group === 'Houses' ? houses.map((row, index) => <Card key={row.house_name} style={styles.leaderCard}><Text style={styles.rank}>{index + 1}</Text><View style={styles.leaderCopy}><Text style={styles.leaderName}>{row.house_name}</Text></View><Text style={styles.leaderXp}>{row.xp.toLocaleString()} XP</Text></Card>) : leaders.map((row, index) => <Card key={row.user_id} style={[styles.leaderCard, row.is_you && styles.youCard]}>
        <Text style={styles.rank}>{index + 1}</Text>
        <View style={styles.leaderCopy}><Text style={styles.leaderName}>{row.display_name}{row.is_you ? ' • YOU' : ''}</Text><Text style={styles.level}>LEVEL {row.level}</Text></View>
        <Text style={styles.leaderXp}>{row.xp.toLocaleString()} XP</Text>
      </Card>)}
    </View>

    {group === 'Friends' && !leaders.length ? <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>NO FRIENDS YET</Text><Text style={styles.emptyText}>Add someone you know using a private six-digit friend code.</Text></Card> : null}
    {group === 'Teams' && !teams.length ? <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>NO TEAMS YET</Text><Text style={styles.emptyText}>Create a private team or join one with a six-digit team code.</Text></Card> : null}
    {group === 'Houses' && !houses.length ? <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>NO HOUSE RESULTS YET</Text><Text style={styles.emptyText}>House competition is enabled, but pupils still need to be assigned to houses.</Text></Card> : null}

    {group === 'Friends' ? <PrimaryActionButton label="+ ADD FRIEND" onPress={() => router.push('/(app)/friends')} style={styles.bottomAction} /> : null}
    {group === 'Teams' ? <PrimaryActionButton label="+ ADD TEAM" onPress={() => router.push('/(app)/teams')} style={styles.bottomAction} /> : null}
  </>;
}

const styles=StyleSheet.create({
  groups:{gap:6,paddingBottom:11,paddingRight:8},groupPill:{minHeight:32,borderRadius:16,backgroundColor:colours.card2,borderWidth:1,borderColor:'transparent',paddingHorizontal:15,alignItems:'center',justifyContent:'center'},groupPillActive:{borderColor:colours.gold},groupText:{color:colours.muted,fontSize:8,fontWeight:'900'},groupTextActive:{color:colours.gold},
  teamPills:{gap:7,paddingBottom:11,paddingRight:8},teamPill:{minHeight:30,borderRadius:15,borderWidth:1,borderColor:colours.border,backgroundColor:colours.card,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},teamPillActive:{backgroundColor:colours.gold,borderColor:colours.gold},teamPillText:{color:colours.muted,fontSize:8,fontWeight:'900'},teamPillTextActive:{color:colours.background},contextLabel:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:.8,marginBottom:9},
  leaderList:{gap:8},leaderCard:{minHeight:66,paddingVertical:11,flexDirection:'row',alignItems:'center'},youCard:{borderColor:colours.gold},rank:{color:colours.gold,fontSize:20,fontWeight:'900',width:31},leaderCopy:{flex:1},leaderName:{color:colours.white,fontSize:13,fontWeight:'900'},level:{color:colours.muted,fontSize:8,fontWeight:'900',marginTop:3,letterSpacing:.5},leaderXp:{color:colours.white,fontSize:11,fontWeight:'900'},
  emptyCard:{marginTop:2},emptyTitle:{color:colours.white,fontSize:12,fontWeight:'900'},emptyText:{color:colours.muted,fontSize:9,lineHeight:14,marginTop:4},bottomAction:{marginTop:12},message:{color:colours.gold,fontSize:9,lineHeight:14,marginBottom:8}
});
