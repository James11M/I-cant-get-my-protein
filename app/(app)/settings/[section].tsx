import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

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
  'term-dates': { title: 'School Term Dates', subtitle: 'Optional term-time and holiday periods.' },
};

export default function SettingsSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const content = SECTIONS[section || ''] || { title: 'Settings', subtitle: '' };
  return (
    <Screen>
      <Brand />
      <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹  BACK</Text></Pressable>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.subtitle}>{content.subtitle}</Text>
      <Card style={styles.card}>
        <Text style={styles.label}>FULL POC SCREEN</Text>
        <Text style={styles.copy}>This route is now in place and ready for the next POC screen implementation without changing the approved navigation or visual system.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', marginTop: 21, marginBottom: 12 },
  backText: { color: colours.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colours.white, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 17 },
  card: { borderColor: colours.border },
  label: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  copy: { color: colours.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
});
