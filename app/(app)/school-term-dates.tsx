import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { formatSchoolDate, getLinkedSchool, School, SchoolCalendarEntry } from '@/features/schools/school.service';
import { colours } from '@/theme/colours';

const LABELS: Record<SchoolCalendarEntry['entry_type'], string> = { term: 'TERM', half_term: 'HALF TERM', exeat: 'EXEAT', inset: 'INSET' };

export default function SchoolTermDatesScreen() {
  const [school, setSchool] = useState<School | null>(null);
  const [calendar, setCalendar] = useState<SchoolCalendarEntry[]>([]);

  useFocusEffect(useCallback(() => {
    let live = true;
    getLinkedSchool().then((result) => { if (live) { setSchool(result.school); setCalendar(result.calendar); } }).catch(() => undefined);
    return () => { live = false; };
  }, []));

  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>School Term Dates</Text>
      {school ? (
        <>
          <Text style={styles.subtitle}>These dates come from {school.name} and are read only. They control whether the app treats a date as Term Time or Holiday.</Text>
          <Card style={styles.schoolCard}><Text style={styles.label}>LINKED SCHOOL</Text><Text style={styles.schoolName}>{school.name}</Text><Text style={styles.mode}>{school.school_mode?.toUpperCase()}</Text></Card>
          {calendar.map((entry) => <Card key={entry.id} style={styles.dateCard}><View style={styles.rowBetween}><View style={styles.flex}><Text style={styles.label}>{LABELS[entry.entry_type]}</Text><Text style={styles.entryName}>{entry.name}</Text></View><Text style={styles.date}>{formatSchoolDate(entry.start_date)}{entry.end_date !== entry.start_date ? `\n${formatSchoolDate(entry.end_date)}` : ''}</Text></View></Card>)}
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>No school is linked to this account. You can keep using personal term dates, or link a subscribed school from Profile & Account.</Text>
          <Pressable style={styles.primary} onPress={() => router.push('/(app)/profile')}><Text style={styles.primaryText}>OPEN PROFILE & ACCOUNT</Text></Pressable>
          <Pressable style={styles.outline} onPress={() => router.push({ pathname: '/(app)/settings/[section]', params: { section: 'term-dates' } })}><Text style={styles.outlineText}>PERSONAL TERM DATES</Text></Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  schoolCard: { borderColor: colours.gold, marginBottom: 10 },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  schoolName: { color: colours.white, fontSize: 18, fontWeight: '900', marginTop: 5 },
  mode: { color: colours.muted, fontSize: 8, fontWeight: '900', marginTop: 4 },
  dateCard: { marginBottom: 7, paddingVertical: 11 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1 },
  entryName: { color: colours.white, fontSize: 12, fontWeight: '900', marginTop: 3 },
  date: { color: colours.white, fontSize: 10, lineHeight: 16, fontWeight: '800', textAlign: 'right', marginLeft: 12 },
  primary: { minHeight: 48, backgroundColor: colours.gold, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colours.background, fontSize: 10, fontWeight: '900' },
  outline: { minHeight: 46, borderWidth: 1, borderColor: colours.gold, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  outlineText: { color: colours.gold, fontSize: 10, fontWeight: '900' },
});
