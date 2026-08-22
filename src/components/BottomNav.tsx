import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
        <MaterialCommunityIcons name="home" size={25} color={active === 'today' ? colours.white : colours.muted} />
        <Text style={[styles.label, active === 'today' && styles.active]}>TODAY</Text>
      </Pressable>

      <Pressable style={styles.item} onPress={() => router.push('/(app)/history')}>
        <MaterialCommunityIcons name="clock" size={24} color={active === 'history' ? colours.white : colours.muted} />
        <Text style={[styles.label, active === 'history' && styles.active]}>HISTORY</Text>
      </Pressable>

      <Pressable style={styles.add} onPress={() => router.push('/(app)/add')}>
        <View style={styles.addCircle}>
          <MaterialCommunityIcons name="plus" size={30} color={colours.background} />
        </View>
        <Text style={styles.addLabel}>ADD</Text>
      </Pressable>

      <View style={styles.item}>
        <MaterialCommunityIcons name="podium" size={25} color={active === 'leaders' ? colours.white : colours.muted} />
        <Text style={[styles.label, active === 'leaders' && styles.active]}>LEADERS</Text>
      </View>

      <View style={styles.item}>
        <MaterialCommunityIcons name="cog" size={25} color={active === 'nerd' ? colours.white : colours.muted} />
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
    paddingBottom: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', minHeight: 52 },
  label: { color: colours.muted, fontSize: 7, fontWeight: '900', marginTop: 5, letterSpacing: 0.8 },
  active: { color: colours.white },
  add: { flex: 1, alignItems: 'center', minHeight: 62, marginTop: -12 },
  addCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colours.gold },
  addLabel: { color: colours.gold, fontSize: 7, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
});
