import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { colours } from '@/theme/colours';

type Props = {
  active?: 'today' | 'history' | 'leaders' | 'nerd';
};

export function BottomNav({ active = 'today' }: Props) {
  return (
    <View style={styles.nav}>
      <Pressable style={styles.item} onPress={() => router.replace('/(app)')}>
        <Text style={[styles.icon, active === 'today' && styles.active]}>⌂</Text>
        <Text style={[styles.label, active === 'today' && styles.active]}>TODAY</Text>
      </Pressable>

      <Pressable style={styles.item} onPress={() => router.push('/(app)/history')}>
        <Text style={[styles.icon, active === 'history' && styles.active]}>◷</Text>
        <Text style={[styles.label, active === 'history' && styles.active]}>HISTORY</Text>
      </Pressable>

      <Pressable style={styles.add} onPress={() => router.push('/(app)/add')}>
        <Text style={styles.addIcon}>+</Text>
        <Text style={styles.addLabel}>ADD</Text>
      </Pressable>

      <View style={styles.item}>
        <Text style={[styles.icon, active === 'leaders' && styles.active]}>▥</Text>
        <Text style={[styles.label, active === 'leaders' && styles.active]}>LEADERS</Text>
      </View>

      <View style={styles.item}>
        <Text style={[styles.icon, active === 'nerd' && styles.active]}>⚙</Text>
        <Text style={[styles.label, active === 'nerd' && styles.active]}>NERD</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colours.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
  },
  item: { flex: 1, alignItems: 'center', minHeight: 50 },
  icon: { color: colours.muted, fontSize: 21, fontWeight: '900', lineHeight: 24 },
  label: { color: colours.muted, fontSize: 7, fontWeight: '900', marginTop: 4, letterSpacing: 0.8 },
  active: { color: colours.white },
  add: { flex: 1, alignItems: 'center', minHeight: 58, marginTop: -10 },
  addIcon: { width: 42, height: 42, borderRadius: 21, textAlign: 'center', lineHeight: 39, backgroundColor: colours.gold, color: colours.background, fontSize: 30, fontWeight: '700' },
  addLabel: { color: colours.gold, fontSize: 7, fontWeight: '900', marginTop: 3, letterSpacing: 1 },
});
