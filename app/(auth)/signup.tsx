import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const validDob = isValidDateOfBirth(dateOfBirth);
  const canCreate = isSupabaseConfigured && !busy && Boolean(email.trim()) && password.length >= 6 && validDob;

  async function signUp() {
    if (!supabase || !canCreate) return;
    setBusy(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim(),
          date_of_birth: dateOfBirth.trim(),
        },
      },
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      router.replace('/(app)');
    } else {
      setMessage('Check your email to confirm your account, then log in.');
    }
  }

  return (
    <Screen>
      <Brand />
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Start personal. Add a school, workplace or club later if you want.</Text>

      <Card>
        <TextInput value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor={colours.muted} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colours.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
        <TextInput
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colours.muted}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          style={styles.input}
        />
        {dateOfBirth && !validDob ? <Text style={styles.validation}>Enter a valid past date as YYYY-MM-DD.</Text> : null}
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colours.muted} secureTextEntry style={styles.input} />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={[styles.button, !canCreate && styles.disabled]} disabled={!canCreate} onPress={signUp}>
          <Text style={styles.buttonText}>{busy ? 'CREATING…' : 'CREATE ACCOUNT'}</Text>
        </Pressable>
      </Card>

      <Link href="/(auth)/login" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>BACK TO LOGIN</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

function isValidDateOfBirth(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
  return date < todayDate && year >= 1900;
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, fontWeight: '900', marginTop: 28 },
  subtitle: { color: colours.muted, marginTop: 4, marginBottom: 18, lineHeight: 18 },
  fieldLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 12 },
  input: { backgroundColor: colours.card2, color: colours.white, borderRadius: 10, padding: 13, marginTop: 10 },
  validation: { color: colours.orange, fontSize: 9, lineHeight: 14, marginTop: 5 },
  button: { backgroundColor: colours.gold, borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  buttonText: { color: colours.background, fontWeight: '900', fontSize: 10 },
  disabled: { opacity: 0.4 },
  linkButton: { alignItems: 'center', padding: 16 },
  linkText: { color: colours.gold, fontWeight: '900', fontSize: 9 },
  message: { color: colours.gold, fontSize: 10, lineHeight: 16, marginTop: 10 },
});
