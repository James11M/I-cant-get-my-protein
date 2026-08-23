import { useCallback, useEffect, useMemo, useState } from 'react';
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

  async function addFriend() {
    const cleaned = entry.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6 || busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await acceptFriendCode(cleaned);
      setEntry('');
      setMessage(result ? `${result.displayName} added as a friend.` : 'Friend added.');
      await load();
    } catch (error: any) { setMessage(error?.message || 'That code is invalid or has expired.'); }
    finally { setBusy(false); }
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
            <Text style={styles.code}>{code.slice(0,3)} {code.slice(3)}</Text>
            <Text style={styles.expiry}>EXPIRES IN {formatCountdown(secondsLeft)}</Text>
          </>
        ) : null}
        {code && !codeActive ? <Text style={styles.expired}>CODE EXPIRED</Text> : null}
        <PrimaryActionButton label={codeActive ? 'GENERATE NEW CODE' : '+ GENERATE FRIEND CODE'} onPress={generateCode} disabled={busy} style={styles.actionGap} />
      </Card>

      <Card style={styles.enterCard}>
        <Text style={styles.sectionTitle}>ENTER THEIR CODE</Text>
        <Text style={styles.body}>Enter the six digits shown on your friend's phone. This creates the friendship for both of you.</Text>
        <View style={styles.entryRow}>
          <TextInput
            style={styles.codeInput}
            value={formatEntry(entry)}
            onChangeText={(value) => setEntry(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={7}
            placeholder="123 456"
            placeholderTextColor={colours.muted}
            textContentType="oneTimeCode"
          />
          <Pressable style={[styles.inlineAdd, entry.length !== 6 && styles.disabled]} onPress={addFriend} disabled={entry.length !== 6 || busy}>
            <Text style={styles.inlineAddText}>ADD FRIEND</Text>
          </Pressable>
        </View>
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

function formatEntry(value: string) { const digits = value.replace(/\D/g, '').slice(0, 6); return digits.length > 3 ? `${digits.slice(0,3)} ${digits.slice(3)}` : digits; }
function formatCountdown(seconds: number) { const min = Math.floor(seconds / 60); const sec = String(seconds % 60).padStart(2, '0'); return `${min}:${sec}`; }
function formatDate(value: string) { const date = new Date(value); return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`; }

const styles = StyleSheet.create({
  title:{color:colours.white,fontSize:30,fontWeight:'900'}, subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:16},
  codeCard:{borderColor:colours.gold,marginBottom:10}, enterCard:{marginBottom:10}, sectionTitle:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1},
  body:{color:colours.muted,fontSize:10,lineHeight:15,marginTop:5}, code:{color:colours.white,fontSize:42,lineHeight:50,fontWeight:'900',letterSpacing:5,textAlign:'center',marginTop:15},
  expiry:{color:colours.gold,fontSize:9,fontWeight:'900',textAlign:'center',letterSpacing:1,marginTop:2}, expired:{color:colours.red,fontSize:10,fontWeight:'900',textAlign:'center',marginTop:14},
  actionGap:{marginTop:15}, entryRow:{flexDirection:'row',gap:8,marginTop:12}, codeInput:{flex:1,minHeight:50,borderWidth:1,borderColor:colours.gold,borderRadius:10,backgroundColor:colours.card2,color:colours.white,fontSize:22,fontWeight:'900',letterSpacing:3,textAlign:'center',paddingHorizontal:10},
  inlineAdd:{minWidth:110,borderRadius:10,backgroundColor:colours.gold,alignItems:'center',justifyContent:'center',paddingHorizontal:10}, inlineAddText:{color:colours.background,fontSize:9,fontWeight:'900',letterSpacing:.6}, disabled:{opacity:.4},
  message:{color:colours.gold,fontSize:10,lineHeight:15,marginVertical:5}, listTitle:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1,marginTop:8,marginBottom:8}, emptyTitle:{color:colours.white,fontSize:12,fontWeight:'900'},
  friendCard:{minHeight:70,flexDirection:'row',alignItems:'center',marginBottom:8}, flex:{flex:1}, friendName:{color:colours.white,fontSize:14,fontWeight:'900'}, friendSince:{color:colours.muted,fontSize:7,fontWeight:'800',marginTop:4},
  removeButton:{borderWidth:1,borderColor:colours.red,borderRadius:8,minHeight:34,paddingHorizontal:10,alignItems:'center',justifyContent:'center',marginLeft:10}, removeText:{color:colours.red,fontSize:8,fontWeight:'900'}
});
