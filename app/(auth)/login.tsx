import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!supabase) return;
    setBusy(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace('/(app)');
  }

  return (
    <Screen>
      <Brand />
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.subtitle}>Your training, wherever you are.</Text>

      <Card>
        {!isSupabaseConfigured && (
          <Text style={styles.setup}>Add the Supabase URL and publishable key to your environment before logging in.</Text>
        )}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colours.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colours.muted}
          secureTextEntry
          style={styles.input}
        />

        {message ? <Text style={styles.error}>{message}</Text> : null}

        <Pressable style={[styles.button, (!isSupabaseConfigured || busy) && styles.disabled]} disabled={!isSupabaseConfigured || busy} onPress={signIn}>
          <Text style={styles.buttonText}>{busy ? 'LOGGING IN…' : 'LOG IN'}</Text>
        </Pressable>
      </Card>

      <Link href="/(auth)/signup" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>CREATE ACCOUNT</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, fontWeight: '900', marginTop: 28 },
  subtitle: { color: colours.muted, marginTop: 4, marginBottom: 18 },
  input: { backgroundColor: colours.card2, color: colours.white, borderRadius: 10, padding: 13, marginTop: 10 },
  button: { backgroundColor: colours.gold, borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  buttonText: { color: colours.background, fontWeight: '900', fontSize: 10 },
  disabled: { opacity: 0.4 },
  linkButton: { alignItems: 'center', padding: 16 },
  linkText: { color: colours.gold, fontWeight: '900', fontSize: 9 },
  setup: { color: colours.gold, fontSize: 10, lineHeight: 16, marginBottom: 4 },
  error: { color: colours.red, fontSize: 10, marginTop: 10 },
});
