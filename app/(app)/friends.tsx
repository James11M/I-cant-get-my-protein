import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { Screen } from '@/components/Screen';
import { acceptFriendCode, createFriendCode, Friend, getMyFriends, removeFriend } from '@/features/friends/friends.service';
import { colours } from '@/theme/colours';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const entryInput = useRef<TextInput>(null);

  const load = useCallback(async () => {
    try { setFriends(await getMyFriends()); } catch { setMessage('Could not load friends.'); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = useMemo(() => expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000)) : 0, [expiresAt, now]);
  const codeActive = Boolean(code && secondsLeft > 0);

  async function generateCode() {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await createFriendCode();
      setCode(result.code); setExpiresAt(result.expires_at);
    } catch (error: any) { setMessage(error?.message || 'Could not create a friend code.'); }
    finally { setBusy(false); }
  }

  async function addFriend(codeValue = entry) {
    const cleaned = codeValue.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6 || busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await acceptFriendCode(cleaned);
      setEntry('');
      setMessage(result ? `${result.displayName} added as a friend.` : 'Friend added.');
      await load();
    } catch (error: any) {
      setMessage(error?.message || 'That code is invalid or has expired.');
    } finally { setBusy(false); }
  }

  function updateEntry(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setEntry(cleaned);
    if (cleaned.length === 6 && entry.length < 6 && !busy) void addFriend(cleaned);
  }

  async function remove(friend: Friend) {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      await removeFriend(friend.user_id);
      setFriends((items) => items.filter((item) => item.user_id !== friend.user_id));
      setMessage(`${friend.display_name} removed from Friends.`);
    } catch (error: any) { setMessage(error?.message || 'Could not remove friend.'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>Add people you know using a private 6-digit code. There is no user search.</Text>

      <Card style={styles.codeCard}>
        <Text style={styles.sectionTitle}>MY FRIEND CODE</Text>
        <Text style={styles.body}>Generate a code and tell it to your friend. It expires after 5 minutes and works once.</Text>
        {codeActive ? (
          <>
            <Text style={styles.code}>{formatDisplayCode(code)}</Text>
            <Text style={styles.expiry}>EXPIRES IN {formatCountdown(secondsLeft)}</Text>
          </>
        ) : null}
        {code && !codeActive ? <Text style={styles.expired}>CODE EXPIRED</Text> : null}
        <PrimaryActionButton label={codeActive ? 'NEW FRIEND CODE' : 'GET FRIEND CODE'} onPress={generateCode} disabled={busy} style={styles.actionGap} />
      </Card>

      <Card style={styles.enterCard}>
        <Text style={styles.sectionTitle}>ENTER FRIEND CODE</Text>
        <Text style={styles.body}>Enter the six digits shown on your friend's phone. The sixth digit confirms automatically.</Text>
        <Pressable style={styles.codeEntryWrap} onPress={() => entryInput.current?.focus()}>
          <CodeSlots value={entry} />
          <TextInput
            ref={entryInput}
            style={styles.hiddenInput}
            value={entry}
            onChangeText={updateEntry}
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            caretHidden
          />
        </Pressable>
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.listTitle}>MY FRIENDS</Text>
      {friends.length === 0 ? <Card><Text style={styles.emptyTitle}>NO FRIENDS YET</Text><Text style={styles.body}>Generate a code when you are with someone you know, or enter theirs above.</Text></Card> : null}
      {friends.map((friend) => (
        <Card key={friend.user_id} style={styles.friendCard}>
          <View style={styles.flex}>
            <Text style={styles.friendName}>{friend.display_name}</Text>
            <Text style={styles.friendSince}>FRIENDS SINCE {formatDate(friend.friends_since)}</Text>
          </View>
          <Pressable style={styles.removeButton} onPress={() => void remove(friend)} disabled={busy}>
            <Text style={styles.removeText}>✕ REMOVE</Text>
          </Pressable>
        </Card>
      ))}
    </Screen>
  );
}

function CodeSlots({ value }: { value: string }) {
  const digits = value.padEnd(6, ' ').split('');
  return <View style={styles.slotsRow}>
    {digits.map((digit, index) => (
      <View key={index} style={styles.slotGroup}>
        {index === 3 ? <Text style={styles.hyphen}>-</Text> : null}
        <View style={[styles.slot, index === value.length && value.length < 6 && styles.slotActive]}>
          <Text style={styles.slotText}>{digit.trim() || '–'}</Text>
        </View>
      </View>
    ))}
  </View>;
}

function formatDisplayCode(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 6).split('');
  return `${digits.slice(0, 3).join(' ')}  -  ${digits.slice(3, 6).join(' ')}`;
}
function formatCountdown(seconds: number) { const min = Math.floor(seconds / 60); const sec = String(seconds % 60).padStart(2, '0'); return `${min}:${sec}`; }
function formatDate(value: string) { const date = new Date(value); return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`; }

const styles = StyleSheet.create({
  title:{color:colours.white,fontSize:30,fontWeight:'900'}, subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:16},
  codeCard:{borderColor:colours.gold,marginBottom:10}, enterCard:{marginBottom:10}, sectionTitle:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1},
  body:{color:colours.muted,fontSize:10,lineHeight:15,marginTop:5}, code:{color:colours.white,fontSize:34,lineHeight:44,fontWeight:'900',letterSpacing:2,textAlign:'center',marginTop:16},
  expiry:{color:colours.gold,fontSize:9,fontWeight:'900',textAlign:'center',letterSpacing:1,marginTop:2}, expired:{color:colours.red,fontSize:10,fontWeight:'900',textAlign:'center',marginTop:14},
  actionGap:{marginTop:15}, codeEntryWrap:{position:'relative',marginTop:15,minHeight:62,justifyContent:'center'}, hiddenInput:{position:'absolute',width:1,height:1,opacity:0,left:'50%',top:'50%'},
  slotsRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5}, slotGroup:{flexDirection:'row',alignItems:'center',gap:5}, slot:{width:38,height:50,borderWidth:1,borderColor:colours.border,borderRadius:9,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center'}, slotActive:{borderColor:colours.gold}, slotText:{color:colours.white,fontSize:23,fontWeight:'900'}, hyphen:{color:colours.gold,fontSize:25,fontWeight:'900',marginHorizontal:3},
  message:{color:colours.gold,fontSize:10,lineHeight:15,marginVertical:5}, listTitle:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1,marginTop:8,marginBottom:8}, emptyTitle:{color:colours.white,fontSize:12,fontWeight:'900'},
  friendCard:{minHeight:70,flexDirection:'row',alignItems:'center',marginBottom:8}, flex:{flex:1}, friendName:{color:colours.white,fontSize:14,fontWeight:'900'}, friendSince:{color:colours.muted,fontSize:7,fontWeight:'800',marginTop:4},
  removeButton:{borderWidth:1,borderColor:colours.red,borderRadius:8,minHeight:34,paddingHorizontal:10,alignItems:'center',justifyContent:'center',marginLeft:10}, removeText:{color:colours.red,fontSize:8,fontWeight:'900'}
});
