import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

const LINKS = [
  ['👤', 'PROFILE & ACCOUNT', 'Email, display name and date of birth.', 'profile'],
  ['🏋️', 'EXERCISE LIBRARY', 'Exercises, equipment and custom exercises.', 'exercise-library'],
  ['🏉', 'SPORTS & ACTIVITIES', 'Review the activity library and add your own.', 'sports'],
  ['⏱️', 'EXERCISE TIMING', 'Rep pace, rest and duration assumptions.', 'timing'],
  ['📈', 'STRENGTH TRACKING', 'Best 10-Rep Weight and estimated 1RM reference.', 'strength-tracking'],
  ['🎯', 'TARGETS', 'Month, year, weight and body-fat goals.', 'targets'],
  ['◎', 'STATS & MEASUREMENTS', 'Add or remove advanced measurements from Core.', 'measurements'],
  ['🏫', 'SCHOOL TERM DATES', 'Configure Term Time and Holiday periods.', 'term-dates'],
] as const;

export default function NerdScreen() {
  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>Secret Nerd Stuff</Text>
        <View style={styles.list}>
          {LINKS.map(([emoji, title, text, section]) => (
            <Pressable key={title} style={styles.link} onPress={() => section === 'profile' ? router.push('/(app)/profile') : router.push({ pathname: '/(app)/settings/[section]', params: { section } })}>
              <Text style={styles.emoji}>{emoji}</Text>
              <View style={styles.copy}>
                <Text style={styles.linkTitle}>{title}</Text>
                <Text style={styles.linkText}>{text}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <BottomNav active="nerd" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 },
  scroll: { flex: 1 },
  content: { paddingBottom: 10 },
  title: { color: colours.white, fontSize: 29, lineHeight: 33, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  list: { gap: 9 },
  link: {
    height: 94,
    borderWidth: 1,
    borderColor: colours.gold,
    borderRadius: 13,
    backgroundColor: colours.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  emoji: { width: 51, fontSize: 29, textAlign: 'center', marginRight: 8 },
  copy: { flex: 1, justifyContent: 'center' },
  linkTitle: { color: colours.white, fontSize: 14, lineHeight: 18, fontWeight: '900', letterSpacing: 0.15 },
  linkText: { color: colours.muted, fontSize: 10, fontWeight: '600', lineHeight: 15, marginTop: 4, paddingRight: 5 },
  arrow: { color: colours.gold, fontSize: 27, lineHeight: 29, fontWeight: '400', marginLeft: 8 },
});
