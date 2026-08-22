import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

export default function WorkoutScreen() {
  return (
    <Screen>
      <Brand />
      <BackButton />
      <Text style={styles.title}>Workout</Text>
      <Text style={styles.subtitle}>Estimated duration: 1 min</Text>

      <Pressable style={styles.outline}><Text style={styles.outlineText}>+  ADD EXERCISE</Text></Pressable>
      <Pressable style={styles.finish}><Text style={styles.finishText}>FINISH</Text></Pressable>
      <View style={styles.spacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colours.white, fontSize: 31, fontWeight: '900' },
  subtitle: { color: colours.muted, fontSize: 11, fontWeight: '700', marginTop: 5, marginBottom: 22 },
  outline: { borderWidth: 1, borderColor: colours.gold, borderRadius: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: colours.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  finish: { backgroundColor: colours.gold, borderRadius: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  finishText: { color: colours.background, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  spacer: { flex: 1 },
});
