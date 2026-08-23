import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { formatSchoolDate, getLinkedSchool, getSchoolCalendar, getSubscribedSchools, linkSchool, School, SchoolCalendarEntry } from '@/features/schools/school.service';
import { colours } from '@/theme/colours';

const TYPE_LABEL: Record<SchoolCalendarEntry['entry_type'], string> = {
  term: 'TERM',
  half_term: 'HALF TERM',
  exeat: 'EXEAT',
  inset: 'INSET',
};

export default function SchoolLinkScreen() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selected, setSelected] = useState<School | null>(null);
  const [calendar, setCalendar] = useState<SchoolCalendarEntry[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let live = true;
    async function load() {
      const [list, linked] = await Promise.all([getSubscribedSchools(), getLinkedSchool()]);
      if (!live) return;
      setSchools(list);
      setSelected(linked.school);
      setCalendar(linked.calendar);
    }
    load().catch(() => { if (live) setMessage('Could not load subscribed schools.'); });
    return () => { live = false; };
  }, []));

  async function chooseSchool(school: School) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const dates = await getSchoolCalendar(school.id);
      await linkSchool(school.id);
      setSelected(school);
      setCalendar(dates);
      setMessage(`Linked to ${school.name}.`);
    } catch {
      setMessage('Could not link this school.');
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    if (busy) return;
    setBusy(true);
    try {
      await linkSchool(null);
      setSelected(null);
      setCalendar([]);
      setMessage('School link removed.');
    } catch {
      setMessage('Could not remove school link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Link to my school</Text>
      <Text style={styles.subtitle}>Choose a subscribed school. Its term calendar becomes read-only and is used by the app to decide Term Time or Holiday.</Text>

      <Text style={styles.sectionTitle}>SUBSCRIBED SCHOOLS</Text>
      {schools.map((school) => {
        const active = selected?.id === school.id;
        return (
          <Pressable key={school.id} onPress={() => chooseSchool(school)} disabled={busy}>
            <Card style={[styles.schoolCard, active && styles.schoolCardActive]}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={[styles.schoolName, active && styles.activeText]}>{school.name}</Text>
                  <Text style={[styles.schoolType, active && styles.activeMuted]}>{school.school_mode ? school.school_mode.toUpperCase() : 'SCHOOL'}</Text>
                </View>
                <Text style={[styles.selectText, active && styles.activeText]}>{active ? 'LINKED ✓' : 'SELECT →'}</Text>
              </View>
            </Card>
          </Pressable>
        );
      })}

      {selected ? (
        <>
          <View style={styles.calendarHeading}>
            <View>
              <Text style={styles.sectionTitle}>SCHOOL DATES</Text>
              <Text style={styles.readOnly}>READ ONLY • {selected.name.toUpperCase()}</Text>
            </View>
            <Pressable onPress={unlink} disabled={busy}><Text style={styles.unlink}>UNLINK</Text></Pressable>
          </View>
          {calendar.length === 0 ? <Card><Text style={styles.muted}>No dates have been published for this school yet.</Text></Card> : calendar.map((entry) => (
            <Card key={entry.id} style={styles.dateCard}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.entryType}>{TYPE_LABEL[entry.entry_type]}</Text>
                  <Text style={styles.entryName}>{entry.name}</Text>
                </View>
                <Text style={styles.dateText}>{formatSchoolDate(entry.start_date)}{entry.end_date !== entry.start_date ? `\n${formatSchoolDate(entry.end_date)}` : ''}</Text>
              </View>
            </Card>
          ))}
        </>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  sectionTitle: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.9, marginBottom: 8 },
  schoolCard: { marginBottom: 9 },
  schoolCardActive: { backgroundColor: colours.gold, borderColor: colours.gold },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1 },
  schoolName: { color: colours.white, fontSize: 15, fontWeight: '900' },
  schoolType: { color: colours.muted, fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: 0.6 },
  selectText: { color: colours.gold, fontSize: 9, fontWeight: '900', marginLeft: 10 },
  activeText: { color: colours.background },
  activeMuted: { color: colours.background, opacity: 0.7 },
  calendarHeading: { marginTop: 10, marginBottom: 2, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  readOnly: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.6, marginTop: -3 },
  unlink: { color: colours.red, fontSize: 8, fontWeight: '900', marginBottom: 7 },
  dateCard: { marginBottom: 7, paddingVertical: 11 },
  entryType: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  entryName: { color: colours.white, fontSize: 12, fontWeight: '900', marginTop: 3 },
  dateText: { color: colours.white, fontSize: 10, lineHeight: 16, textAlign: 'right', fontWeight: '800', marginLeft: 12 },
  muted: { color: colours.muted, fontSize: 10 },
  message: { color: colours.gold, fontSize: 9, lineHeight: 14, marginTop: 8, marginBottom: 10 },
});
