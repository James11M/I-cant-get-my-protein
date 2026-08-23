import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { Screen } from '@/components/Screen';
import { createTeam, decideTeamJoinRequest, ensureTeamCode, getMyTeams, getTeamJoinRequests, leaveTeam, regenerateTeamCode, requestTeamJoin, TeamJoinRequest, TeamSummary } from '@/features/leaders/leaderboards.service';
import { colours } from '@/theme/colours';

export default function TeamsScreen() {
  const codeInputRef = useRef<TextInput>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [requests, setRequests] = useState<TeamJoinRequest[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newName, setNewName] = useState('');
  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const rows = await getMyTeams();
    setTeams(rows);
    setSelectedTeamId((current) => rows.some((team) => team.team_id === current) ? current : rows[0]?.team_id || '');
  }, []);

  useFocusEffect(useCallback(() => { load().catch(() => setMessage('Could not load teams.')); }, [load]));
  const selected = useMemo(() => teams.find((team) => team.team_id === selectedTeamId) || null, [teams, selectedTeamId]);

  useFocusEffect(useCallback(() => {
    let live = true;
    if (!selected?.is_owner) { setRequests([]); return () => { live = false; }; }
    getTeamJoinRequests(selected.team_id).then((rows) => { if (live) setRequests(rows); }).catch(() => { if (live) setRequests([]); });
    return () => { live = false; };
  }, [selected?.team_id, selected?.is_owner]));

  async function addTeam() {
    if (busy || newName.trim().length < 2) return;
    setBusy(true); setMessage('');
    try { const id = await createTeam(newName.trim()); setNewName(''); await load(); setSelectedTeamId(id); setMessage('Team created.'); }
    catch (error: any) { setMessage(error?.message || 'Could not create team.'); }
    finally { setBusy(false); }
  }

  async function showCode(regenerate = false) {
    if (!selected || busy) return;
    setBusy(true); setMessage('');
    try {
      const code = regenerate ? await regenerateTeamCode(selected.team_id) : await ensureTeamCode(selected.team_id);
      setTeams((rows) => rows.map((team) => team.team_id === selected.team_id ? { ...team, invite_code: code } : team));
      setMessage(regenerate ? 'Team code changed.' : 'Team code ready to share.');
    } catch (error: any) { setMessage(error?.message || 'Could not get team code.'); }
    finally { setBusy(false); }
  }

  async function submitJoin(value = entry) {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6 || busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await requestTeamJoin(cleaned);
      setEntry('');
      setMessage(result?.request_status === 'accepted' ? `You are already in ${result.team_name}.` : `Request sent to ${result?.team_name || 'team'}. The owner must approve you before you join.`);
    } catch (error: any) { setMessage(error?.message || 'That team code is invalid.'); }
    finally { setBusy(false); }
  }

  function changeEntry(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setEntry(cleaned);
    if (cleaned.length === 6) void submitJoin(cleaned);
  }

  async function decide(request: TeamJoinRequest, accept: boolean) {
    if (!selected || busy) return;
    setBusy(true); setMessage('');
    try {
      await decideTeamJoinRequest(selected.team_id, request.user_id, accept);
      setRequests((rows) => rows.filter((row) => row.user_id !== request.user_id));
      setMessage(accept ? `${request.display_name} joined the team.` : `${request.display_name}'s request was declined.`);
      await load();
    } catch (error: any) { setMessage(error?.message || 'Could not update request.'); }
    finally { setBusy(false); }
  }

  async function removeTeam() {
    if (!selected || busy) return;
    setBusy(true); setMessage('');
    try { await leaveTeam(selected.team_id); await load(); setMessage('You left the team.'); }
    catch (error: any) { setMessage(error?.message || 'Could not leave team.'); }
    finally { setBusy(false); }
  }

  return <Screen>
    <Brand /><BackButton /><Text style={styles.title}>Teams</Text><Text style={styles.subtitle}>Teams are private. Share a persistent six-digit code; the team owner approves every join request.</Text>

    {teams.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>{teams.map((team) => <Pressable key={team.team_id} style={[styles.pill, selectedTeamId === team.team_id && styles.pillActive]} onPress={() => setSelectedTeamId(team.team_id)}><Text style={[styles.pillText, selectedTeamId === team.team_id && styles.pillTextActive]}>{team.team_name.toUpperCase()}</Text></Pressable>)}</ScrollView> : null}

    <Card style={styles.card}><Text style={styles.section}>CREATE A TEAM</Text><View style={styles.row}><TextInput style={styles.nameInput} value={newName} onChangeText={setNewName} placeholder="Team name" placeholderTextColor={colours.muted} maxLength={40}/><Pressable style={[styles.inlineButton, newName.trim().length < 2 && styles.disabled]} onPress={() => void addTeam()} disabled={busy || newName.trim().length < 2}><Text style={styles.inlineText}>CREATE</Text></Pressable></View></Card>

    {selected ? <Card style={styles.card}>
      <Text style={styles.section}>TEAM CODE</Text><Text style={styles.body}>This code stays the same until the team owner chooses to change it, so it can be printed or shared in a newsletter.</Text>
      {selected.invite_code ? <Text style={styles.code}>{formatCode(selected.invite_code)}</Text> : null}
      <PrimaryActionButton label={selected.invite_code ? 'SHOW TEAM CODE' : 'GET TEAM CODE'} onPress={() => void showCode(false)} disabled={busy} style={styles.actionGap}/>
      {selected.is_owner && selected.invite_code ? <Pressable style={styles.outlineButton} onPress={() => void showCode(true)} disabled={busy}><Text style={styles.outlineText}>CHANGE CODE</Text></Pressable> : null}
      {!selected.is_owner ? <Pressable style={styles.removeButton} onPress={() => void removeTeam()} disabled={busy}><Text style={styles.removeText}>✕ LEAVE TEAM</Text></Pressable> : null}
    </Card> : null}

    {selected?.is_owner ? <Card style={styles.card}><Text style={styles.section}>JOIN REQUESTS</Text>{requests.length ? requests.map((request) => <View key={request.user_id} style={styles.requestRow}><View style={styles.requestCopy}><Text style={styles.requestName}>{request.display_name}</Text><Text style={styles.requestMeta}>WANTS TO JOIN</Text></View><Pressable style={styles.decline} onPress={() => void decide(request, false)}><Text style={styles.declineText}>DECLINE</Text></Pressable><Pressable style={styles.accept} onPress={() => void decide(request, true)}><Text style={styles.acceptText}>ACCEPT</Text></Pressable></View>) : <Text style={styles.body}>No pending requests.</Text>}</Card> : null}

    <Card style={styles.card}><Text style={styles.section}>ENTER TEAM CODE</Text><Text style={styles.body}>The sixth digit submits your request. You only join after the team owner accepts it.</Text><TextInput ref={codeInputRef} style={styles.hiddenInput} value={entry} onChangeText={changeEntry} keyboardType="number-pad" maxLength={6}/><Pressable style={styles.codeSlots} onPress={() => codeInputRef.current?.focus()}>{[0,1,2].map((index) => <View key={index} style={[styles.slot, entry.length === index && styles.slotActive]}><Text style={styles.slotText}>{entry[index] || '—'}</Text></View>)}<Text style={styles.hyphen}>-</Text>{[3,4,5].map((index) => <View key={index} style={[styles.slot, entry.length === index && styles.slotActive]}><Text style={styles.slotText}>{entry[index] || '—'}</Text></View>)}</Pressable></Card>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </Screen>;
}

function formatCode(code:string){return `${code.slice(0,1)} ${code.slice(1,2)} ${code.slice(2,3)} - ${code.slice(3,4)} ${code.slice(4,5)} ${code.slice(5,6)}`}

const styles=StyleSheet.create({title:{color:colours.white,fontSize:30,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:14},pills:{gap:7,paddingBottom:10,paddingRight:8},pill:{minHeight:32,borderRadius:16,borderWidth:1,borderColor:colours.border,backgroundColor:colours.card2,paddingHorizontal:13,alignItems:'center',justifyContent:'center'},pillActive:{borderColor:colours.gold},pillText:{color:colours.muted,fontSize:8,fontWeight:'900'},pillTextActive:{color:colours.gold},card:{marginBottom:10},section:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1},body:{color:colours.muted,fontSize:10,lineHeight:15,marginTop:5},row:{flexDirection:'row',gap:8,marginTop:10},nameInput:{flex:1,minHeight:44,borderRadius:10,backgroundColor:colours.card2,color:colours.white,paddingHorizontal:12},inlineButton:{minWidth:84,borderRadius:10,backgroundColor:colours.gold,alignItems:'center',justifyContent:'center'},inlineText:{color:colours.background,fontSize:9,fontWeight:'900'},disabled:{opacity:.4},code:{color:colours.white,fontSize:38,lineHeight:48,fontWeight:'900',letterSpacing:3,textAlign:'center',marginTop:13},actionGap:{marginTop:13},outlineButton:{minHeight:38,borderWidth:1,borderColor:colours.gold,borderRadius:9,alignItems:'center',justifyContent:'center',marginTop:9},outlineText:{color:colours.gold,fontSize:9,fontWeight:'900'},removeButton:{minHeight:38,borderWidth:1,borderColor:colours.red,borderRadius:9,alignItems:'center',justifyContent:'center',marginTop:9},removeText:{color:colours.red,fontSize:9,fontWeight:'900'},requestRow:{minHeight:54,flexDirection:'row',alignItems:'center',gap:7,borderTopWidth:1,borderTopColor:colours.border,marginTop:9,paddingTop:9},requestCopy:{flex:1},requestName:{color:colours.white,fontSize:11,fontWeight:'900'},requestMeta:{color:colours.muted,fontSize:7,fontWeight:'900',marginTop:3},accept:{minHeight:32,borderRadius:8,backgroundColor:colours.gold,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},acceptText:{color:colours.background,fontSize:8,fontWeight:'900'},decline:{minHeight:32,borderRadius:8,borderWidth:1,borderColor:colours.red,paddingHorizontal:8,alignItems:'center',justifyContent:'center'},declineText:{color:colours.red,fontSize:7,fontWeight:'900'},hiddenInput:{position:'absolute',opacity:0,width:1,height:1},codeSlots:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,marginTop:14},slot:{width:38,height:48,borderRadius:8,borderWidth:1,borderColor:colours.border,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center'},slotActive:{borderColor:colours.gold},slotText:{color:colours.white,fontSize:20,fontWeight:'900'},hyphen:{color:colours.gold,fontSize:22,fontWeight:'900',marginHorizontal:2},message:{color:colours.gold,fontSize:9,lineHeight:14,marginVertical:4}});
