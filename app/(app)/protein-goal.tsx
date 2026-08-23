import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ExpandChevron } from '@/components/ExpandChevron';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

type GoalKey = 'stay_active' | 'training_recovery' | 'build_muscle' | 'lose_fat_keep_muscle';
type GoalDefinition = { adultTitle: string; youthTitle?: string; adultRate: number; youthRate?: number; adultCopy: string; youthCopy?: string };

const GOALS: Record<GoalKey, GoalDefinition> = {
  stay_active: {
    adultTitle: 'Stay Active', youthTitle: 'Stay Active', adultRate: 1.4, youthRate: 1.2,
    adultCopy: 'A straightforward target for regular activity, recovery and maintaining muscle. It sits within commonly used sports-nutrition ranges without pushing protein unusually high.',
    youthCopy: 'A conservative target to support normal activity, growth and recovery. Food quality and enough overall energy remain more important than chasing a high protein number.',
  },
  training_recovery: {
    adultTitle: 'Training & Recovery', youthTitle: 'Training & Recovery', adultRate: 1.4, youthRate: 1.4,
    adultCopy: 'For people training regularly who want a simple recovery-focused target.',
    youthCopy: 'For regular sport and training while still growing. The app keeps this within a conservative youth range and does not introduce weight-loss goals.',
  },
  build_muscle: {
    adultTitle: 'Build Muscle', youthTitle: 'Build Strength & Muscle', adultRate: 1.6, youthRate: 1.5,
    adultCopy: 'Supports resistance training and muscle growth. Protein helps, but progressive training, enough food, carbohydrate and recovery are all part of the result.',
    youthCopy: 'Supports strength training while keeping the recommendation conservative for a growing athlete. Technique, training quality, sleep and enough overall food remain central.',
  },
  lose_fat_keep_muscle: {
    adultTitle: 'Lose Fat, Keep Muscle', adultRate: 1.8,
    adultCopy: 'An adult-only setting that uses a slightly higher protein target to support muscle retention while reducing body fat. It is not a crash-diet setting and does not prescribe calories.',
  },
};

export default function ProteinGoalScreen() {
  const { goal } = useLocalSearchParams<{ goal: GoalKey }>();
  const [dob, setDob] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [override, setOverride] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from('profiles').select('date_of_birth,protein_goal,protein_multiplier_override').eq('id', userData.user.id).single();
      if (!live || !data) return;
      setDob(data.date_of_birth || null);
      if (data.protein_goal === goal && data.protein_multiplier_override !== null) setOverride(Number(data.protein_multiplier_override));
    }
    load().catch(() => { if (live) setMessage('Could not load this protein goal.'); });
    return () => { live = false; };
  }, [goal]));

  const age = useMemo(() => dob ? ageFromIsoDate(dob) : null, [dob]);
  const under18 = age !== null && age < 18;
  const definition = GOALS[goal] || GOALS.stay_active;
  const blocked = under18 && goal === 'lose_fat_keep_muscle';
  const recommended = under18 && definition.youthRate ? definition.youthRate : definition.adultRate;
  const title = under18 && definition.youthTitle ? definition.youthTitle : definition.adultTitle;
  const copy = under18 && definition.youthCopy ? definition.youthCopy : definition.adultCopy;
  const effective = override ?? recommended;
  const min = under18 ? 1.0 : 1.2;
  const max = under18 ? 1.8 : 2.0;
  const ticks = Array.from({ length: Math.round((max - min) * 10) + 1 }, (_, i) => Number((min + i * 0.1).toFixed(1)));

  async function apply() {
    if (!supabase || blocked || busy) return;
    setBusy(true);
    setMessage('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setBusy(false); return; }
    const { error } = await supabase.from('profiles').update({
      protein_enabled: true,
      protein_goal: goal,
      protein_multiplier_override: override,
    }).eq('id', userData.user.id);
    setBusy(false);
    setMessage(error ? error.message : 'Protein goal saved.');
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>{blocked ? 'Goal unavailable' : title}</Text>
      <Text style={styles.subtitle}>{blocked ? 'Weight-loss goals are not offered to users under 18.' : 'Hit My Protein goal setting'}</Text>

      {!blocked ? (
        <>
          <Card style={styles.explainCard}>
            <Text style={styles.label}>RECOMMENDED</Text>
            <Text style={styles.rate}>{recommended.toFixed(1)} <Text style={styles.unit}>g/kg/day</Text></Text>
            <Text style={styles.body}>{copy}</Text>
          </Card>

          <Pressable style={styles.advancedToggle} onPress={() => setAdvanced((value) => !value)}>
            <Text style={styles.advancedText}>ADVANCED SETTINGS</Text>
            <ExpandChevron expanded={advanced} />
          </Pressable>

          {advanced ? (
            <Card style={styles.advancedCard}>
              <Text style={styles.label}>PROTEIN MULTIPLIER</Text>
              <Text style={styles.currentRate}>{effective.toFixed(1)} g/kg</Text>
              <Text style={styles.body}>Choose within the bounded range below. The recommended setting is {recommended.toFixed(1)} g/kg.</Text>
              <View style={styles.tickRow}>
                {ticks.map((value) => (
                  <Pressable key={value} style={[styles.tick, Math.abs(value - effective) < 0.01 && styles.tickActive]} onPress={() => setOverride(Math.abs(value - recommended) < 0.01 ? null : value)}>
                    <View style={[styles.tickMark, Math.abs(value - effective) < 0.01 && styles.tickMarkActive]} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.rangeRow}><Text style={styles.rangeText}>{min.toFixed(1)}</Text><Text style={styles.rangeText}>{max.toFixed(1)} g/kg</Text></View>
              <Pressable style={styles.reset} onPress={() => setOverride(null)}><Text style={styles.resetText}>RESET TO RECOMMENDED</Text></Pressable>
            </Card>
          ) : null}

          <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={apply}>
            <Text style={styles.primaryText}>{busy ? 'SAVING…' : 'USE THIS GOAL'}</Text>
          </Pressable>
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
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  explainCard: { borderColor: colours.gold, marginBottom: 10 },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  rate: { color: colours.white, fontSize: 28, fontWeight: '900', marginTop: 5 },
  unit: { fontSize: 12 },
  body: { color: colours.muted, fontSize: 10, lineHeight: 15, marginTop: 7 },
  advancedToggle: { borderWidth: 1, borderColor: colours.border, borderRadius: 11, minHeight: 45, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  advancedText: { color: colours.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  advancedCard: { marginBottom: 10 },
  currentRate: { color: colours.white, fontSize: 22, fontWeight: '900', marginTop: 5 },
  tickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, minHeight: 26 },
  tick: { flex: 1, height: 26, alignItems: 'center', justifyContent: 'center' },
  tickActive: { backgroundColor: colours.card2, borderRadius: 6 },
  tickMark: { width: 2, height: 9, borderRadius: 1, backgroundColor: colours.muted },
  tickMarkActive: { width: 4, height: 18, backgroundColor: colours.gold },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  rangeText: { color: colours.muted, fontSize: 8, fontWeight: '800' },
  reset: { minHeight: 36, borderWidth: 1, borderColor: colours.gold, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  resetText: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  primary: { backgroundColor: colours.gold, borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  primaryText: { color: colours.background, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  message: { color: colours.gold, fontSize: 9, lineHeight: 14, marginTop: 9 },
});
