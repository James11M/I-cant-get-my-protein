import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || !live) return;
      setEmail(user.email || '');
      const { data } = await supabase.from('profiles').select('display_name,date_of_birth').eq('id', user.id).single();
      if (!live || !data) return;
      setDisplayName(data.display_name || '');
      setDateOfBirth(isoDateToUk(data.date_of_birth || ''));
    }
    load().catch(() => { if (live) setMessage('Could not load profile.'); });
    return () => { live = false; };
  }, []));

  const isoDob = ukDateToIso(dateOfBirth);
  const validDob = Boolean(isoDob);

  async function save() {
    if (!supabase || !isoDob) return;
    setBusy(true);
    setMessage('');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setBusy(false);
      setMessage('Could not find your account.');
      return;
    }
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim(),
      date_of_birth: isoDob,
    }).eq('id', userData.user.id);
    setBusy(false);
    setMessage(error ? error.message : 'Profile saved.');
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Profile & Account</Text>
      <Text style={styles.subtitle}>Your date of birth lets the app choose age-appropriate training and nutrition options.</Text>

      <Card>
        <Text style={styles.label}>EMAIL</Text>
        <Text style={styles.readOnly}>{email || '—'}</Text>

        <Text style={styles.label}>DISPLAY NAME</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display name" placeholderTextColor={colours.muted} style={styles.input} />

        <Text style={styles.label}>DATE OF BIRTH</Text>
        <TextInput
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="DD-MM-YYYY"
          placeholderTextColor={colours.muted}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          style={styles.input}
        />
        {dateOfBirth && !validDob ? <Text style={styles.validation}>Enter a valid past date as DD-MM-YYYY.</Text> : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={[styles.button, (!validDob || busy) && styles.disabled]} disabled={!validDob || busy} onPress={save}>
          <Text style={styles.buttonText}>{busy ? 'SAVING…' : 'SAVE PROFILE'}</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

function isoDateToUk(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function ukDateToIso(value: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
  if (date >= todayDate || year < 1900) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 12 },
  readOnly: { color: colours.white, fontSize: 12, fontWeight: '800', marginTop: 7, marginBottom: 4 },
  input: { backgroundColor: colours.card2, color: colours.white, borderRadius: 10, padding: 13, marginTop: 8 },
  validation: { color: colours.orange, fontSize: 9, lineHeight: 14, marginTop: 5 },
  message: { color: colours.gold, fontSize: 10, lineHeight: 16, marginTop: 10 },
  button: { backgroundColor: colours.gold, borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  buttonText: { color: colours.background, fontWeight: '900', fontSize: 10 },
  disabled: { opacity: 0.4 },
});
