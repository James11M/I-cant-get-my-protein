import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

type Tab = 'guidance' | 'protein';
type FoodType = 'meat' | 'vegetarian' | 'vegan';

const FOODS: Record<FoodType, Array<[string, string]>> = {
  meat: [['Chicken breast','75g cooked • ≈20g'],['Tuna','100g • ≈25g'],['Salmon','100g • ≈20–25g'],['Turkey','75g cooked • ≈20g'],['Lean beef','75g cooked • ≈20g'],['White fish','100g • ≈20g'],['Eggs','3 medium • ≈20g'],['Greek yoghurt','225g • ≈20g'],['Cottage cheese','150g • ≈18g'],['Milk','500ml • ≈17g']],
  vegetarian: [['Eggs','3 medium • ≈20g'],['Greek yoghurt','225g • ≈20g'],['Cottage cheese','150g • ≈18g'],['Milk','500ml • ≈17g'],['Cheddar','60g • ≈15g'],['Lentils','200g cooked • ≈18g'],['Chickpeas','200g cooked • ≈16g'],['Baked beans','200g • ≈10g'],['Tofu','150g • ≈18g'],['Edamame','150g • ≈17g']],
  vegan: [['Tofu','150g • ≈18g'],['Tempeh','100g • ≈19g'],['Lentils','200g cooked • ≈18g'],['Chickpeas','200g cooked • ≈16g'],['Edamame','150g • ≈17g'],['Soya mince','Typical serving • ≈20g'],['Baked beans','200g • ≈10g'],['Peanut butter','2 tbsp • ≈8g'],['Mixed nuts','30g • ≈6g'],['Broccoli','100g • ≈3g']],
};

export default function ProteinDetailsScreen() {
  const [tab, setTab] = useState<Tab>('guidance');
  const [foodType, setFoodType] = useState<FoodType>('meat');
  const [weight, setWeight] = useState<number | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [override, setOverride] = useState<number | null>(null);
  const [dob, setDob] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from('profiles').select('date_of_birth,current_weight_kg,protein_goal,protein_multiplier_override').eq('id', userData.user.id).single();
      if (!live || !data) return;
      setWeight(data.current_weight_kg == null ? null : Number(data.current_weight_kg));
      setGoal(data.protein_goal || null);
      setOverride(data.protein_multiplier_override == null ? null : Number(data.protein_multiplier_override));
      setDob(data.date_of_birth || null);
    }
    load();
    return () => { live = false; };
  }, []));

  const multiplier = useMemo(() => getMultiplier(goal, override, dob), [goal, override, dob]);
  const target = weight && multiplier ? Math.round(weight * multiplier) : null;

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Hit My Protein</Text>
      <Card style={styles.calcCard}>
        <Text style={styles.goldLabel}>YOUR DAILY PROTEIN</Text>
        <Text style={styles.target}>{target ? `${target}g` : '—'}</Text>
        <Text style={styles.goal}>{goalTitle(goal, dob)}</Text>
        {weight && multiplier ? <Text style={styles.calc}>{weight} kg × {multiplier.toFixed(1)} g/kg = {target} g/day</Text> : null}
      </Card>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'guidance' && styles.tabOn]} onPress={() => setTab('guidance')}><Text style={[styles.tabText, tab === 'guidance' && styles.tabTextOn]}>GUIDANCE</Text></Pressable>
        <Pressable style={[styles.tab, tab === 'protein' && styles.tabOn]} onPress={() => setTab('protein')}><Text style={[styles.tabText, tab === 'protein' && styles.tabTextOn]}>PROTEIN</Text></Pressable>
      </View>

      {tab === 'guidance' ? <View style={styles.list}>
        <Tip title="SPREAD IT OUT" text="Include protein regularly across the day rather than trying to eat it all in one meal." />
        <Tip title="AFTER TRAINING" text="A protein-containing meal or snack after exercise can support recovery. Eating within roughly two hours is a useful routine, not a hard deadline." />
        <Tip title="3–4 TIMES A DAY" text="For most people, spreading protein across 3–4 meals or snacks makes the daily target easier to reach." />
        <Tip title="DON'T FORGET CARBS" text="Carbohydrate is useful exercise fuel. Aim for balanced meals rather than trying to avoid normal rises in blood glucose around training." />
        <Tip title="FOOD FIRST" text="Most people can meet their protein needs from ordinary food. Supplements are optional, not required." />
      </View> : <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodTabs}>
          {([['meat','MEAT & FISH'],['vegetarian','VEGETARIAN'],['vegan','VEGAN']] as Array<[FoodType,string]>).map(([key,label]) => <Pressable key={key} style={[styles.foodTab, foodType === key && styles.foodTabOn]} onPress={() => setFoodType(key)}><Text style={[styles.foodTabText, foodType === key && styles.foodTabTextOn]}>{label}</Text></Pressable>)}
        </ScrollView>
        <Card style={styles.foodCard}>{FOODS[foodType].map(([name, protein], index) => <View key={name} style={[styles.foodRow, index < FOODS[foodType].length - 1 && styles.divider]}><Text style={styles.foodName}>{name}</Text><Text style={styles.foodProtein}>{protein}</Text></View>)}</Card>
        <Text style={styles.note}>Approximate values for simple reference; portions and brands vary.</Text>
      </>}
    </Screen>
  );
}

function Tip({ title, text }: { title: string; text: string }) { return <Card style={styles.tip}><Text style={styles.tipTitle}>{title}</Text><Text style={styles.tipText}>{text}</Text></Card>; }
function age(dob: string | null) { if (!dob) return 18; const [y,m,d] = dob.split('-').map(Number); const now = new Date(); let value = now.getFullYear()-y; if (now.getMonth()+1<m || (now.getMonth()+1===m && now.getDate()<d)) value--; return value; }
function getMultiplier(goal: string | null, override: number | null, dob: string | null) { if (override !== null) return override; const youth = age(dob) < 18; if (goal === 'stay_active') return youth ? 1.2 : 1.4; if (goal === 'training_recovery') return 1.4; if (goal === 'build_muscle') return youth ? 1.5 : 1.6; if (goal === 'lose_fat_keep_muscle') return youth ? null : 1.8; return null; }
function goalTitle(goal: string | null, dob: string | null) { const youth = age(dob) < 18; if (goal === 'stay_active') return 'Stay Active'; if (goal === 'training_recovery') return 'Training & Recovery'; if (goal === 'build_muscle') return youth ? 'Build Strength & Muscle' : 'Build Muscle'; if (goal === 'lose_fat_keep_muscle') return 'Lose Fat, Keep Muscle'; return 'Protein target'; }

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, fontWeight: '900', marginBottom: 14 },
  calcCard: { borderColor: colours.gold, marginBottom: 12 }, goldLabel: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  target: { color: colours.white, fontSize: 36, fontWeight: '900', marginTop: 4 }, goal: { color: colours.white, fontSize: 16, fontWeight: '900', marginTop: 4 }, calc: { color: colours.muted, fontSize: 10, marginTop: 6 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: colours.gold, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }, tab: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center' }, tabOn: { backgroundColor: colours.gold }, tabText: { color: colours.gold, fontSize: 10, fontWeight: '900' }, tabTextOn: { color: colours.background },
  list: { gap: 9 }, tip: { paddingVertical: 14 }, tipTitle: { color: colours.gold, fontSize: 10, fontWeight: '900' }, tipText: { color: colours.white, fontSize: 11, lineHeight: 17, marginTop: 5 },
  foodTabs: { gap: 8, paddingRight: 14, marginBottom: 12 }, foodTab: { minHeight: 38, paddingHorizontal: 14, borderWidth: 1, borderColor: colours.gold, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, foodTabOn: { backgroundColor: colours.gold }, foodTabText: { color: colours.gold, fontSize: 9, fontWeight: '900' }, foodTabTextOn: { color: colours.background },
  foodCard: { paddingVertical: 4 }, foodRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, divider: { borderBottomWidth: 1, borderBottomColor: colours.border }, foodName: { color: colours.white, fontSize: 12, fontWeight: '900' }, foodProtein: { color: colours.gold, fontSize: 10, fontWeight: '800' }, note: { color: colours.muted, fontSize: 8, lineHeight: 13, marginTop: 7, marginBottom: 10 },
});
