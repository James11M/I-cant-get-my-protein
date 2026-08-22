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
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function signUp() {
    if (!supabase) return;
    setBusy(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
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
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colours.muted} secureTextEntry style={styles.input} />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={[styles.button, (!isSupabaseConfigured || busy || !email || password.length < 6) && styles.disabled]} disabled={!isSupabaseConfigured || busy || !email || password.length < 6} onPress={signUp}>
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

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, fontWeight: '900', marginTop: 28 },
  subtitle: { color: colours.muted, marginTop: 4, marginBottom: 18, lineHeight: 18 },
  input: { backgroundColor: colours.card2, color: colours.white, borderRadius: 10, padding: 13, marginTop: 10 },
  button: { backgroundColor: colours.gold, borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  buttonText: { color: colours.background, fontWeight: '900', fontSize: 10 },
  disabled: { opacity: 0.4 },
  linkButton: { alignItems: 'center', padding: 16 },
  linkText: { color: colours.gold, fontWeight: '900', fontSize: 9 },
  message: { color: colours.gold, fontSize: 10, lineHeight: 16, marginTop: 10 },
});
