import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

type GoalKey = 'stay_active' | 'training_recovery' | 'build_muscle' | 'lose_fat_keep_muscle';
type Goal = { key: GoalKey; title: string; description: string; multiplier: number };

const ADULT_GOALS: Goal[] = [
  { key: 'stay_active', title: 'STAY ACTIVE', description: 'Support regular activity, recovery and muscle maintenance.', multiplier: 1.4 },
  { key: 'build_muscle', title: 'BUILD MUSCLE', description: 'Support resistance training and muscle growth.', multiplier: 1.6 },
  { key: 'lose_fat_keep_muscle', title: 'LOSE FAT, KEEP MUSCLE', description: 'Adult-only setting to support muscle retention while reducing body fat.', multiplier: 1.8 },
];

const YOUTH_GOALS: Goal[] = [
  { key: 'stay_active', title: 'STAY ACTIVE', description: 'Support healthy activity, growth and recovery.', multiplier: 1.2 },
  { key: 'training_recovery', title: 'TRAINING & RECOVERY', description: 'For regular sport and training while still growing.', multiplier: 1.4 },
  { key: 'build_muscle', title: 'BUILD STRENGTH & MUSCLE', description: 'Support strength training with a conservative youth target.', multiplier: 1.5 },
];

export default function ProteinSetupScreen() {
  const [enabled, setEnabled] = useState(false);
  const [dob, setDob] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | null>(null);
  const [override, setOverride] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data, error } = await supabase.from('profiles').select('date_of_birth,protein_enabled,protein_goal,protein_multiplier_override').eq('id', userData.user.id).single();
      if (!live) return;
      if (error || !data) { setMessage('Could not load Hit My Protein settings.'); return; }
      setDob(data.date_of_birth || null);
      setEnabled(Boolean(data.protein_enabled));
      setSelectedGoal((data.protein_goal as GoalKey | null) || null);
      setOverride(data.protein_multiplier_override == null ? null : Number(data.protein_multiplier_override));
    }
    load().catch(() => { if (live) setMessage('Could not load Hit My Protein settings.'); });
    return () => { live = false; };
  }, []));

  const age = useMemo(() => dob ? ageFromIsoDate(dob) : null, [dob]);
  const under18 = age !== null && age < 18;
  const goals = under18 ? YOUTH_GOALS : ADULT_GOALS;

  async function toggleEnabled() {
    if (!supabase || busy) return;
    setBusy(true);
    setMessage('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setBusy(false); return; }
    const next = !enabled;
    const { error } = await supabase.from('profiles').update({ protein_enabled: next }).eq('id', userData.user.id);
    setBusy(false);
    if (error) setMessage(error.message); else setEnabled(next);
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Hit My Protein</Text>
      <Text style={styles.subtitle}>An optional protein calculator and reference guide. No food logging.</Text>

      <Card style={[styles.enableCard, enabled && styles.enableCardOn]}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.label}>HIT MY PROTEIN</Text>
            <Text style={styles.enableTitle}>{enabled ? 'Enabled' : 'Disabled'}</Text>
            <Text style={styles.body}>{enabled ? 'Your protein goal options are available below.' : 'Turn this on to add protein guidance to the app.'}</Text>
          </View>
          <Pressable style={[styles.switch, enabled && styles.switchOn]} onPress={toggleEnabled} disabled={busy}>
            <View style={[styles.knob, enabled && styles.knobOn]} />
          </Pressable>
        </View>
      </Card>

      {!dob ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>DATE OF BIRTH NEEDED</Text>
          <Text style={styles.body}>Add your date of birth first so the app can show age-appropriate goal choices.</Text>
          <Pressable style={styles.outlineButton} onPress={() => router.push('/(app)/profile')}><Text style={styles.outlineText}>OPEN PROFILE</Text></Pressable>
        </Card>
      ) : null}

      {enabled && dob ? (
        <>
          <Text style={styles.sectionTitle}>{under18 ? 'CHOOSE YOUR GOAL • UNDER 18' : 'CHOOSE YOUR GOAL'}</Text>
          {goals.map((goal) => {
            const selected = selectedGoal === goal.key;
            return (
              <Pressable key={goal.key} style={[styles.goalCard, selected && styles.goalCardSelected]} onPress={() => router.push({ pathname: '/(app)/protein-goal', params: { goal: goal.key } })}>
                <View style={styles.flex}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalText}>{goal.description}</Text>
                  <View style={styles.rateRow}>
                    <Text style={styles.goalRate}>{goal.multiplier.toFixed(1)} g/kg recommended</Text>
                    {selected && override !== null ? <Text style={styles.userRate}>{override.toFixed(1)} g/kg set by user</Text> : null}
                  </View>
                </View>
                <Text style={styles.arrow}>→</Text>
              </Pressable>
            );
          })}
          {under18 ? <Text style={styles.note}>Weight-loss goals are not offered to users under 18.</Text> : null}
        </>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

function ageFromIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday = today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  enableCard: { borderColor: colours.border, marginBottom: 13 },
  enableCardOn: { borderColor: colours.gold },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  enableTitle: { color: colours.white, fontSize: 19, fontWeight: '900', marginTop: 4 },
  body: { color: colours.muted, fontSize: 10, lineHeight: 15, marginTop: 4, paddingRight: 8 },
  switch: { width: 50, height: 30, borderRadius: 15, backgroundColor: colours.card2, padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: colours.gold },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colours.white },
  knobOn: { alignSelf: 'flex-end', backgroundColor: colours.background },
  warningCard: { borderColor: colours.orange, marginBottom: 13 },
  warningTitle: { color: colours.orange, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  outlineButton: { minHeight: 38, borderWidth: 1, borderColor: colours.gold, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  outlineText: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sectionTitle: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.0, marginBottom: 8 },
  goalCard: { minHeight: 92, borderWidth: 1, borderColor: colours.gold, borderRadius: 13, backgroundColor: colours.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 9 },
  goalCardSelected: { borderWidth: 2 },
  goalTitle: { color: colours.white, fontSize: 13, fontWeight: '900' },
  goalText: { color: colours.muted, fontSize: 9, lineHeight: 14, marginTop: 4, paddingRight: 8 },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 5, paddingRight: 8 },
  goalRate: { color: colours.gold, fontSize: 9, fontWeight: '900' },
  userRate: { color: colours.white, fontSize: 9, fontWeight: '900', marginLeft: 10 },
  arrow: { color: colours.gold, fontSize: 27, lineHeight: 29, marginLeft: 8 },
  note: { color: colours.muted, fontSize: 9, lineHeight: 14, marginTop: 2, marginBottom: 10 },
  message: { color: colours.gold, fontSize: 9, lineHeight: 14, marginTop: 8 },
});
