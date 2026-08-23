import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

export default function AddTrainingScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const dated = Boolean(date);
  const suffix = date ? ` • ${formatDate(date)}` : '';
  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <Brand />
      <Text style={styles.title}>Add Training{suffix}</Text>
      {dated ? <Text style={styles.subtitle}>This training will be added to the selected History day.</Text> : null}

      <Choice emoji="🏉" title="SPORT / ACTIVITY" text="PE, sport, cardio and recovery." onPress={() => router.push({ pathname: '/(app)/activity', params: date ? { date } : {} })} />
      <Choice emoji="🏋️" title="STRENGTH TRAINING" text="Quick Start or use a saved workout template." onPress={() => router.push({ pathname: '/(app)/strength', params: date ? { date } : {} })} />

      <View style={styles.spacer} />
      <BottomNav />
    </Screen>
  );
}

function Choice({ emoji, title, text, onPress }: { emoji: string; title: string; text: string; onPress: () => void }) {
  return <Pressable style={styles.choice} onPress={onPress}><View style={styles.iconCircle}><Text style={styles.emoji}>{emoji}</Text></View><View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceText}>{text}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;
}
function formatDate(value: string) { const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`; }

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 }, title: { color: colours.white, fontSize: 31, lineHeight: 35, fontWeight: '900', marginTop: 25, marginBottom: 7 }, subtitle: { color: colours.muted, fontSize: 10, lineHeight: 15, marginBottom: 14 },
  choice: { minHeight: 91, borderWidth: 1, borderColor: colours.gold, borderRadius: 16, backgroundColor: colours.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 14, marginBottom: 13 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colours.card2, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, emoji: { fontSize: 25 }, choiceCopy: { flex: 1 }, choiceTitle: { color: colours.white, fontSize: 14, fontWeight: '900', letterSpacing: 0.3 }, choiceText: { color: colours.muted, fontSize: 10, fontWeight: '600', marginTop: 5, lineHeight: 14 }, arrow: { color: colours.gold, fontSize: 31, lineHeight: 32, fontWeight: '300', marginLeft: 8 }, spacer: { flex: 1 },
});
