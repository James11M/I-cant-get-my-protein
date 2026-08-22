import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

const LINKS = [
  ['🏋️', 'EXERCISE LIBRARY', 'Exercises, equipment and custom exercises.', 'exercise-library'],
  ['🏉', 'SPORTS & ACTIVITIES', 'Review the activity library and add your own.', 'sports'],
  ['⏱️', 'EXERCISE TIMING', 'Rep pace, rest and duration assumptions.', 'timing'],
  ['📈', 'STRENGTH TRACKING', 'Best 10-Rep Weight and estimated 1RM reference.', 'strength-tracking'],
  ['🎯', 'TARGETS', 'Month, year, weight and body-fat goals.', 'targets'],
  ['◎', 'STATS & MEASUREMENTS', 'Add or remove advanced measurements from Core.', 'measurements'],
  ['🏫', 'SCHOOL TERM DATES', 'Configure optional Term Time and Holiday periods.', 'term-dates'],
] as const;

export default function NerdScreen() {
  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <Brand />
      <Text style={styles.title}>Secret Nerd Stuff</Text>
      <View style={styles.list}>
        {LINKS.map(([emoji, title, text, section]) => (
          <Pressable key={title} style={styles.link} onPress={() => router.push({ pathname: '/(app)/settings/[section]', params: { section } })}>
            <View style={styles.iconCircle}><Text style={styles.emoji}>{emoji}</Text></View>
            <View style={styles.copy}><Text style={styles.linkTitle}>{title}</Text><Text style={styles.linkText}>{text}</Text></View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.spacer} />
      <BottomNav active="nerd" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 },
  title: { color: colours.white, fontSize: 29, lineHeight: 33, fontWeight: '900', marginTop: 19, marginBottom: 11 },
  list: { gap: 7 },
  link: { minHeight: 58, borderWidth: 1, borderColor: colours.gold, borderRadius: 13, backgroundColor: colours.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 8 },
  iconCircle: { width: 37, height: 37, borderRadius: 19, backgroundColor: colours.card2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  emoji: { fontSize: 19 }, copy: { flex: 1 },
  linkTitle: { color: colours.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  linkText: { color: colours.muted, fontSize: 8, fontWeight: '600', lineHeight: 11, marginTop: 3 },
  arrow: { color: colours.gold, fontSize: 24, fontWeight: '300', marginLeft: 7 },
  spacer: { flex: 1 },
});
