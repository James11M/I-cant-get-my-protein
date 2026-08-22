import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

const SECTIONS: Record<string, { title: string; subtitle: string }> = {
  'exercise-library': { title: 'Exercise Library', subtitle: 'Exercises, equipment and custom exercises.' },
  sports: { title: 'Sports & Activities', subtitle: 'Review the activity library and add your own.' },
  timing: { title: 'Exercise Timing', subtitle: 'Rep pace, rest and duration assumptions.' },
  'strength-tracking': { title: 'Strength Tracking', subtitle: 'Best 10-Rep Weight and estimated 1RM reference.' },
  targets: { title: 'Targets', subtitle: 'Month, year, weight and body-fat goals.' },
  measurements: { title: 'Stats & Measurements', subtitle: 'Core and advanced measurements.' },
  'term-dates': { title: 'School Term Dates', subtitle: 'The app automatically derives Term Time or Holiday from these periods.' },
};

export default function SettingsSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const key = section || '';
  const content = SECTIONS[key] || { title: 'Settings', subtitle: '' };
  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>{content.title}</Text>
      {content.subtitle ? <Text style={styles.subtitle}>{content.subtitle}</Text> : null}
      {key === 'exercise-library' ? <ExerciseLibrary /> : null}
      {key === 'sports' ? <SportsLibrary /> : null}
      {key === 'timing' ? <Timing /> : null}
      {key === 'strength-tracking' ? <StrengthTracking /> : null}
      {key === 'targets' ? <Targets /> : null}
      {key === 'measurements' ? <Measurements /> : null}
      {key === 'term-dates' ? <TermDates /> : null}
    </Screen>
  );
}

function ExerciseLibrary() {
  return <>
    <Card style={styles.infoCard}><View style={styles.rowBetween}><View><Text style={styles.label}>EQUIPMENT AVAILABLE</Text><Text style={styles.valueSmall}>BODYWEIGHT • DUMBBELLS • FULL GYM</Text></View><Pressable style={styles.smallOutline}><Text style={styles.smallOutlineText}>SHOW</Text></Pressable></View></Card>
    <Pressable style={styles.outlineButton}><Text style={styles.outlineText}>+ ADD YOUR OWN EXERCISE</Text></Pressable>
    <TextInput style={styles.search} placeholder="Search exercise…" placeholderTextColor={colours.muted} />
    <View style={styles.pills}>{['ALL','FAVOURITES','BODYWEIGHT','DUMBBELLS'].map((item, index) => <View key={item} style={[styles.pill, index === 0 && styles.pillActive]}><Text style={[styles.pillText, index === 0 && styles.pillTextActive]}>{item}</Text></View>)}</View>
    <ExerciseRow name="Push-Up" meta="BODYWEIGHT • Upper Body • Reps" emoji="💪" />
    <ExerciseRow name="Bodyweight Squat" meta="BODYWEIGHT • Lower Body • Reps" emoji="🦵" />
    <ExerciseRow name="Front Plank" meta="BODYWEIGHT • Core • Timed" emoji="◎" />
  </>;
}

function ExerciseRow({ name, meta, emoji }: { name: string; meta: string; emoji: string }) {
  return <Card style={styles.listCard}><View style={styles.listIcon}><Text style={styles.listEmoji}>{emoji}</Text></View><View style={styles.flex}><Text style={styles.listTitle}>{name}</Text><Text style={styles.listMeta}>{meta}</Text></View><Text style={styles.arrow}>›</Text></Card>;
}

function SportsLibrary() {
  const items = [
    ['🏫','PE Lesson','School / PE • target 30 min'], ['🏉','Rugby','Sport • target 30 min'], ['⚽','Football','Sport • target 30 min'],
    ['🏃','Running','Cardio • target 2 km'], ['🏊','Swimming','Cardio • target 500 m'], ['🎾','Tennis','Sport • target 30 min'],
  ];
  return <>
    <Pressable style={styles.outlineButton}><Text style={styles.outlineText}>+ ADD SPORT / ACTIVITY</Text></Pressable>
    {items.map(([emoji, name, meta]) => <Card key={name} style={styles.listCard}><View style={styles.listIcon}><Text style={styles.listEmoji}>{emoji}</Text></View><View style={styles.flex}><Text style={styles.listTitle}>{name}</Text><Text style={styles.listMeta}>{meta}</Text></View><Text style={styles.arrow}>›</Text></Card>)}
  </>;
}

function Timing() {
  const [rest, setRest] = useState(60);
  const [transition, setTransition] = useState(45);
  return <>
    <CounterCard title="REST BETWEEN SETS" value={rest} unit="sec" onMinus={() => setRest(Math.max(0, rest - 5))} onPlus={() => setRest(rest + 5)} />
    <CounterCard title="TRANSITION BETWEEN EXERCISES" value={transition} unit="sec" onMinus={() => setTransition(Math.max(0, transition - 5))} onPlus={() => setTransition(transition + 5)} />
    <Card style={styles.infoCard}><Text style={styles.label}>REP PACE</Text><Text style={styles.bodyText}>Exercise-specific rep timings are used when estimating workout duration.</Text></Card>
  </>;
}

function CounterCard({ title, value, unit, onMinus, onPlus }: { title: string; value: number; unit: string; onMinus: () => void; onPlus: () => void }) {
  return <Card style={styles.counterCard}><Text style={styles.label}>{title}</Text><View style={styles.counterRow}><RoundButton label="−" onPress={onMinus} /><Text style={styles.counterValue}>{value} <Text style={styles.counterUnit}>{unit}</Text></Text><RoundButton label="+" onPress={onPlus} /></View></Card>;
}

function StrengthTracking() {
  const [weight, setWeight] = useState('80');
  const numeric = Number(weight) || 0;
  return <>
    <Card style={styles.warningCard}><Text style={styles.warningTitle}>DON'T TEST YOUR MAX</Text><Text style={styles.bodyText}>Enter the heaviest weight you can complete for 10 controlled reps with good technique. The estimated 1RM is reference-only.</Text></Card>
    <View style={styles.pills}>{['Leg Press','Bench Press','Shoulder Press'].map((item, index) => <View key={item} style={[styles.pill, index === 0 && styles.pillActive]}><Text style={[styles.pillText, index === 0 && styles.pillTextActive]}>{item}</Text></View>)}</View>
    <Card style={styles.trackingCard}><Text style={styles.label}>BEST 10-REP WEIGHT</Text><Text style={styles.bigValue}>{numeric || 0} <Text style={styles.bigUnit}>kg</Text></Text><Text style={styles.listMeta}>ESTIMATED 1RM • REFERENCE ONLY</Text><Text style={styles.estimate}>≈ {Math.round(numeric * 1.333)} kg</Text><Text style={[styles.label, { marginTop: 16 }]}>LOG BEST 10-REP WEIGHT</Text><TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} /><Pressable style={styles.primary}><Text style={styles.primaryText}>SAVE</Text></Pressable></Card>
  </>;
}

function Targets() {
  const [month, setMonth] = useState(80);
  const [year, setYear] = useState(80);
  return <>
    <CounterCard title="MONTH TARGET" value={month} unit="%" onMinus={() => setMonth(Math.max(0, month - 5))} onPlus={() => setMonth(Math.min(100, month + 5))} />
    <CounterCard title="YEAR TARGET" value={year} unit="%" onMinus={() => setYear(Math.max(0, year - 5))} onPlus={() => setYear(Math.min(100, year + 5))} />
    <Card style={styles.infoCard}><Text style={styles.label}>TARGET WEIGHT</Text><View style={styles.inlineInput}><TextInput style={[styles.input, styles.flex]} defaultValue="72" keyboardType="numeric" /><Text style={styles.inputUnit}>kg</Text></View></Card>
    <Card style={styles.infoCard}><Text style={styles.label}>TARGET BODY FAT</Text><View style={styles.inlineInput}><TextInput style={[styles.input, styles.flex]} defaultValue="14" keyboardType="numeric" /><Text style={styles.inputUnit}>%</Text></View></Card>
  </>;
}

function Measurements() {
  const available = ['Neck','Shoulders','Chest','Left Bicep','Right Bicep','Left Forearm','Right Forearm','Upper Abs','Waist','Lower Abs'];
  return <>
    <Text style={styles.sectionLabel}>CORE</Text>
    <Card style={styles.infoCard}><MeasurementCore name="Weight" value="69.8 kg" /><View style={styles.divider} /><MeasurementCore name="Body Fat" value="15.1%" /></Card>
    <Text style={styles.sectionLabel}>AVAILABLE MEASUREMENTS</Text>
    <Card style={styles.measureCard}>{available.map((item, index) => <View key={item} style={[styles.measureRow, index < available.length - 1 && styles.measureBorder]}><View><Text style={styles.listTitle}>{item}</Text><Text style={styles.listMeta}>Optional tracking</Text></View><View style={styles.plusSmall}><Text style={styles.plusSmallText}>+</Text></View></View>)}</Card>
  </>;
}

function MeasurementCore({ name, value }: { name: string; value: string }) { return <View style={styles.rowBetween}><View><Text style={styles.listTitle}>{name}</Text><Text style={styles.listMeta}>Core measurement</Text></View><Text style={styles.coreValue}>{value}</Text></View>; }

function TermDates() {
  return <>
    <TermCard name="Autumn Term" start="2026-09-01" end="2026-12-18" />
    <TermCard name="Spring Term" start="2027-01-05" end="2027-03-26" />
    <TermCard name="Summer Term" start="2027-04-13" end="2027-07-03" />
  </>;
}

function TermCard({ name, start, end }: { name: string; start: string; end: string }) {
  return <Card style={styles.infoCard}><Text style={styles.termTitle}>{name}</Text><Text style={styles.label}>START • YYYY-MM-DD</Text><TextInput style={styles.input} defaultValue={start} /><Text style={[styles.label, { marginTop: 10 }]}>END • YYYY-MM-DD</Text><TextInput style={styles.input} defaultValue={end} /></Card>;
}

function RoundButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable style={styles.roundButton} onPress={onPress}><Text style={styles.roundButtonText}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' }, subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  flex: { flex: 1 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoCard: { marginBottom: 10 }, label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, valueSmall: { color: colours.white, fontSize: 9, fontWeight: '800', marginTop: 4 },
  smallOutline: { borderWidth: 1, borderColor: colours.gold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }, smallOutlineText: { color: colours.gold, fontSize: 7, fontWeight: '900' },
  outlineButton: { borderWidth: 1, borderColor: colours.gold, borderRadius: 12, minHeight: 43, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, outlineText: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  search: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 11, color: colours.white, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 9 },
  pills: { flexDirection: 'row', gap: 5, marginBottom: 9, flexWrap: 'wrap' }, pill: { backgroundColor: colours.card2, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 }, pillActive: { backgroundColor: colours.gold }, pillText: { color: colours.muted, fontSize: 7, fontWeight: '900' }, pillTextActive: { color: colours.background },
  listCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 9 }, listIcon: { width: 41, height: 41, borderRadius: 10, backgroundColor: colours.card2, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, listEmoji: { fontSize: 20 }, listTitle: { color: colours.white, fontSize: 11, fontWeight: '900' }, listMeta: { color: colours.muted, fontSize: 8, fontWeight: '700', marginTop: 3 }, arrow: { color: colours.gold, fontSize: 25 },
  counterCard: { marginBottom: 10 }, counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }, roundButton: { width: 35, height: 35, borderRadius: 18, backgroundColor: colours.gold, alignItems: 'center', justifyContent: 'center' }, roundButtonText: { color: colours.background, fontSize: 23, lineHeight: 25, fontWeight: '700' }, counterValue: { color: colours.white, fontSize: 26, fontWeight: '900' }, counterUnit: { fontSize: 12, color: colours.muted }, bodyText: { color: colours.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  warningCard: { borderColor: colours.gold, marginBottom: 10 }, warningTitle: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, trackingCard: { marginTop: 2 }, bigValue: { color: colours.white, fontSize: 32, fontWeight: '900', marginTop: 5 }, bigUnit: { fontSize: 14 }, estimate: { color: colours.white, fontSize: 20, fontWeight: '900', marginTop: 3 },
  input: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 10, color: colours.white, paddingHorizontal: 13, paddingVertical: 11, marginTop: 6 }, primary: { backgroundColor: colours.gold, borderRadius: 11, minHeight: 43, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, primaryText: { color: colours.background, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, inlineInput: { flexDirection: 'row', alignItems: 'center' }, inputUnit: { color: colours.white, fontSize: 13, fontWeight: '900', marginLeft: 8, marginTop: 6 },
  sectionLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 3, marginBottom: 7 }, divider: { height: 1, backgroundColor: colours.border, marginVertical: 10 }, coreValue: { color: colours.white, fontSize: 16, fontWeight: '900' }, measureCard: { paddingVertical: 3 }, measureRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 }, measureBorder: { borderBottomWidth: 1, borderBottomColor: colours.border }, plusSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: colours.gold, alignItems: 'center', justifyContent: 'center' }, plusSmallText: { color: colours.background, fontSize: 19, fontWeight: '700' },
  termTitle: { color: colours.white, fontSize: 15, fontWeight: '900', marginBottom: 10 },
});
