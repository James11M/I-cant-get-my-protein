import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { Screen } from '@/components/Screen';
import { Activity, addActivityLog, getActivity, getActivityLog, removeActivityLog, updateActivityLog } from '@/features/activities/activity.service';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

const QUICK_MINUTES = [15, 30, 45, 60, 75, 90];

export default function ActivityLogScreen() {
  const { session } = useAuth();
  const { id, date, logId } = useLocalSearchParams<{ id?: string; date?: string; logId?: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityName, setActivityName] = useState('Activity');
  const [activityIcon, setActivityIcon] = useState('⚡');
  const [amount, setAmount] = useState('');
  const [minutes, setMinutes] = useState('');
  const [originalMinutes, setOriginalMinutes] = useState<number | null>(null);
  const [performedDate, setPerformedDate] = useState<string | undefined>(date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editing = Boolean(logId);

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        setError('');
        if (logId) {
          const log = await getActivityLog(logId);
          if (!live) return;
          setActivityName(log.activity_name);
          setActivityIcon(log.activity_icon || '⚡');
          setMinutes(String(Number(log.duration_minutes)));
          setOriginalMinutes(Number(log.duration_minutes));
          setAmount(String(Number(log.amount ?? log.duration_minutes)));
          setPerformedDate(dateOnly(new Date(log.performed_at)));
          if (log.activity_id) {
            const definition = await getActivity(log.activity_id);
            if (!live) return;
            setActivity(definition);
          } else {
            setActivity(null);
          }
          return;
        }
        if (!id) return;
        const item = await getActivity(id);
        if (!live) return;
        setActivity(item);
        setActivityName(item.name);
        setActivityIcon(item.icon || '⚡');
        setAmount(item.measure_type === 'time' ? '' : String(item.default_target || 0));
        setMinutes('');
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : 'Could not load activity.');
      }
    }
    void load();
    return () => { live = false; };
  }, [id, logId]);

  const manualMinutes = Number(minutes) || 0;
  const numericAmount = Number(amount) || 0;

  async function saveWithMinutes(duration: number) {
    if (!session?.user.id || duration <= 0 || (!editing && !activity)) { setError('Please enter what you actually did.'); return; }
    const loggedAmount = activity?.measure_type === 'time' || !activity ? duration : numericAmount;
    if (loggedAmount <= 0) { setError(`Please enter the amount in ${activity?.unit || 'the activity unit'} first.`); return; }
    try {
      setSaving(true); setError('');
      if (logId) {
        await updateActivityLog(logId, activity, duration, loggedAmount);
        router.replace('/(app)/history');
      } else if (activity) {
        await addActivityLog({ userId: session.user.id, activity, durationMinutes: duration, amount: loggedAmount, ...(date ? { performedAt: dateAtNoon(date) } : {}) });
        router.replace(date ? '/(app)/history' : '/(app)');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save activity.'); } finally { setSaving(false); }
  }

  async function removeExisting() {
    if (!logId || saving) return;
    try {
      setSaving(true); setError('');
      await removeActivityLog(logId);
      router.replace('/(app)/history');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove activity.'); } finally { setSaving(false); }
  }

  return (
    <Screen>
      <Brand /><BackButton />
      <Text style={styles.hero}>{activityIcon}</Text><Text style={styles.title}>{activityName}</Text>
      {performedDate ? <Text style={styles.dateLabel}>{editing ? 'EDITING' : 'ADDING TO'} {formatDate(performedDate)}</Text> : null}
      <Card style={styles.card}>
        {activity && activity.measure_type !== 'time' ? <Field label={`AMOUNT (${activity.unit})`} value={amount} onChangeText={setAmount} /> : null}
        <Text style={styles.label}>DURATION</Text>
        <View style={styles.quickGrid}>{QUICK_MINUTES.map((value) => {
          const selected = editing && originalMinutes === value;
          return <Pressable key={value} style={[styles.quickButton, selected && styles.quickButtonSelected]} onPress={() => saveWithMinutes(value)} disabled={saving}><Text style={[styles.quickValue, selected && styles.quickValueSelected]}>{value}</Text><Text style={[styles.quickUnit, selected && styles.quickUnitSelected]}>MIN</Text></Pressable>;
        })}</View>
        <Text style={styles.or}>OR ENTER MINUTES</Text>
        <View style={styles.manualRow}><TextInput style={[styles.input, styles.manualInput]} value={minutes} onChangeText={setMinutes} keyboardType="numeric" placeholder="Minutes" placeholderTextColor={colours.muted} />{manualMinutes > 0 && (!editing || manualMinutes !== originalMinutes) ? <PrimaryActionButton label={saving ? 'SAVING…' : editing ? 'SAVE CHANGE' : 'LOG ACTIVITY'} onPress={() => saveWithMinutes(manualMinutes)} disabled={saving} style={styles.inlineLog} /> : null}</View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
      {editing ? <Pressable style={styles.removeButton} onPress={removeExisting} disabled={saving}><Text style={styles.removeText}>✕ REMOVE</Text></Pressable> : null}
    </Screen>
  );
}
function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) { return <><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType="numeric" placeholderTextColor={colours.muted} /></>; }
function dateAtNoon(value: string) { return `${value}T12:00:00`; }
function dateOnly(value: Date) { return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`; }
function formatDate(value: string) { const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`; }
const styles = StyleSheet.create({
  hero:{fontSize:42,marginTop:4},title:{color:colours.white,fontSize:30,fontWeight:'900',marginTop:2,marginBottom:4},dateLabel:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:.8,marginBottom:12},card:{paddingTop:8},label:{color:colours.gold,fontSize:8,fontWeight:'900',letterSpacing:1.1,marginTop:10,marginBottom:6},input:{backgroundColor:colours.card2,borderWidth:1,borderColor:colours.border,borderRadius:10,color:colours.white,paddingHorizontal:13,paddingVertical:11,fontSize:15},quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},quickButton:{width:'31%',minHeight:58,borderWidth:1,borderColor:colours.gold,borderRadius:10,backgroundColor:colours.card2,alignItems:'center',justifyContent:'center'},quickButtonSelected:{backgroundColor:colours.gold},quickValue:{color:colours.white,fontSize:18,fontWeight:'900'},quickValueSelected:{color:colours.background},quickUnit:{color:colours.gold,fontSize:7,fontWeight:'900',letterSpacing:.8,marginTop:1},quickUnitSelected:{color:colours.background},or:{color:colours.muted,fontSize:8,fontWeight:'900',letterSpacing:.8,marginTop:16,marginBottom:6},manualRow:{flexDirection:'row',alignItems:'stretch',gap:8},manualInput:{flex:1},inlineLog:{minHeight:46,flex:1.15},error:{color:colours.red,marginTop:12,fontSize:11},removeButton:{minHeight:48,borderWidth:1,borderColor:colours.red,borderRadius:11,alignItems:'center',justifyContent:'center',marginTop:12,marginBottom:8},removeText:{color:colours.red,fontSize:11,fontWeight:'900',letterSpacing:.8}
});
