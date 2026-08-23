import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Activity, createCustomActivity, getAllActivities, getHiddenActivityIds, setActivityHidden, updateOwnActivity } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

export default function SportsSettingsScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [items, hiddenIds] = await Promise.all([getAllActivities(), getHiddenActivityIds()]);
    setActivities(items);
    setHidden(hiddenIds);
  }, []);

  useFocusEffect(useCallback(() => { void load().catch(() => setMessage('Could not load activities.')); }, [load]));

  function startAdd() {
    setAdding(true); setEditingId(null); setName(''); setIcon('⭐'); setMessage('');
  }

  function startEdit(activity: Activity) {
    setAdding(false); setEditingId(activity.id); setName(activity.name); setIcon(activity.icon || '⭐'); setMessage('');
  }

  function closeEditor() {
    setAdding(false); setEditingId(null); setName(''); setIcon('⭐'); setMessage('');
  }

  async function save() {
    if (!name.trim()) { setMessage('Enter an activity name.'); return; }
    try {
      setMessage('');
      if (editingId) await updateOwnActivity(editingId, { name, icon });
      else await createCustomActivity({ name, icon });
      closeEditor();
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save activity.'); }
  }

  async function toggleHidden(activity: Activity) {
    const next = !hidden.includes(activity.id);
    setHidden((items) => next ? [...items, activity.id] : items.filter((id) => id !== activity.id));
    try { await setActivityHidden(activity.id, next); }
    catch { setHidden((items) => next ? items.filter((id) => id !== activity.id) : [...items, activity.id]); }
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Sports & Activities</Text>
      <Text style={styles.subtitle}>Choose which activities appear when logging training. Hidden activities remain safely in your History.</Text>

      <Pressable style={styles.addButton} onPress={startAdd}><Text style={styles.addText}>+ ADD SPORT / ACTIVITY</Text></Pressable>

      {adding || editingId ? (
        <Card style={styles.editorCard}>
          <Text style={styles.sectionTitle}>{editingId ? 'EDIT ACTIVITY' : 'NEW ACTIVITY'}</Text>
          <Text style={styles.label}>ICON</Text>
          <TextInput style={styles.iconInput} value={icon} onChangeText={setIcon} maxLength={4} />
          <Text style={styles.label}>NAME</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Fives" placeholderTextColor={colours.muted} />
          <View style={styles.editorActions}>
            <Pressable style={styles.cancelButton} onPress={closeEditor}><Text style={styles.cancelText}>CANCEL</Text></Pressable>
            <Pressable style={styles.saveButton} onPress={save}><Text style={styles.saveText}>SAVE</Text></Pressable>
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>ACTIVITY LIBRARY</Text>
      {activities.map((activity) => {
        const isHidden = hidden.includes(activity.id);
        const canEdit = !activity.is_system && Boolean(activity.owner_user_id);
        return (
          <Card key={activity.id} style={[styles.activityCard, isHidden && styles.hiddenCard]}>
            <View style={styles.row}>
              <Text style={[styles.emoji, isHidden && styles.dim]}>{activity.icon || '⚡'}</Text>
              <View style={styles.flex}>
                <Text style={[styles.activityTitle, isHidden && styles.dim]}>{activity.name}</Text>
                <Text style={styles.meta}>{activity.is_system ? 'SYSTEM' : 'MY ACTIVITY'} • {activity.category} • {activity.default_target ?? 30} {activity.unit}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              {canEdit ? <Pressable style={styles.editButton} onPress={() => startEdit(activity)}><Text style={styles.editText}>✎ EDIT</Text></Pressable> : <View />}
              <Pressable style={[styles.visibilityButton, isHidden && styles.restoreButton]} onPress={() => toggleHidden(activity)}><Text style={[styles.visibilityText, isHidden && styles.restoreText]}>{isHidden ? 'SHOW' : 'HIDE'}</Text></Pressable>
            </View>
          </Card>
        );
      })}
      {!adding && !editingId && message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title:{color:colours.white,fontSize:30,lineHeight:34,fontWeight:'900'},
  subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:16},
  addButton:{minHeight:48,borderWidth:1,borderColor:colours.gold,borderRadius:11,alignItems:'center',justifyContent:'center',marginBottom:12},
  addText:{color:colours.gold,fontSize:10,fontWeight:'900',letterSpacing:.7},
  editorCard:{borderColor:colours.gold,marginBottom:14},sectionTitle:{color:colours.white,fontSize:11,fontWeight:'900',letterSpacing:.8},
  label:{color:colours.gold,fontSize:8,fontWeight:'900',letterSpacing:.8,marginTop:11,marginBottom:5},
  input:{minHeight:44,borderWidth:1,borderColor:colours.border,borderRadius:9,backgroundColor:colours.card2,color:colours.white,paddingHorizontal:11,fontSize:14},
  iconInput:{width:72,minHeight:44,borderWidth:1,borderColor:colours.border,borderRadius:9,backgroundColor:colours.card2,color:colours.white,textAlign:'center',fontSize:22},
  editorActions:{flexDirection:'row',gap:8,marginTop:12},cancelButton:{flex:1,minHeight:42,borderWidth:1,borderColor:colours.border,borderRadius:9,alignItems:'center',justifyContent:'center'},cancelText:{color:colours.muted,fontSize:9,fontWeight:'900'},saveButton:{flex:1,minHeight:42,borderRadius:9,backgroundColor:colours.gold,alignItems:'center',justifyContent:'center'},saveText:{color:colours.background,fontSize:10,fontWeight:'900'},
  sectionLabel:{color:colours.gold,fontSize:9,fontWeight:'900',letterSpacing:1,marginBottom:8},activityCard:{marginBottom:8,paddingBottom:9},hiddenCard:{opacity:.72},
  row:{flexDirection:'row',alignItems:'center'},emoji:{fontSize:27,width:45},flex:{flex:1},activityTitle:{color:colours.white,fontSize:13,fontWeight:'900'},meta:{color:colours.muted,fontSize:8,fontWeight:'700',marginTop:3},dim:{opacity:.5},
  actions:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:colours.border,marginTop:10,paddingTop:9},editButton:{minHeight:32,paddingHorizontal:9,borderWidth:1,borderColor:colours.gold,borderRadius:7,alignItems:'center',justifyContent:'center'},editText:{color:colours.gold,fontSize:8,fontWeight:'900'},visibilityButton:{minHeight:32,paddingHorizontal:12,borderWidth:1,borderColor:colours.red,borderRadius:7,alignItems:'center',justifyContent:'center'},visibilityText:{color:colours.red,fontSize:8,fontWeight:'900'},restoreButton:{borderColor:colours.green},restoreText:{color:colours.green},message:{color:colours.red,fontSize:9,lineHeight:14,marginTop:9}
});
