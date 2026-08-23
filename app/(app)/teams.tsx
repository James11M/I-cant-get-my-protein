import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { Screen } from '@/components/Screen';
import { acceptTeamCode, createTeam, createTeamCode, getMyTeams, leaveTeam, TeamSummary } from '@/features/leaders/leaderboards.service';
import { colours } from '@/theme/colours';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newName, setNewName] = useState('');
  const [entry, setEntry] = useState('');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const rows = await getMyTeams();
    setTeams(rows);
    setSelectedTeamId((current) => rows.some((team) => team.team_id === current) ? current : rows[0]?.team_id || '');
  }, []);

  useFocusEffect(useCallback(() => { load().catch(() => setMessage('Could not load teams.')); }, [load]));
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);

  const selected = useMemo(() => teams.find((team) => team.team_id === selectedTeamId) || null, [teams, selectedTeamId]);
  const secondsLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000)) : 0;
  const codeActive = Boolean(code && secondsLeft > 0);

  async function addTeam() {
    if (busy || newName.trim().length < 2) return;
    setBusy(true); setMessage('');
    try {
      const id = await createTeam(newName.trim());
      setNewName('');
      await load();
      setSelectedTeamId(id);
      setMessage('Team created.');
    } catch (error: any) { setMessage(error?.message || 'Could not create team.'); }
    finally { setBusy(false); }
  }

  async function generateCode() {
    if (!selected || busy) return;
    setBusy(true); setMessage('');
    try { const result = await createTeamCode(selected.team_id); setCode(result.code); setExpiresAt(result.expires_at); }
    catch (error: any) { setMessage(error?.message || 'Could not create team code.'); }
    finally { setBusy(false); }
  }

  async function joinTeam(value = entry) {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6 || busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await acceptTeamCode(cleaned);
      setEntry('');
      setMessage(result ? `Joined ${result.team_name}.` : 'Team joined.');
      await load();
      if (result) setSelectedTeamId(result.team_id);
    } catch (error: any) { setMessage(error?.message || 'That code is invalid or has expired.'); }
    finally { setBusy(false); }
  }

  async function removeTeam() {
    if (!selected || busy) return;
    setBusy(true); setMessage('');
    try { await leaveTeam(selected.team_id); setCode(''); setExpiresAt(null); await load(); setMessage('You left the team.'); }
    catch (error: any) { setMessage(error?.message || 'Could not leave team.'); }
    finally { setBusy(false); }
  }

  function changeEntry(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setEntry(cleaned);
    if (cleaned.length === 6) void joinTeam(cleaned);
  }

  return <Screen>
    <Brand /><BackButton /><Text style={styles.title}>Teams</Text><Text style={styles.subtitle}>Create private teams or join one using a six-digit code. Teams are never searchable.</Text>

    {teams.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
      {teams.map((team) => <Pressable key={team.team_id} style={[styles.pill, selectedTeamId === team.team_id && styles.pillActive]} onPress={() => { setSelectedTeamId(team.team_id); setCode(''); setExpiresAt(null); }}><Text style={[styles.pillText, selectedTeamId === team.team_id && styles.pillTextActive]}>{team.team_name.toUpperCase()}</Text></Pressable>)}
    </ScrollView> : null}

    <Card style={styles.card}>
      <Text style={styles.section}>CREATE A TEAM</Text>
      <View style={styles.row}><TextInput style={styles.nameInput} value={newName} onChangeText={setNewName} placeholder="Team name" placeholderTextColor={colours.muted} maxLength={40}/><Pressable style={[styles.inlineButton, newName.trim().length < 2 && styles.disabled]} onPress={() => void addTeam()} disabled={busy || newName.trim().length < 2}><Text style={styles.inlineText}>CREATE</Text></Pressable></View>
    </Card>

    {selected ? <Card style={styles.card}>
      <Text style={styles.section}>INVITE TO {selected.team_name.toUpperCase()}</Text>
      <Text style={styles.body}>Generate a one-time code. It expires after five minutes.</Text>
      {codeActive ? <><Text style={styles.code}>{code.slice(0,1)} {code.slice(1,2)} {code.slice(2,3)} - {code.slice(3,4)} {code.slice(4,5)} {code.slice(5,6)}</Text><Text style={styles.expiry}>EXPIRES IN {formatCountdown(secondsLeft)}</Text></> : null}
      {code && !codeActive ? <Text style={styles.expired}>CODE EXPIRED</Text> : null}
      <PrimaryActionButton label={codeActive ? 'NEW TEAM CODE' : 'GET TEAM CODE'} onPress={generateCode} disabled={busy} style={styles.actionGap}/>
      <Pressable style={styles.removeButton} onPress={() => void removeTeam()} disabled={busy}><Text style={styles.removeText}>✕ LEAVE TEAM</Text></Pressable>
    </Card> : null}

    <Card style={styles.card}>
      <Text style={styles.section}>ENTER TEAM CODE</Text><Text style={styles.body}>The sixth digit joins the team automatically.</Text>
      <TextInput style={styles.hiddenInput} value={entry} onChangeText={changeEntry} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" />
      <Pressable style={styles.codeSlots} onPress={() => {}}>
        {[0,1,2,3,4,5].map((index) => <View key={index} style={[styles.slot, entry.length === index && styles.slotActive]}><Text style={styles.slotText}>{entry[index] || '—'}</Text></View>)}
        <Text style={styles.hyphen}>-</Text>
      </Pressable>
      <Text style={styles.inputHint}>Tap the code area, then type six digits.</Text>
    </Card>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </Screen>;
}

function formatCountdown(seconds:number){const min=Math.floor(seconds/60);const sec=String(seconds%60).padStart(2,'0');return `${min}:${sec}`}

const styles=StyleSheet.create({
  title:{color:colours.white,fontSize:30,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:14},pills:{gap:7,paddingBottom:10,paddingRight:8},pill:{minHeight:32,borderRadius:16,borderWidth:1,borderColor:colours.border,backgroundColor:colours.card2,paddingHorizontal:13,alignItems:'center',justifyContent:'center'},pillActive:{borderColor:colours.gold},pillText:{color:colours.muted,fontSize:8,fontWeight:'900'},pillTextActive:{color:colours.gold},card:{marginBottom:10},section:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1},body:{color:colours.muted,fontSize:10,lineHeight:15,marginTop:5},row:{flexDirection:'row',gap:8,marginTop:10},nameInput:{flex:1,minHeight:44,borderRadius:10,backgroundColor:colours.card2,color:colours.white,paddingHorizontal:12},inlineButton:{minWidth:84,borderRadius:10,backgroundColor:colours.gold,alignItems:'center',justifyContent:'center'},inlineText:{color:colours.background,fontSize:9,fontWeight:'900'},disabled:{opacity:.4},code:{color:colours.white,fontSize:38,lineHeight:48,fontWeight:'900',letterSpacing:3,textAlign:'center',marginTop:13},expiry:{color:colours.gold,fontSize:8,fontWeight:'900',textAlign:'center'},expired:{color:colours.red,fontSize:9,fontWeight:'900',textAlign:'center',marginTop:12},actionGap:{marginTop:13},removeButton:{minHeight:38,borderWidth:1,borderColor:colours.red,borderRadius:9,alignItems:'center',justifyContent:'center',marginTop:9},removeText:{color:colours.red,fontSize:9,fontWeight:'900'},hiddenInput:{position:'absolute',opacity:0,width:1,height:1},codeSlots:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,marginTop:14,position:'relative'},slot:{width:38,height:48,borderRadius:8,borderWidth:1,borderColor:colours.border,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center'},slotActive:{borderColor:colours.gold},slotText:{color:colours.white,fontSize:20,fontWeight:'900'},hyphen:{position:'absolute',color:colours.gold,fontSize:22,fontWeight:'900',left:'48%',top:10},inputHint:{color:colours.muted,fontSize:8,textAlign:'center',marginTop:8},message:{color:colours.gold,fontSize:9,lineHeight:14,marginVertical:4}
});
