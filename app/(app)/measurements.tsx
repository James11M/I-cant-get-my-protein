import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ExpandChevron } from '@/components/ExpandChevron';
import { Screen } from '@/components/Screen';
import { ALL_MEASUREMENTS, getMeasurementSummaries, MeasurementSummary, MeasurementType, saveMeasurement, setCoreMeasurement, unitFor } from '@/features/measurements/measurements.service';
import { colours } from '@/theme/colours';

export default function MeasurementsScreen() {
  const { metric } = useLocalSearchParams<{ metric?: string }>();
  const [summaries, setSummaries] = useState<MeasurementSummary[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const [editing, setEditing] = useState<MeasurementType | null>(null);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await getMeasurementSummaries();
      setSummaries(rows);
      if (metric && ALL_MEASUREMENTS.includes(metric as MeasurementType)) {
        const selected = rows.find((row) => row.type === metric);
        setEditing(metric as MeasurementType);
        setInput(selected?.current != null ? String(selected.current) : '');
      }
    } catch (error: any) { setMessage(error?.message || 'Could not load measurements.'); }
  }, [metric]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const core = useMemo(() => summaries.filter((item) => item.isCore), [summaries]);
  const available = useMemo(() => summaries.filter((item) => !item.isCore), [summaries]);

  function startEdit(type: MeasurementType) {
    const item = summaries.find((row) => row.type === type);
    setMessage('');
    setEditing(type);
    setInput(item?.current != null ? String(item.current) : '');
  }

  async function save() {
    if (!editing || busy) return;
    const value = Number(input);
    if (!Number.isFinite(value) || value < 0 || (editing === 'Weight' && (value < 20 || value > 300)) || (editing === 'Body Fat' && value > 80)) {
      setMessage('Enter a sensible measurement value.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      await saveMeasurement(editing, value);
      setMessage(`${editing} saved.`);
      setEditing(null);
      setInput('');
      await load();
    } catch (error: any) { setMessage(error?.message || 'Could not save measurement.'); }
    finally { setBusy(false); }
  }

  async function toggleCore(type: MeasurementType, enabled: boolean) {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await setCoreMeasurement(type, enabled); await load(); }
    catch (error: any) { setMessage(error?.message || 'Could not update Core measurements.'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Stats & Measurements</Text>
      <Text style={styles.subtitle}>Choose what appears in Core and keep your measurements up to date.</Text>

      <Text style={styles.sectionLabel}>CORE</Text>
      <Card style={styles.infoCard}>
        {core.map((item, index) => <View key={item.type}>
          <View style={styles.rowBetween}>
            <Pressable style={styles.rowMain} onPress={() => startEdit(item.type)}>
              <Text style={styles.listTitle}>{item.type}</Text>
              <Text style={styles.listMeta}>{item.current != null ? `${formatValue(item.current)} ${item.unit}` : 'No measurement yet'}{item.target != null ? ` • goal ${formatValue(item.target)} ${item.unit}` : ''}</Text>
            </Pressable>
            <Pressable style={styles.compactAdd} onPress={() => startEdit(item.type)}><Text style={styles.compactAddText}>+ ADD</Text></Pressable>
            {!['Weight','Body Fat'].includes(item.type) ? <Pressable style={styles.removeCore} onPress={() => void toggleCore(item.type, false)}><Text style={styles.removeCoreText}>×</Text></Pressable> : null}
          </View>
          {index < core.length - 1 ? <View style={styles.divider} /> : null}
        </View>)}
      </Card>

      {editing ? <Card style={styles.infoCard}>
        <Text style={styles.label}>{editing.toUpperCase()}</Text>
        <View style={styles.inlineInput}>
          <TextInput style={[styles.input, styles.flex]} keyboardType="decimal-pad" value={input} onChangeText={setInput} autoFocus />
          <Text style={styles.inputUnit}>{unitFor(editing)}</Text>
        </View>
        <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={() => void save()}><Text style={styles.primaryText}>{busy ? 'SAVING…' : 'DONE'}</Text></Pressable>
      </Card> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.advancedToggle} onPress={() => setAdvanced((value) => !value)}>
        <Text style={styles.advancedText}>ADVANCED SETTINGS</Text><ExpandChevron expanded={advanced} />
      </Pressable>

      {advanced ? <>
        <Text style={styles.sectionLabel}>AVAILABLE MEASUREMENTS</Text>
        <Card style={styles.measureCard}>
          {available.map((item, index) => <View key={item.type} style={[styles.measureRow, index < available.length - 1 && styles.measureBorder]}>
            <Pressable style={styles.rowMain} onPress={() => startEdit(item.type)}>
              <Text style={styles.listTitle}>{item.type}</Text>
              <Text style={styles.listMeta}>{item.current != null ? `${formatValue(item.current)} ${item.unit}` : 'Optional tracking'}</Text>
            </Pressable>
            <Pressable style={styles.addCore} onPress={() => void toggleCore(item.type, true)}><Text style={styles.addCoreText}>+ CORE</Text></Pressable>
          </View>)}
        </Card>
      </> : null}
    </Screen>
  );
}

function formatValue(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }

const styles = StyleSheet.create({
  title:{color:colours.white,fontSize:30,lineHeight:34,fontWeight:'900'}, subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:17}, flex:{flex:1},
  sectionLabel:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1.1,marginBottom:8}, infoCard:{marginBottom:10},
  rowBetween:{flexDirection:'row',alignItems:'center',minHeight:52}, rowMain:{flex:1,paddingVertical:4}, divider:{height:1,backgroundColor:colours.border,marginVertical:7},
  listTitle:{color:colours.white,fontSize:12,fontWeight:'900'}, listMeta:{color:colours.muted,fontSize:8,marginTop:3},
  compactAdd:{minHeight:32,minWidth:68,borderWidth:1,borderColor:colours.gold,borderRadius:9,paddingHorizontal:10,alignItems:'center',justifyContent:'center',backgroundColor:colours.card},compactAddText:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:.7},
  removeCore:{width:28,height:28,borderRadius:14,borderWidth:1,borderColor:colours.red,alignItems:'center',justifyContent:'center',marginLeft:8},removeCoreText:{color:colours.red,fontSize:17,lineHeight:19},
  label:{color:colours.gold,fontSize:8,fontWeight:'900',letterSpacing:.8},inlineInput:{flexDirection:'row',alignItems:'center'},input:{backgroundColor:colours.card2,color:colours.white,borderRadius:10,padding:13,marginTop:8},inputUnit:{color:colours.white,fontSize:13,fontWeight:'900',marginLeft:8,marginTop:6},
  primary:{backgroundColor:colours.gold,borderRadius:10,minHeight:44,alignItems:'center',justifyContent:'center',marginTop:11},primaryText:{color:colours.background,fontSize:10,fontWeight:'900'},disabled:{opacity:.45},message:{color:colours.gold,fontSize:9,lineHeight:14,marginBottom:9},
  advancedToggle:{borderWidth:1,borderColor:colours.border,borderRadius:11,minHeight:45,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},advancedText:{color:colours.white,fontSize:9,fontWeight:'900',letterSpacing:.8},
  measureCard:{paddingVertical:3},measureRow:{minHeight:54,flexDirection:'row',alignItems:'center',paddingHorizontal:3},measureBorder:{borderBottomWidth:1,borderBottomColor:colours.border},
  addCore:{minHeight:32,minWidth:68,borderWidth:1,borderColor:colours.gold,borderRadius:9,alignItems:'center',justifyContent:'center',paddingHorizontal:9},addCoreText:{color:colours.gold,fontSize:8,fontWeight:'900'}
});