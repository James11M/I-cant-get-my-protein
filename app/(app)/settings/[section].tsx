import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EQUIPMENT_LABELS, ExerciseDefinition, POC_ACTIVITIES, POC_EXERCISES } from '@/data/pocCatalog';
import { colours } from '@/theme/colours';

const SECTIONS: Record<string, { title: string; subtitle: string }> = {
  'exercise-library': { title: 'Exercise Library', subtitle: 'Exercises, equipment and custom exercises.' },
  sports: { title: 'Sports & Activities', subtitle: 'Review the activity library and add your own.' },
  timing: { title: 'Exercise Timing', subtitle: 'Rep pace, rest and duration assumptions.' },
  'strength-tracking': { title: 'Strength Tracking', subtitle: 'Best 10-Rep Weight and estimated 1RM reference.' },
  targets: { title: 'Targets', subtitle: 'Month, year, weight and body-fat goals.' },
  measurements: { title: 'Stats & Measurements', subtitle: 'Core and advanced measurements.' },
  'term-dates': { title: 'School Term Dates', subtitle: 'The app derives Term Time or Holiday from these periods.' },
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
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<'all' | ExerciseDefinition['equipment']>('all');
  const [favourites, setFavourites] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [custom, setCustom] = useState<ExerciseDefinition[]>([]);
  const all = [...POC_EXERCISES, ...custom];
  const filtered = all.filter((item) => (equipment === 'all' || item.equipment === equipment) && item.name.toLowerCase().includes(query.toLowerCase()));

  function addCustom() {
    if (!customName.trim()) return;
    setCustom((items) => [...items, { id: `custom-${Date.now()}`, name: customName.trim(), group: 'Custom', equipment: 'bodyweight', inputType: 'reps', icon: '⭐', defaultSets: 3, defaultReps: 10, secondsPerRep: 3 }]);
    setCustomName('');
    setShowCustom(false);
  }

  return <>
    <Card style={styles.infoCard}>
      <Text style={styles.label}>EQUIPMENT AVAILABLE</Text>
      <Text style={styles.valueSmall}>BODYWEIGHT • DUMBBELLS • KETTLEBELLS • HOME KIT • FULL GYM</Text>
    </Card>
    <Pressable style={styles.outlineButton} onPress={() => setShowCustom((value) => !value)}><Text style={styles.outlineText}>+ ADD YOUR OWN EXERCISE</Text></Pressable>
    {showCustom ? <Card style={styles.infoCard}><Text style={styles.label}>EXERCISE NAME</Text><TextInput style={styles.input} value={customName} onChangeText={setCustomName} placeholder="e.g. Garden Carry" placeholderTextColor={colours.muted} /><Pressable style={styles.primary} onPress={addCustom}><Text style={styles.primaryText}>SAVE EXERCISE</Text></Pressable></Card> : null}
    <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search exercise…" placeholderTextColor={colours.muted} />
    <View style={styles.pills}>
      {(['all','bodyweight','dumbbell','kettlebell','fullgym'] as const).map((item) => <Pressable key={item} style={[styles.pill, equipment === item && styles.pillActive]} onPress={() => setEquipment(item)}><Text style={[styles.pillText, equipment === item && styles.pillTextActive]}>{item === 'all' ? 'ALL' : EQUIPMENT_LABELS[item]}</Text></Pressable>)}
    </View>
    <Text style={styles.count}>{filtered.length} EXERCISES</Text>
    {filtered.map((item) => <Card key={item.id} style={styles.listCard}>
      <View style={styles.listIcon}><Text style={styles.listEmoji}>{item.icon}</Text></View>
      <View style={styles.flex}><Text style={styles.listTitle}>{item.name}</Text><Text style={styles.listMeta}>{EQUIPMENT_LABELS[item.equipment]} • {item.group} • {item.inputType === 'reps' ? 'Reps' : 'Timed'}</Text></View>
      <Pressable onPress={() => setFavourites((items) => items.includes(item.id) ? items.filter((id) => id !== item.id) : [...items, item.id])}><Text style={[styles.star, favourites.includes(item.id) && styles.starOn]}>★</Text></Pressable>
    </Card>)}
  </>;
}

function SportsLibrary() {
  const [customName, setCustomName] = useState('');
  const [custom, setCustom] = useState<Array<[string,string,string,string]>>([]);
  const [adding, setAdding] = useState(false);
  function save() {
    if (!customName.trim()) return;
    setCustom((items) => [...items, ['⭐', customName.trim(), 'Custom', '30 min']]);
    setCustomName('');
    setAdding(false);
  }
  const rows = [...POC_ACTIVITIES.map((item) => [...item] as [string,string,string,string]), ...custom];
  return <>
    <Pressable style={styles.outlineButton} onPress={() => setAdding((value) => !value)}><Text style={styles.outlineText}>+ ADD SPORT / ACTIVITY</Text></Pressable>
    {adding ? <Card style={styles.infoCard}><Text style={styles.label}>NAME</Text><TextInput style={styles.input} value={customName} onChangeText={setCustomName} placeholder="e.g. Fives" placeholderTextColor={colours.muted} /><Pressable style={styles.primary} onPress={save}><Text style={styles.primaryText}>SAVE ACTIVITY</Text></Pressable></Card> : null}
    {rows.map(([emoji,name,category,target]) => <Card key={name} style={styles.listCard}><View style={styles.listIcon}><Text style={styles.listEmoji}>{emoji}</Text></View><View style={styles.flex}><Text style={styles.listTitle}>{name}</Text><Text style={styles.listMeta}>{category} • target {target}</Text></View><Text style={styles.arrow}>›</Text></Card>)}
  </>;
}

function Timing() {
  const [rest, setRest] = useState('60');
  const [transition, setTransition] = useState('45');
  const [paces, setPaces] = useState<Record<string,string>>(() => Object.fromEntries(POC_EXERCISES.filter((item) => item.inputType === 'reps').map((item) => [item.id, String(item.secondsPerRep || 3)])));
  return <>
    <NumberField label="REST BETWEEN SETS (SEC)" value={rest} onChange={setRest} />
    <NumberField label="BETWEEN EXERCISES (SEC)" value={transition} onChange={setTransition} />
    <Text style={styles.sectionLabel}>REP TIMING</Text>
    {POC_EXERCISES.filter((item) => item.inputType === 'reps').map((item) => <Card key={item.id} style={styles.timingRow}>
      <View style={styles.flex}><Text style={styles.listTitle}>{item.icon} {item.name}</Text><Text style={styles.listMeta}>{EQUIPMENT_LABELS[item.equipment]}</Text></View>
      <TextInput style={styles.timingInput} keyboardType="numeric" value={paces[item.id]} onChangeText={(value) => setPaces((current) => ({ ...current, [item.id]: value }))} />
      <Text style={styles.suffix}>sec/rep</Text>
    </Card>)}
  </>;
}

function StrengthTracking() {
  const machines = ['Leg Press','Bench Press','Shoulder Press','Lat Pulldown','Cable Row'];
  const [machine, setMachine] = useState(machines[0]);
  const [weights, setWeights] = useState<Record<string,string>>({ 'Leg Press': '80' });
  const weight = Number(weights[machine] || 0);
  return <>
    <Card style={styles.warningCard}><Text style={styles.warningTitle}>DON'T TEST YOUR MAX</Text><Text style={styles.bodyText}>Use the heaviest weight you can complete for 10 controlled reps with good technique. The 1RM estimate is reference only.</Text></Card>
    <View style={styles.pills}>{machines.map((item) => <Pressable key={item} style={[styles.pill, machine === item && styles.pillActive]} onPress={() => setMachine(item)}><Text style={[styles.pillText, machine === item && styles.pillTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View>
    <Card style={styles.trackingCard}>
      <Text style={styles.label}>BEST 10-REP WEIGHT</Text><Text style={styles.bigValue}>{weight} <Text style={styles.bigUnit}>kg</Text></Text>
      <Text style={styles.listMeta}>ESTIMATED 1RM • REFERENCE ONLY</Text><Text style={styles.estimate}>≈ {Math.round(weight * 1.333)} kg</Text>
      <Text style={[styles.label, { marginTop: 16 }]}>LOG BEST 10-REP WEIGHT</Text>
      <TextInput style={styles.input} keyboardType="decimal-pad" value={weights[machine] || ''} onChangeText={(value) => setWeights((current) => ({ ...current, [machine]: value }))} placeholder="kg" placeholderTextColor={colours.muted} />
      <Pressable style={styles.primary}><Text style={styles.primaryText}>SAVE</Text></Pressable>
    </Card>
  </>;
}

function Targets() {
  const [month, setMonth] = useState('80');
  const [year, setYear] = useState('80');
  const [targetWeight, setTargetWeight] = useState('72');
  const [targetFat, setTargetFat] = useState('14');
  return <>
    <NumberField label="MONTH TARGET (%)" value={month} onChange={setMonth} />
    <NumberField label="YEAR TARGET (%)" value={year} onChange={setYear} />
    <NumberField label="TARGET WEIGHT (KG)" value={targetWeight} onChange={setTargetWeight} />
    <NumberField label="TARGET BODY FAT (%)" value={targetFat} onChange={setTargetFat} />
    <Card style={styles.infoCard}><Text style={styles.bodyText}>History Month and Year views use these targets to colour performance against goal.</Text></Card>
  </>;
}

function Measurements() {
  const available = ['Neck','Shoulders','Chest','Left Bicep','Right Bicep','Left Forearm','Right Forearm','Upper Abs','Waist','Lower Abs','Hips','Left Thigh','Right Thigh','Left Calf','Right Calf'];
  const [advanced, setAdvanced] = useState(false);
  const [values, setValues] = useState<Record<string,string>>({ Weight: '69.8', 'Body Fat': '15.1' });
  const [editing, setEditing] = useState<string | null>(null);
  const unit = editing === 'Body Fat' ? '%' : editing === 'Weight' ? 'kg' : 'cm';
  return <>
    <Text style={styles.sectionLabel}>CORE</Text>
    <Card style={styles.infoCard}><MeasurementCore name="Weight" value={`${values.Weight} kg`} onPress={() => setEditing('Weight')} /><View style={styles.divider} /><MeasurementCore name="Body Fat" value={`${values['Body Fat']}%`} onPress={() => setEditing('Body Fat')} /></Card>
    {editing ? <Card style={styles.infoCard}><Text style={styles.label}>{editing.toUpperCase()}</Text><View style={styles.inlineInput}><TextInput style={[styles.input, styles.flex]} keyboardType="decimal-pad" value={values[editing] || ''} onChangeText={(value) => setValues((current) => ({ ...current, [editing]: value }))} /><Text style={styles.inputUnit}>{unit}</Text></View><Pressable style={styles.primary} onPress={() => setEditing(null)}><Text style={styles.primaryText}>DONE</Text></Pressable></Card> : null}
    <Pressable style={styles.advancedToggle} onPress={() => setAdvanced((value) => !value)}><Text style={styles.advancedText}>ADVANCED SETTINGS</Text><Text style={styles.arrow}>{advanced ? '⌃' : '⌄'}</Text></Pressable>
    {advanced ? <><Text style={styles.sectionLabel}>AVAILABLE MEASUREMENTS</Text><Card style={styles.measureCard}>{available.map((item, index) => <Pressable key={item} style={[styles.measureRow, index < available.length - 1 && styles.measureBorder]} onPress={() => setEditing(item)}><View><Text style={styles.listTitle}>{item}</Text><Text style={styles.listMeta}>{values[item] ? `${values[item]} cm` : 'Optional tracking'}</Text></View><View style={styles.plusSmall}><Text style={styles.plusSmallText}>+</Text></View></Pressable>)}</Card></> : null}
  </>;
}

function TermDates() {
  const [periods, setPeriods] = useState([
    { id: 'autumn', name: 'Autumn Term', start: '2026-09-01', end: '2026-12-18' },
    { id: 'spring', name: 'Spring Term', start: '2027-01-05', end: '2027-03-26' },
    { id: 'summer', name: 'Summer Term', start: '2027-04-13', end: '2027-07-03' },
  ]);
  return <>{periods.map((period) => <Card key={period.id} style={styles.infoCard}><Text style={styles.termTitle}>{period.name}</Text><Text style={styles.label}>START • YYYY-MM-DD</Text><TextInput style={styles.input} value={period.start} onChangeText={(value) => setPeriods((items) => items.map((item) => item.id === period.id ? { ...item, start: value } : item))} /><Text style={[styles.label, { marginTop: 10 }]}>END • YYYY-MM-DD</Text><TextInput style={styles.input} value={period.end} onChangeText={(value) => setPeriods((items) => items.map((item) => item.id === period.id ? { ...item, end: value } : item))} /></Card>)}</>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Card style={styles.infoCard}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={value} onChangeText={onChange} /></Card>;
}

function MeasurementCore({ name, value, onPress }: { name: string; value: string; onPress: () => void }) { return <Pressable style={styles.rowBetween} onPress={onPress}><View><Text style={styles.listTitle}>{name}</Text><Text style={styles.listMeta}>Core measurement</Text></View><View style={styles.inlineInput}><Text style={styles.coreValue}>{value}</Text><Text style={styles.addLink}>+ ADD</Text></View></Pressable>; }

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoCard: { marginBottom: 10 },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  valueSmall: { color: colours.white, fontSize: 9, fontWeight: '800', marginTop: 4 },
  outlineButton: { borderWidth: 1, borderColor: colours.gold, borderRadius: 12, minHeight: 43, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  outlineText: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  search: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 11, color: colours.white, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 9 },
  pills: { flexDirection: 'row', gap: 5, marginBottom: 9, flexWrap: 'wrap' },
  pill: { backgroundColor: colours.card2, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  pillActive: { backgroundColor: colours.gold },
  pillText: { color: colours.muted, fontSize: 7, fontWeight: '900' },
  pillTextActive: { color: colours.background },
  count: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1, marginBottom: 7 },
  listCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 9 },
  listIcon: { width: 41, height: 41, borderRadius: 10, backgroundColor: colours.card2, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  listEmoji: { fontSize: 20, color: colours.gold, fontWeight: '900' },
  listTitle: { color: colours.white, fontSize: 11, fontWeight: '900' },
  listMeta: { color: colours.muted, fontSize: 8, fontWeight: '700', marginTop: 3 },
  arrow: { color: colours.gold, fontSize: 22 },
  star: { color: colours.border, fontSize: 22, paddingHorizontal: 4 },
  starOn: { color: colours.gold },
  bodyText: { color: colours.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  warningCard: { borderColor: colours.gold, marginBottom: 10 },
  warningTitle: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  trackingCard: { marginTop: 2 },
  bigValue: { color: colours.white, fontSize: 32, fontWeight: '900', marginTop: 5 },
  bigUnit: { fontSize: 14 },
  estimate: { color: colours.white, fontSize: 20, fontWeight: '900', marginTop: 3 },
  input: { backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 10, color: colours.white, paddingHorizontal: 13, paddingVertical: 11, marginTop: 6 },
  primary: { backgroundColor: colours.gold, borderRadius: 11, minHeight: 43, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primaryText: { color: colours.background, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 3, marginBottom: 7 },
  divider: { height: 1, backgroundColor: colours.border, marginVertical: 10 },
  coreValue: { color: colours.white, fontSize: 16, fontWeight: '900' },
  addLink: { color: colours.gold, fontSize: 8, fontWeight: '900', marginLeft: 10 },
  inlineInput: { flexDirection: 'row', alignItems: 'center' },
  inputUnit: { color: colours.white, fontSize: 13, fontWeight: '900', marginLeft: 8, marginTop: 6 },
  advancedToggle: { borderWidth: 1, borderColor: colours.border, borderRadius: 11, minHeight: 45, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  advancedText: { color: colours.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  measureCard: { paddingVertical: 3 },
  measureRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 },
  measureBorder: { borderBottomWidth: 1, borderBottomColor: colours.border },
  plusSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: colours.gold, alignItems: 'center', justifyContent: 'center' },
  plusSmallText: { color: colours.background, fontSize: 19, fontWeight: '700' },
  termTitle: { color: colours.white, fontSize: 15, fontWeight: '900', marginBottom: 10 },
  timingRow: { flexDirection: 'row', alignItems: 'center', minHeight: 62, marginBottom: 8 },
  timingInput: { width: 55, backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 9, color: colours.white, paddingVertical: 9, textAlign: 'center', fontWeight: '900' },
  suffix: { color: colours.muted, fontSize: 8, fontWeight: '800', marginLeft: 7 },
});
