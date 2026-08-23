import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ExpandChevron } from '@/components/ExpandChevron';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

export default function MeasurementsScreen() {
  const available = ['Neck','Shoulders','Chest','Left Bicep','Right Bicep','Left Forearm','Right Forearm','Upper Abs','Waist','Lower Abs','Hips','Left Thigh','Right Thigh','Left Calf','Right Calf'];
  const [advanced, setAdvanced] = useState(false);
  const [values, setValues] = useState<Record<string,string>>({ Weight: '', 'Body Fat': '15.1' });
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const unit = editing === 'Body Fat' ? '%' : editing === 'Weight' ? 'kg' : 'cm';

  useFocusEffect(useCallback(() => {
    let live = true;
    async function loadWeight() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from('profiles').select('current_weight_kg').eq('id', userData.user.id).single();
      if (live && data?.current_weight_kg != null) {
        setValues((current) => ({ ...current, Weight: String(data.current_weight_kg) }));
      }
    }
    loadWeight().catch(() => {});
    return () => { live = false; };
  }, []));

  async function doneEditing() {
    if (!editing) return;
    if (editing !== 'Weight' || !supabase) {
      setEditing(null);
      return;
    }
    const weight = Number(values.Weight);
    if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
      setMessage('Enter a weight between 20 and 300 kg.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setBusy(false);
      setMessage('Could not find your account.');
      return;
    }
    const { error } = await supabase.from('profiles').update({ current_weight_kg: weight }).eq('id', userData.user.id);
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage('Weight saved.');
      setEditing(null);
    }
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Stats & Measurements</Text>
      <Text style={styles.subtitle}>Core and advanced measurements.</Text>

      <Text style={styles.sectionLabel}>CORE</Text>
      <Card style={styles.infoCard}>
        <MeasurementCore name="Weight" value={values.Weight ? `${values.Weight} kg` : 'Not set'} onPress={() => { setMessage(''); setEditing('Weight'); }} />
        <View style={styles.divider} />
        <MeasurementCore name="Body Fat" value={`${values['Body Fat']}%`} onPress={() => { setMessage(''); setEditing('Body Fat'); }} />
      </Card>

      {editing ? (
        <Card style={styles.infoCard}>
          <Text style={styles.label}>{editing.toUpperCase()}</Text>
          <View style={styles.inlineInput}>
            <TextInput style={[styles.input, styles.flex]} keyboardType="decimal-pad" value={values[editing] || ''} onChangeText={(value) => setValues((current) => ({ ...current, [editing]: value }))} />
            <Text style={styles.inputUnit}>{unit}</Text>
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={doneEditing}><Text style={styles.primaryText}>{busy ? 'SAVING…' : 'DONE'}</Text></Pressable>
        </Card>
      ) : message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.advancedToggle} onPress={() => setAdvanced((value) => !value)}>
        <Text style={styles.advancedText}>ADVANCED SETTINGS</Text>
        <ExpandChevron expanded={advanced} />
      </Pressable>

      {advanced ? (
        <>
          <Text style={styles.sectionLabel}>AVAILABLE MEASUREMENTS</Text>
          <Card style={styles.measureCard}>
            {available.map((item, index) => (
              <Pressable key={item} style={[styles.measureRow, index < available.length - 1 && styles.measureBorder]} onPress={() => setEditing(item)}>
                <View>
                  <Text style={styles.listTitle}>{item}</Text>
                  <Text style={styles.listMeta}>{values[item] ? `${values[item]} cm` : 'Optional tracking'}</Text>
                </View>
                <View style={styles.plusSmall}><Text style={styles.plusSmallText}>+</Text></View>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function MeasurementCore({ name, value, onPress }: { name: string; value: string; onPress: () => void }) {
  return (
    <View style={styles.rowBetween}>
      <View style={styles.flex}>
        <Text style={styles.listTitle}>{name}</Text>
        <Text style={styles.listMeta}>Core measurement</Text>
      </View>
      <Text style={styles.coreValue}>{value}</Text>
      <Pressable style={styles.compactAdd} onPress={onPress}>
        <Text style={styles.compactAddText}>+ ADD</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8 },
  infoCard: { marginBottom: 10 },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  input: { backgroundColor: colours.card2, color: colours.white, borderRadius: 10, padding: 13, marginTop: 8 },
  inlineInput: { flexDirection: 'row', alignItems: 'center' },
  inputUnit: { color: colours.white, fontSize: 13, fontWeight: '900', marginLeft: 8, marginTop: 6 },
  primary: { backgroundColor: colours.gold, borderRadius: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  primaryText: { color: colours.background, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  message: { color: colours.gold, fontSize: 9, lineHeight: 14, marginTop: 7 },
  divider: { height: 1, backgroundColor: colours.border, marginVertical: 10 },
  listTitle: { color: colours.white, fontSize: 12, fontWeight: '900' },
  listMeta: { color: colours.muted, fontSize: 8, marginTop: 3 },
  coreValue: { color: colours.white, fontSize: 16, fontWeight: '900', marginRight: 10 },
  compactAdd: { minHeight: 32, minWidth: 68, borderWidth: 1, borderColor: colours.gold, borderRadius: 9, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colours.card },
  compactAddText: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  advancedToggle: { borderWidth: 1, borderColor: colours.border, borderRadius: 11, minHeight: 45, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  advancedText: { color: colours.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  measureCard: { paddingVertical: 3 },
  measureRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 },
  measureBorder: { borderBottomWidth: 1, borderBottomColor: colours.border },
  plusSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: colours.gold, alignItems: 'center', justifyContent: 'center' },
  plusSmallText: { color: colours.background, fontSize: 18, lineHeight: 20, fontWeight: '700' },
});