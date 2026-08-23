import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { colours } from '@/theme/colours';

export default function TargetsScreen() {
  const [month, setMonth] = useState('80');
  const [year, setYear] = useState('80');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from('user_settings').select('month_target_percent,year_target_percent,target_weight_kg,target_body_fat_percent').eq('user_id', userData.user.id).maybeSingle();
      if (!live || !data) return;
      setMonth(String(data.month_target_percent ?? 80));
      setYear(String(data.year_target_percent ?? 80));
      setWeight(data.target_weight_kg != null ? String(data.target_weight_kg) : '');
      setBodyFat(data.target_body_fat_percent != null ? String(data.target_body_fat_percent) : '');
    }
    void load(); return () => { live = false; };
  }, []));

  async function save() {
    if (!supabase || busy) return;
    const monthValue = Number(month), yearValue = Number(year), weightValue = weight.trim() ? Number(weight) : null, fatValue = bodyFat.trim() ? Number(bodyFat) : null;
    if (!Number.isFinite(monthValue) || monthValue < 0 || monthValue > 100 || !Number.isFinite(yearValue) || yearValue < 0 || yearValue > 100) { setMessage('Month and year targets must be between 0 and 100%.'); return; }
    if (weightValue != null && (!Number.isFinite(weightValue) || weightValue < 20 || weightValue > 300)) { setMessage('Enter a target weight between 20 and 300 kg.'); return; }
    if (fatValue != null && (!Number.isFinite(fatValue) || fatValue < 1 || fatValue > 80)) { setMessage('Enter a sensible body-fat target.'); return; }
    setBusy(true); setMessage('');
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Authentication required.');
      const { error } = await supabase.from('user_settings').upsert({ user_id: userData.user.id, month_target_percent: monthValue, year_target_percent: yearValue, target_weight_kg: weightValue, target_body_fat_percent: fatValue, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      setMessage('Targets saved.');
    } catch (error: any) { setMessage(error?.message || 'Could not save targets.'); }
    finally { setBusy(false); }
  }

  return <Screen><Brand/><BackButton/><Text style={styles.title}>Targets</Text><Text style={styles.subtitle}>Set the goals used across History and Stats.</Text>
    <NumberField label="MONTH TARGET (%)" value={month} onChange={setMonth}/><NumberField label="YEAR TARGET (%)" value={year} onChange={setYear}/><NumberField label="TARGET WEIGHT (KG)" value={weight} onChange={setWeight}/><NumberField label="TARGET BODY FAT (%)" value={bodyFat} onChange={setBodyFat}/>
    {message ? <Text style={styles.message}>{message}</Text> : null}<Pressable style={[styles.primary,busy&&styles.disabled]} onPress={()=>void save()} disabled={busy}><Text style={styles.primaryText}>{busy?'SAVING…':'SAVE TARGETS'}</Text></Pressable>
  </Screen>;
}
function NumberField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <Card style={styles.card}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={value} onChangeText={onChange}/></Card>}
const styles=StyleSheet.create({title:{color:colours.white,fontSize:30,lineHeight:34,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:17},card:{marginBottom:9},label:{color:colours.gold,fontSize:8,fontWeight:'900',letterSpacing:.8},input:{backgroundColor:colours.card2,color:colours.white,borderRadius:10,padding:13,marginTop:8},primary:{backgroundColor:colours.gold,borderRadius:10,minHeight:48,alignItems:'center',justifyContent:'center',marginTop:3},primaryText:{color:colours.background,fontSize:11,fontWeight:'900',letterSpacing:.6},disabled:{opacity:.45},message:{color:colours.gold,fontSize:9,lineHeight:14,marginVertical:7}});